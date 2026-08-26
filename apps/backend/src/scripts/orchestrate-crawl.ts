import { DbClient } from "@/db/client";
import { dbEnv } from "@/db/env";
import { queueEnv } from "@/queue/env";
import { orchestrateCrawlEnv } from "./orchestrate-crawl-env.ts";
import { LoggerFactory } from "@/logging/logger";
import { StoreCrawlRepository } from "@/modules/store/crawl-repository";
import { QueueConnection } from "@/queue/queue-connection";
import { HomepageCrawlPublisher } from "@/queue/homepage-crawl-publisher";

class OrchestrateCrawlCommand {
  static async run(): Promise<void> {
    const logger = LoggerFactory.create("orchestrate-crawl");
    const db = DbClient.create(dbEnv.DATABASE_URL);
    const connection = new QueueConnection(queueEnv.RABBITMQ_URL, logger);
    const publisher = new HomepageCrawlPublisher(connection, logger);

    const stores = await StoreCrawlRepository.getPendingForCrawl(
      db,
      orchestrateCrawlEnv.CRAWL_BATCH_SIZE,
      orchestrateCrawlEnv.CRAWL_STALE_AFTER_MS,
    );

    for (const store of stores) {
      await publisher.publish({ storeId: store.id, domain: store.domain });
    }

    logger.info({ published: stores.length }, "sweep complete");

    await connection.close();
    await db.destroy();
  }
}

await OrchestrateCrawlCommand.run();
