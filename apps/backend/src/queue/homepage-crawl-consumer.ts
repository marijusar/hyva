import { QueueConsumer } from "./queue-consumer.ts";
import { QUEUE, DLQ, ROUTING_KEY, homepageCrawlJobSchema, type HomepageCrawlJob } from "./homepage-crawl-publisher.ts";
import type { QueueConnection } from "./queue-connection.ts";
import type { Logger } from "@/logging/logger";

export class HomepageCrawlConsumer extends QueueConsumer<HomepageCrawlJob> {
  constructor(connection: QueueConnection, logger: Logger) {
    super(
      connection,
      { queue: QUEUE, dlq: DLQ, routingKey: ROUTING_KEY, schema: homepageCrawlJobSchema },
      logger.child({ module: "[HOMEPAGE_CRAWLER_CONSUMER]" }),
    );
  }
}
