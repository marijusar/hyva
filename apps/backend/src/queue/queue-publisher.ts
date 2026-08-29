import type { Channel } from "amqp-connection-manager";
import { DLX, EXCHANGE, QueueConnection } from "./queue-connection.ts";
import type { Logger } from "@/logging/logger";

export interface QueueTopology {
  queue: string;
  dlq: string;
  routingKey: string;
}

export abstract class QueuePublisher<TJob> {
  constructor(
    private readonly connection: QueueConnection,
    private readonly topology: QueueTopology,
    protected readonly logger: Logger,
  ) {
    this.connection
      .getChannel()
      .addSetup((channel: Channel) => this.assertTopology(channel));
  }

  async publish(job: TJob): Promise<void> {
    await this.connection
      .getChannel()
      .publish(EXCHANGE, this.topology.routingKey, job, { persistent: true });
    this.logger.info({ job }, "published");
  }

  private async assertTopology(channel: Channel): Promise<void> {
    const { queue, dlq, routingKey } = this.topology;
    await channel.assertQueue(queue, {
      durable: true,
      arguments: { "x-dead-letter-exchange": DLX },
    });
    await channel.bindQueue(queue, EXCHANGE, routingKey);

    await channel.assertQueue(dlq, { durable: true });
    await channel.bindQueue(dlq, DLX, routingKey);
  }
}
