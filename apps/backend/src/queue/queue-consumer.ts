import type { Channel } from "amqp-connection-manager";
import type { ConsumeMessage } from "amqplib";
import { z } from "zod";
import { DLX, EXCHANGE, QueueConnection } from "./queue-connection.ts";
import type { QueueTopology } from "./queue-publisher.ts";
import type { Logger } from "@/logging/logger";

export interface QueueConsumerTopology<TJob> extends QueueTopology {
  schema: z.ZodType<TJob>;
}

export abstract class QueueConsumer<TJob> {
  constructor(
    private readonly connection: QueueConnection,
    private readonly topology: QueueConsumerTopology<TJob>,
    protected readonly logger: Logger,
  ) {
    this.connection.getChannel().addSetup((channel: Channel) => this.assertTopology(channel));
  }

  async consume(handler: (job: TJob) => Promise<void>, concurrency: number): Promise<void> {
    const { queue, schema } = this.topology;
    const channel = this.connection.getChannel();
    await channel.waitForConnect();
    await channel.consume(
      queue,
      async (message: ConsumeMessage | null) => {
        if (!message) return;

        try {
          const job = schema.parse(JSON.parse(message.content.toString()));
          await handler(job);
          channel.ack(message);
        } catch (error) {
          const reason = error instanceof z.ZodError ? "malformed job" : "handler failed";
          this.logger.error({ err: error, raw: message.content.toString() }, `${reason}, routing to DLQ`);
          channel.nack(message, false, false);
        }
      },
      { prefetch: concurrency },
    );

    this.logger.info({ queue, concurrency }, "consuming");
  }

  private async assertTopology(channel: Channel): Promise<void> {
    const { queue, dlq, routingKey } = this.topology;
    await channel.assertQueue(queue, { durable: true, arguments: { "x-dead-letter-exchange": DLX } });
    await channel.bindQueue(queue, EXCHANGE, routingKey);

    await channel.assertQueue(dlq, { durable: true });
    await channel.bindQueue(dlq, DLX, routingKey);
  }
}
