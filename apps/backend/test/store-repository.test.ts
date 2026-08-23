import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StoreRepository } from "#src/modules/store/repository";
import { TestDatabase } from "./utils/database.ts";

describe("StoreRepository", () => {
  const testDb = new TestDatabase();

  beforeEach(async () => {
    await testDb.setup();
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  describe("create", () => {
    it("creates a store and returns a Store instance with generated id/createdAt", async () => {
      const store = await StoreRepository.create(testDb.db, { domain: "example.myshopify.com", name: "Example" });

      expect(store.id).toBeTruthy();
      expect(store.domain).toBe("example.myshopify.com");
      expect(store.name).toBe("Example");
      expect(store.createdAt).toBeInstanceOf(Date);
    });

    it("allows a null name", async () => {
      const store = await StoreRepository.create(testDb.db, { domain: "noname.myshopify.com", name: null });

      expect(store.name).toBeNull();
    });

    it("rejects a duplicate domain", async () => {
      await StoreRepository.create(testDb.db, { domain: "dup.myshopify.com", name: null });

      await expect(StoreRepository.create(testDb.db, { domain: "dup.myshopify.com", name: null })).rejects.toThrow();
    });
  });

  describe("getById", () => {
    it("returns the matching store", async () => {
      const created = await StoreRepository.create(testDb.db, { domain: "byid.myshopify.com", name: null });

      const found = await StoreRepository.getById(testDb.db, created.id);

      expect(found?.domain).toBe("byid.myshopify.com");
    });

    it("returns undefined for a missing id", async () => {
      const found = await StoreRepository.getById(testDb.db, "00000000-0000-0000-0000-000000000000");

      expect(found).toBeUndefined();
    });
  });

  describe("getByDomain", () => {
    it("returns the matching store", async () => {
      await StoreRepository.create(testDb.db, { domain: "bydomain.myshopify.com", name: null });

      const found = await StoreRepository.getByDomain(testDb.db, "bydomain.myshopify.com");

      expect(found?.domain).toBe("bydomain.myshopify.com");
    });

    it("returns undefined for an unknown domain", async () => {
      const found = await StoreRepository.getByDomain(testDb.db, "nope.myshopify.com");

      expect(found).toBeUndefined();
    });
  });

  it("isolates data between tests (no leftover rows from a previous test)", async () => {
    const found = await StoreRepository.getByDomain(testDb.db, "dup.myshopify.com");

    expect(found).toBeUndefined();
  });
});
