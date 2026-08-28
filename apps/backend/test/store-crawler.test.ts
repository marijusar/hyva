import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StoreRepository } from "#src/modules/store/repository";
import { StoreCrawler } from "#src/crawler/store-crawler";
import { TechnologyFingerprints } from "#src/crawler/technology-fingerprints";
import { TechnologyMatcher } from "#src/crawler/technology-matcher";
import type { FetchedPage, PageFetcher } from "#src/crawler/page-fetcher";
import type { TechnologyEventJob, TechnologyEventPublisher } from "#src/queue/technology-event-publisher";
import { LoggerFactory } from "#src/logging/logger";
import { TestDatabase } from "./utils/database.ts";

class FakePageFetcher implements PageFetcher {
  constructor(private readonly page: FetchedPage | null) {}

  async fetch(): Promise<FetchedPage | null> {
    return this.page;
  }
}

class FakeTechnologyEventPublisher implements TechnologyEventPublisher {
  readonly published: TechnologyEventJob[] = [];

  async publish(job: TechnologyEventJob): Promise<void> {
    this.published.push(job);
  }
}

describe("StoreCrawler", () => {
  const testDb = new TestDatabase();
  const matcher = new TechnologyMatcher(new TechnologyFingerprints());
  const logger = LoggerFactory.create("test");

  beforeEach(async () => {
    await testDb.setup();
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  it("records a dead attempt and nothing else when the fetch fails", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "dead.myshopify.com", name: null });
    const publisher = new FakeTechnologyEventPublisher();
    const crawler = new StoreCrawler(matcher, new FakePageFetcher(null), publisher, logger);

    await crawler.crawlHomepage(testDb.db, store);

    const crawls = await testDb.db.selectFrom("store_crawls").selectAll().where("store_id", "=", store.id).execute();
    expect(crawls.map((c) => c.status)).toEqual(["dead"]);

    const metadata = await testDb.db
      .selectFrom("store_metadata")
      .selectAll()
      .where("store_id", "=", store.id)
      .execute();
    expect(metadata).toHaveLength(0);
    expect(publisher.published).toEqual([]);
  });

  it("records an error status for a non-2xx response", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "broken.myshopify.com", name: null });
    const publisher = new FakeTechnologyEventPublisher();
    const crawler = new StoreCrawler(
      matcher,
      new FakePageFetcher({ html: "<html></html>", statusCode: 500 }),
      publisher,
      logger,
    );

    await crawler.crawlHomepage(testDb.db, store);

    const crawls = await testDb.db.selectFrom("store_crawls").selectAll().where("store_id", "=", store.id).execute();
    expect(crawls.map((c) => c.status)).toEqual(["error"]);
  });

  it("detects platform, technologies, and homepage text for an active Shopify page, and publishes the technology events", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "active.myshopify.com", name: null });
    const html = `
      <html>
        <head>
          <title>Test Store</title>
          <meta name="description" content="A test shop.">
          <script src="https://cdn.shopify.com/s/files/foo.js"></script>
        </head>
        <body></body>
      </html>
    `;
    const publisher = new FakeTechnologyEventPublisher();
    const crawler = new StoreCrawler(matcher, new FakePageFetcher({ html, statusCode: 200 }), publisher, logger);

    await crawler.crawlHomepage(testDb.db, store);

    const crawls = await testDb.db.selectFrom("store_crawls").selectAll().where("store_id", "=", store.id).execute();
    expect(crawls.map((c) => c.status)).toEqual(["active"]);

    const metadata = await testDb.db
      .selectFrom("store_metadata")
      .selectAll()
      .where("store_id", "=", store.id)
      .executeTakeFirstOrThrow();
    expect(metadata.platform).toBe("shopify");
    expect(metadata.homepage_text).toBe("Test Store — A test shop.");

    const technologies = await testDb.db
      .selectFrom("store_technologies")
      .selectAll()
      .where("store_id", "=", store.id)
      .execute();
    expect(technologies).toContainEqual(expect.objectContaining({ name: "Shopify", category: "Ecommerce" }));

    expect(publisher.published).toContainEqual(
      expect.objectContaining({ storeId: store.id, name: "Shopify", eventType: "added" }),
    );
  });
});
