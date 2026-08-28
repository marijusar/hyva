import { DbClient } from "@/db/client";
import { dbEnv } from "@/db/env";
import { queueEnv } from "@/queue/env";
import { homepageWorkerEnv } from "./homepage-worker-env.ts";
import { LoggerFactory } from "@/logging/logger";
import { TechnologyFingerprints } from "@/crawler/technology-fingerprints";
import { TechnologyMatcher } from "@/crawler/technology-matcher";
import { StoreCrawler } from "@/crawler/store-crawler";
import { HttpPageFetcher } from "@/crawler/page-fetcher";
import { StoreRepository } from "@/modules/store/repository";
import { QueueConnection } from "@/queue/queue-connection";
import { HomepageCrawlConsumer } from "@/queue/homepage-crawl-consumer";
import { QueueTechnologyEventPublisher } from "@/queue/technology-event-publisher";

export class HomepageWorker {
  static async start(): Promise<void> {
    const logger = LoggerFactory.create("homepage-worker");
    const db = DbClient.create(dbEnv.DATABASE_URL);
    const connection = new QueueConnection(queueEnv.RABBITMQ_URL, logger);
    const consumer = new HomepageCrawlConsumer(connection, logger);
    const matcher = new TechnologyMatcher(new TechnologyFingerprints());
    const publisher = new QueueTechnologyEventPublisher(connection, logger);
    const crawler = new StoreCrawler(matcher, new HttpPageFetcher(logger), publisher, logger);

    await consumer.consume(async (job) => {
      const store = await StoreRepository.getById(db, job.storeId);
      if (!store) return;

      await crawler.crawlHomepage(db, store);
    }, homepageWorkerEnv.HOMEPAGE_WORKER_CONCURRENCY);
  }
}

HomepageWorker.start();
