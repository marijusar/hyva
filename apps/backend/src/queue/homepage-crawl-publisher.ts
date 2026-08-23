import type { Channel } from "amqp-connection-manager";
import { z } from "zod";
import { DLX, EXCHANGE, QueueConnection } from "./queue-connection.ts";
import type { Logger } from "../logging/logger.ts";

const QUEUE = "crawl.homepage.q";
const DLQ = "crawl.homepage.dlq";
const ROUTING_KEY = "crawl.homepage";

export const homepageCrawlJobSchema = z.object({
  storeId: z.uuid(),
  domain: z.string(),
});

export type HomepageCrawlJob = z.infer<typeof homepageCrawlJobSchema>;

export class HomepageCrawlPublisher {
  private readonly logger: Logger;

  constructor(
    private readonly connection: QueueConnection,
    logger: Logger,
  ) {
    this.logger = logger.child({ module: "[HOMEPAGE_CRAWLER_PUBLISHER]" });
    this.connection.getChannel().addSetup((channel: Channel) => HomepageCrawlPublisher.assertTopology(channel));
  }

  async publish(job: HomepageCrawlJob): Promise<void> {
    await this.connection.getChannel().publish(EXCHANGE, ROUTING_KEY, job, {
      persistent: true,
    });
    this.logger.info({ job }, "published");
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
