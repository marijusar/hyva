import { DbClient } from "../db/client.ts";
import { dbEnv } from "../db/env.ts";
import { queueEnv } from "../queue/env.ts";
import { homepageWorkerEnv } from "./homepage-worker-env.ts";
import { LoggerFactory } from "../logging/logger.ts";
import { TechnologyFingerprints } from "../crawler/technology-fingerprints.ts";
import { TechnologyMatcher } from "../crawler/technology-matcher.ts";
import { StoreCrawler } from "../crawler/store-crawler.ts";
import { HttpPageFetcher } from "../crawler/page-fetcher.ts";
import { StoreRepository } from "../modules/store/repository.ts";
import { QueueConnection } from "../queue/queue-connection.ts";
import { HomepageCrawlConsumer } from "../queue/homepage-crawl-consumer.ts";

export class HomepageWorker {
  static async start(): Promise<void> {
    const logger = LoggerFactory.create("homepage-worker");
    const db = DbClient.create(dbEnv.DATABASE_URL);
    const connection = new QueueConnection(queueEnv.RABBITMQ_URL, logger);
    const consumer = new HomepageCrawlConsumer(connection, logger);
    const matcher = new TechnologyMatcher(new TechnologyFingerprints());
    const crawler = new StoreCrawler(matcher, new HttpPageFetcher(logger), logger);

    await consumer.consume(async (job) => {
      const store = await StoreRepository.getById(db, job.storeId);
      if (!store) return;

      await crawler.crawlHomepage(db, store);
    }, homepageWorkerEnv.HOMEPAGE_WORKER_CONCURRENCY);
  }
}

HomepageWorker.start();
