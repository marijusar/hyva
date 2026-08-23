import type { Channel } from "amqp-connection-manager";
import type { ConsumeMessage } from "amqplib";
import { z } from "zod";
import { DLX, EXCHANGE, QueueConnection } from "./queue-connection.ts";
import { homepageCrawlJobSchema, type HomepageCrawlJob } from "./homepage-crawl-publisher.ts";
import type { Logger } from "../logging/logger.ts";

const QUEUE = "crawl.homepage.q";
const DLQ = "crawl.homepage.dlq";
const ROUTING_KEY = "crawl.homepage";

export class HomepageCrawlConsumer {
  private readonly logger: Logger;

  constructor(
    private readonly connection: QueueConnection,
    logger: Logger,
  ) {
    this.logger = logger.child({ module: "[HOMEPAGE_CRAWLER_CONSUMER]" });
    this.connection.getChannel().addSetup((channel: Channel) => HomepageCrawlConsumer.assertTopology(channel));
  }

  async consume(handler: (job: HomepageCrawlJob) => Promise<void>, concurrency: number): Promise<void> {
    const channel = this.connection.getChannel();
    await channel.waitForConnect();
    await channel.consume(
      QUEUE,
      async (message: ConsumeMessage | null) => {
        if (!message) return;

        try {
          const job = homepageCrawlJobSchema.parse(JSON.parse(message.content.toString()));
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

    this.logger.info({ queue: QUEUE, concurrency }, "consuming");
  }

  private static async assertTopology(channel: Channel): Promise<void> {
    await channel.assertQueue(QUEUE, {
      durable: true,
      arguments: { "x-dead-letter-exchange": DLX },
    });
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    await channel.assertQueue(DLQ, { durable: true });
    await channel.bindQueue(DLQ, DLX, ROUTING_KEY);
  }
}
