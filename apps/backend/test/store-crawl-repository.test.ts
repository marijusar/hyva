import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StoreRepository } from "#src/modules/store/repository";
import { StoreCrawlRepository } from "#src/modules/store/crawl-repository";
import { TestDatabase } from "./utils/database.ts";

describe("StoreCrawlRepository", () => {
  const testDb = new TestDatabase();

  beforeEach(async () => {
    await testDb.setup();
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  it("record() always appends, even when the status is unchanged", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "crawl.myshopify.com", name: null });

    await StoreCrawlRepository.record(testDb.db, store.id, "active");
    await StoreCrawlRepository.record(testDb.db, store.id, "active");

    const rows = await testDb.db.selectFrom("store_crawls").selectAll().where("store_id", "=", store.id).execute();
    expect(rows).toHaveLength(2);
  });

  it("getLatestByStore() returns the most recent attempt", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "latest.myshopify.com", name: null });

    await StoreCrawlRepository.record(testDb.db, store.id, "error");
    const latest = await StoreCrawlRepository.record(testDb.db, store.id, "active");

    const found = await StoreCrawlRepository.getLatestByStore(testDb.db, store.id);
    expect(found?.id).toBe(latest.id);
    expect(found?.status).toBe("active");
  });

  describe("getPendingForCrawl", () => {
    it("includes a store with no crawl rows yet", async () => {
      const store = await StoreRepository.create(testDb.db, { domain: "never.myshopify.com", name: null });

      const pending = await StoreCrawlRepository.getPendingForCrawl(testDb.db, 10, 24 * 60 * 60 * 1000);

      expect(pending.map((s) => s.id)).toContain(store.id);
    });

    it("excludes a store crawled within the staleness window", async () => {
      const store = await StoreRepository.create(testDb.db, { domain: "fresh.myshopify.com", name: null });
      await StoreCrawlRepository.record(testDb.db, store.id, "active");

      const pending = await StoreCrawlRepository.getPendingForCrawl(testDb.db, 10, 24 * 60 * 60 * 1000);

      expect(pending.map((s) => s.id)).not.toContain(store.id);
    });

    it("includes a store whose only crawl is older than the staleness window", async () => {
      const store = await StoreRepository.create(testDb.db, { domain: "stale.myshopify.com", name: null });
      await StoreCrawlRepository.record(testDb.db, store.id, "active");

      // staleAfterMs = 0 means "anything not crawled in the last instant" is due
      const pending = await StoreCrawlRepository.getPendingForCrawl(testDb.db, 10, 0);

      expect(pending.map((s) => s.id)).toContain(store.id);
    });
  });
});
