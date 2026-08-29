import { z } from "zod";
import { QueuePublisher } from "./queue-publisher.ts";
import type { QueueConnection } from "./queue-connection.ts";
import type { Logger } from "@/logging/logger";

export const QUEUE = "crawl.homepage.q";
export const DLQ = "crawl.homepage.dlq";
export const ROUTING_KEY = "crawl.homepage";

export const homepageCrawlJobSchema = z.object({
  storeId: z.uuid(),
  domain: z.string(),
});

export type HomepageCrawlJob = z.infer<typeof homepageCrawlJobSchema>;

export class HomepageCrawlPublisher extends QueuePublisher<HomepageCrawlJob> {
  constructor(connection: QueueConnection, logger: Logger) {
    super(connection, { queue: QUEUE, dlq: DLQ, routingKey: ROUTING_KEY }, logger.child({ module: "[HOMEPAGE_CRAWLER_PUBLISHER]" }));
  }
}
