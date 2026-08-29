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

  it("record() inserts new technologies as 'added' events and returns them", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "tech.myshopify.com", name: null });

    const events = await StoreTechnologyRepository.record(testDb.db, store.id, [
      { name: "Shopify", category: "ecommerce" },
      { name: "Klaviyo", category: "email" },
    ]);

    expect(events.map((e) => e.name).sort()).toEqual(["Klaviyo", "Shopify"]);
    expect(events.every((e) => e.eventType === "added")).toBe(true);

    const active = await StoreTechnologyRepository.getActiveByStore(testDb.db, store.id);
    expect(active.map((t) => t.name).sort()).toEqual(["Klaviyo", "Shopify"]);
    expect(active.every((t) => t.eventType === "added")).toBe(true);
  });

  it("record() ignores a category change on an already-active technology", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "category.myshopify.com", name: null });
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);

    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "marketing" }]);

    const rows = await testDb.db
      .selectFrom("store_technologies")
      .selectAll()
      .where("store_id", "=", store.id)
      .execute();
    expect(rows).toHaveLength(1);

    const active = await StoreTechnologyRepository.getActiveByStore(testDb.db, store.id);
    expect(active[0]?.category).toBe("email");
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

  it("record() returns no events when nothing changed", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "no-events.myshopify.com", name: null });
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);

    const events = await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);

    expect(events).toEqual([]);
  });

  it("record() emits a 'removed' event for a technology missing from the new crawl", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "deleted.myshopify.com", name: null });
    await StoreTechnologyRepository.record(testDb.db, store.id, [
      { name: "Klaviyo", category: "email" },
      { name: "Shopify", category: "ecommerce" },
    ]);

    // Next crawl no longer detects Klaviyo.
    const events = await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Shopify", category: "ecommerce" }]);
    expect(events).toEqual([{ name: "Klaviyo", category: "email", eventType: "removed" }]);

    const active = await StoreTechnologyRepository.getActiveByStore(testDb.db, store.id);
    expect(active.map((t) => t.name)).toEqual(["Shopify"]);

    const rows = await testDb.db
      .selectFrom("store_technologies")
      .selectAll()
      .where("store_id", "=", store.id)
      .where("name", "=", "Klaviyo")
      .orderBy("created_at", "desc")
      .execute();
    expect(rows[0]?.event_type).toBe("removed");
  });

  it("record() reintroduces a previously removed technology as an 'added' event", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "resurrect.myshopify.com", name: null });
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);
    await StoreTechnologyRepository.record(testDb.db, store.id, []);

    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);

    const active = await StoreTechnologyRepository.getActiveByStore(testDb.db, store.id);
    expect(active).toHaveLength(1);
    expect(active[0]?.eventType).toBe("added");
  });

  it("getEventsByStore() returns the full history, most recent first", async () => {
    const store = await StoreRepository.create(testDb.db, { domain: "history.myshopify.com", name: null });
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);
    await StoreTechnologyRepository.record(testDb.db, store.id, []);

    const events = await StoreTechnologyRepository.getEventsByStore(testDb.db, store.id);

    expect(events).toHaveLength(2);
    expect(events[0]?.eventType).toBe("removed");
    expect(events[1]?.eventType).toBe("added");
  });
});
