import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppFactory } from "#src/app";
import { LoggerFactory } from "#src/logging/logger";
import { StoreRepository } from "#src/modules/store/repository";
import { StoreTechnologyRepository } from "#src/modules/store/technology-repository";
import { TechnologyCatalogRepository } from "#src/modules/technology/catalog-repository";
import { UserRepository } from "#src/modules/user/repository";
import { TestDatabase } from "./utils/database.ts";
import { registerAndLogin } from "./utils/auth.ts";
import { BillingSeeder } from "./utils/billing.ts";

describe("store search", () => {
  const testDb = new TestDatabase();

  beforeEach(async () => {
    await testDb.setup();
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  it("requires auth", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    expect((await app.request("/stores/search?q=bioma")).status).toBe(401);
  });

  it("400s on missing q", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "search-missing-q@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "search-missing-q@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);

    expect((await app.request("/stores/search", { headers: { cookie } })).status).toBe(400);
  });

  it("matches by domain substring", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "search-domain@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "search-domain@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);
    await StoreRepository.create(testDb.db, { domain: "mybiomastore.myshopify.com", name: null });

    const res = await app.request("/stores/search?q=bioma", { headers: { cookie } });
    const results = await res.json();

    expect(results.map((r: { domain: string }) => r.domain)).toEqual(["mybiomastore.myshopify.com"]);
  });

  it("matches by store name substring", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "search-name@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "search-name@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);
    await StoreRepository.create(testDb.db, { domain: "unrelated.myshopify.com", name: "Bioma Boutique" });

    const res = await app.request("/stores/search?q=bioma", { headers: { cookie } });
    const results = await res.json();

    expect(results.map((r: { name: string }) => r.name)).toEqual(["Bioma Boutique"]);
  });

  it("matches by technology name via the catalog, and returns matched_technologies", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "search-tech@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "search-tech@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);
    const store = await StoreRepository.create(testDb.db, { domain: "tech-search.myshopify.com", name: null });
    await TechnologyCatalogRepository.upsertMany(testDb.db, [{ name: "Klaviyo", category: "email" }]);
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);

    const res = await app.request("/stores/search?q=klav", { headers: { cookie } });
    const results = await res.json();

    expect(results).toEqual([
      expect.objectContaining({ domain: "tech-search.myshopify.com", matched_technologies: ["Klaviyo"] }),
    ]);
  });

  it("a technology in the catalog but not active on any store returns no results", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "search-tech-unused@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "search-tech-unused@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);
    await TechnologyCatalogRepository.upsertMany(testDb.db, [{ name: "Klaviyo", category: "email" }]);

    const res = await app.request("/stores/search?q=klav", { headers: { cookie } });
    expect(await res.json()).toEqual([]);
  });

  it("excludes a store whose only matching technology was removed", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "search-tech-removed@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "search-tech-removed@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);
    const store = await StoreRepository.create(testDb.db, { domain: "tech-removed.myshopify.com", name: null });
    await TechnologyCatalogRepository.upsertMany(testDb.db, [{ name: "Klaviyo", category: "email" }]);
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);
    await StoreTechnologyRepository.record(testDb.db, store.id, []);

    const res = await app.request("/stores/search?q=klav", { headers: { cookie } });
    expect(await res.json()).toEqual([]);
  });

  it("still returns a store when a different technology's later removal doesn't affect the matched one", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "search-distinct-on@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "search-distinct-on@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);
    const store = await StoreRepository.create(testDb.db, { domain: "distinct-on.myshopify.com", name: null });
    await TechnologyCatalogRepository.upsertMany(testDb.db, [
      { name: "Klaviyo", category: "email" },
      { name: "Klarna", category: "payments" },
    ]);

    await StoreTechnologyRepository.record(testDb.db, store.id, [
      { name: "Klaviyo", category: "email" },
      { name: "Klarna", category: "payments" },
    ]);
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);

    const res = await app.request("/stores/search?q=kla", { headers: { cookie } });
    const results = await res.json();

    expect(results.map((r: { domain: string }) => r.domain)).toEqual(["distinct-on.myshopify.com"]);
  });

  it("marks a result is_subscribed: true when the caller follows that store", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "search-subscribed@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "search-subscribed@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);
    await StoreRepository.create(testDb.db, { domain: "followed-search.myshopify.com", name: null });

    await app.request("/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ domain: "followed-search.myshopify.com" }),
    });

    const res = await app.request("/stores/search?q=followed-search", { headers: { cookie } });
    const results = await res.json();

    expect(results).toEqual([expect.objectContaining({ domain: "followed-search.myshopify.com", is_subscribed: true })]);
  });

  it("dedupes a store matched by both domain and technology", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "search-dedupe@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "search-dedupe@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);
    const store = await StoreRepository.create(testDb.db, { domain: "klaviyo-shop.myshopify.com", name: null });
    await TechnologyCatalogRepository.upsertMany(testDb.db, [{ name: "Klaviyo", category: "email" }]);
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);

    const res = await app.request("/stores/search?q=klaviyo", { headers: { cookie } });
    const results = await res.json();

    expect(results).toHaveLength(1);
  });
});
