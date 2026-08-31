import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppFactory } from "#src/app";
import { LoggerFactory } from "#src/logging/logger";
import { StoreRepository } from "#src/modules/store/repository";
import { StoreCrawlRepository } from "#src/modules/store/crawl-repository";
import { StoreMetadataRepository } from "#src/modules/store/metadata-repository";
import { StoreTechnologyRepository } from "#src/modules/store/technology-repository";
import { UserRepository } from "#src/modules/user/repository";
import { TestDatabase } from "./utils/database.ts";
import { registerAndLogin } from "./utils/auth.ts";
import { BillingSeeder } from "./utils/billing.ts";

describe("store profile", () => {
  const testDb = new TestDatabase();

  beforeEach(async () => {
    await testDb.setup();
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  it("requires auth", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    expect((await app.request("/stores/some-id")).status).toBe(401);
  });

  it("404s for a nonexistent store", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "profile-missing@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "profile-missing@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);

    const res = await app.request("/stores/00000000-0000-0000-0000-000000000000", { headers: { cookie } });
    expect(res.status).toBe(404);
  });

  it("returns is_subscribed: false for a store the caller does not follow", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "profile-not-following@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "profile-not-following@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);
    const store = await StoreRepository.create(testDb.db, { domain: "not-following.myshopify.com", name: null });

    const res = await app.request(`/stores/${store.id}`, { headers: { cookie } });
    expect(res.status).toBe(200);
    const profile = await res.json();
    expect(profile.is_subscribed).toBe(false);
  });

  it("returns is_subscribed: true once the caller follows the store", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "profile-following@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "profile-following@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);
    const store = await StoreRepository.create(testDb.db, { domain: "following.myshopify.com", name: null });

    await app.request("/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ domain: "following.myshopify.com" }),
    });

    const res = await app.request(`/stores/${store.id}`, { headers: { cookie } });
    const profile = await res.json();
    expect(profile.is_subscribed).toBe(true);
  });

  it("includes crawl status, metadata, active technologies, and technology history", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "profile-full@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "profile-full@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);
    const store = await StoreRepository.create(testDb.db, { domain: "profile-full.myshopify.com", name: null });
    await StoreCrawlRepository.record(testDb.db, store.id, "active");
    await StoreMetadataRepository.record(testDb.db, store.id, "shopify", "A profiled store");
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Shopify", category: "Ecommerce" }]);
    await StoreTechnologyRepository.record(testDb.db, store.id, []);

    const res = await app.request(`/stores/${store.id}`, { headers: { cookie } });
    const profile = await res.json();

    expect(profile.last_crawl_status).toBe("active");
    expect(profile.platform).toBe("shopify");
    expect(profile.homepage_text).toBe("A profiled store");
    expect(profile.technologies).toEqual([]);
    expect(profile.technology_events).toEqual([
      expect.objectContaining({ name: "Shopify", event_type: "removed" }),
      expect.objectContaining({ name: "Shopify", event_type: "added" }),
    ]);
  });

  it("a store the caller doesn't follow still returns full data, not a restricted view", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookieA = await registerAndLogin(app, "profile-owner@hyva.dev");
    const cookieB = await registerAndLogin(app, "profile-viewer@hyva.dev");
    const userA = await UserRepository.getByEmail(testDb.db, "profile-owner@hyva.dev");
    const userB = await UserRepository.getByEmail(testDb.db, "profile-viewer@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, userA!.id);
    await BillingSeeder.activePlan(testDb.db, userB!.id);
    const store = await StoreRepository.create(testDb.db, { domain: "shared-profile.myshopify.com", name: null });
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Klaviyo", category: "email" }]);

    await app.request("/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({ domain: "shared-profile.myshopify.com" }),
    });

    const res = await app.request(`/stores/${store.id}`, { headers: { cookie: cookieB } });
    expect(res.status).toBe(200);
    const profile = await res.json();
    expect(profile.technologies).toEqual([{ name: "Klaviyo", category: "email" }]);
    expect(profile.is_subscribed).toBe(false);
  });
});
