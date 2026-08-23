import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StoreRepository } from "#src/modules/store/repository";
import { StoreTechnologyRepository } from "#src/modules/store/technology-repository";
import { TestDatabase } from "./utils/database.ts";

describe("StoreTechnologyRepository", () => {
  const testDb = new TestDatabase();

  beforeEach(async () => {
    await testDb.setup();
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  it("record() inserts new technologies", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "tech.myshopify.com", name: null });

    await StoreTechnologyRepository.record(testDb.db, store.id, [
      { name: "Shopify", category: "ecommerce" },
      { name: "Klaviyo", category: "email" },
    ]);

    const active = await StoreTechnologyRepository.getActiveByStore(testDb.db, store.id);
    expect(active.map((t) => t.name).sort()).toEqual(["Klaviyo", "Shopify"]);
  });

  it("record() appends a new row when category changes", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "category.myshopify.com", name: null });
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);

    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "marketing" }]);

    const rows = await testDb.db
      .selectFrom("store_technologies")
      .selectAll()
      .where("store_id", "=", store.id)
      .execute();
    expect(rows).toHaveLength(2);

    const active = await StoreTechnologyRepository.getActiveByStore(testDb.db, store.id);
    expect(active).toHaveLength(1);
    expect(active[0]?.category).toBe("marketing");
  });

  it("record() inserts nothing when nothing changed", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "same.myshopify.com", name: null });
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);

    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);

    const rows = await testDb.db
      .selectFrom("store_technologies")
      .selectAll()
      .where("store_id", "=", store.id)
      .execute();
    expect(rows).toHaveLength(1);
  });

  it("record() soft-deletes a technology missing from the new crawl", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "deleted.myshopify.com", name: null });
    await StoreTechnologyRepository.record(testDb.db, store.id, [
      { name: "Klaviyo", category: "email" },
      { name: "Shopify", category: "ecommerce" },
    ]);

    // Next crawl no longer detects Klaviyo.
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Shopify", category: "ecommerce" }]);

    const active = await StoreTechnologyRepository.getActiveByStore(testDb.db, store.id);
    expect(active.map((t) => t.name)).toEqual(["Shopify"]);
  });

  it("record() reintroduces a previously deleted technology as a new row", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "resurrect.myshopify.com", name: null });
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);
    await StoreTechnologyRepository.record(testDb.db, store.id, []);

    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);

    const active = await StoreTechnologyRepository.getActiveByStore(testDb.db, store.id);
    expect(active).toHaveLength(1);
    expect(active[0]?.deletedAt).toBeNull();
  });
});
