import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StoreRepository } from "#src/modules/store/repository";
import { StoreMetadataRepository } from "#src/modules/store/metadata-repository";
import { TestDatabase } from "./utils/database.ts";

describe("StoreMetadataRepository", () => {
  const testDb = new TestDatabase();

  beforeEach(async () => {
    await testDb.setup();
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  it("record() inserts on first observation", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "meta.myshopify.com", name: null });

    const recorded = await StoreMetadataRepository.record(testDb.db, store.id, "shopify", "Home");

    expect(recorded).not.toBeNull();
    expect(recorded?.platform).toBe("shopify");
  });

  it("record() inserts nothing when platform/homepageText are unchanged", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "same.myshopify.com", name: null });
    await StoreMetadataRepository.record(testDb.db, store.id, "shopify", "Home");

    const result = await StoreMetadataRepository.record(testDb.db, store.id, "shopify", "Home");

    expect(result).toBeNull();
    const rows = await testDb.db.selectFrom("store_metadata").selectAll().where("store_id", "=", store.id).execute();
    expect(rows).toHaveLength(1);
  });

  it("record() inserts a new row when platform changes", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "changed.myshopify.com", name: null });
    await StoreMetadataRepository.record(testDb.db, store.id, "other", "Home");

    const result = await StoreMetadataRepository.record(testDb.db, store.id, "shopify", "Home");

    expect(result).not.toBeNull();
    const rows = await testDb.db.selectFrom("store_metadata").selectAll().where("store_id", "=", store.id).execute();
    expect(rows).toHaveLength(2);
  });

  it("getLatestByStore() returns the newest row", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "newest.myshopify.com", name: null });
    await StoreMetadataRepository.record(testDb.db, store.id, "other", "Old");
    await StoreMetadataRepository.record(testDb.db, store.id, "shopify", "New");

    const found = await StoreMetadataRepository.getLatestByStore(testDb.db, store.id);

    expect(found?.homepageText).toBe("New");
  });
});
