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

describe("store subscriptions", () => {
  const testDb = new TestDatabase();

  beforeEach(async () => {
    await testDb.setup();
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  it("requires auth for subscribe, unsubscribe, and list", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));

    expect(
      (await app.request("/subscriptions", { method: "POST" })).status,
    ).toBe(401);
    expect((await app.request("/subscriptions")).status).toBe(401);
    expect((await app.request("/subscriptions/some-id", { method: "DELETE" })).status).toBe(401);
  });

  it("subscribes to a never-seen domain (auto-creates the store), then unsubscribes", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "subscriber@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "subscriber@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);

    const subscribeRes = await app.request("/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ domain: "new-shop.myshopify.com" }),
    });
    expect(subscribeRes.status).toBe(201);
    const { id: storeId } = await subscribeRes.json();

    const store = await StoreRepository.getByDomain(testDb.db, "new-shop.myshopify.com");
    expect(store?.id).toBe(storeId);

    const listRes = await app.request("/subscriptions", { headers: { cookie } });
    const subscriptions = await listRes.json();
    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].domain).toBe("new-shop.myshopify.com");
    expect(subscriptions[0].technologies).toEqual([]);

    const unsubscribeRes = await app.request(`/subscriptions/${storeId}`, {
      method: "DELETE",
      headers: { cookie },
    });
    expect(unsubscribeRes.status).toBe(200);

    const listAfterRes = await app.request("/subscriptions", { headers: { cookie } });
    expect(await listAfterRes.json()).toEqual([]);
  });

  it("subscribing twice is idempotent", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "twice@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "twice@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);

    await app.request("/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ domain: "dup.myshopify.com" }),
    });
    await app.request("/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ domain: "dup.myshopify.com" }),
    });

    const listRes = await app.request("/subscriptions", { headers: { cookie } });
    expect(await listRes.json()).toHaveLength(1);
  });

  it("includes crawl status, metadata, and technologies for a subscribed store", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookie = await registerAndLogin(app, "crawled@hyva.dev");
    const user = await UserRepository.getByEmail(testDb.db, "crawled@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, user!.id);

    const store = await StoreRepository.create(testDb.db, { domain: "crawled.myshopify.com", name: null });
    await StoreCrawlRepository.record(testDb.db, store.id, "active");
    await StoreMetadataRepository.record(testDb.db, store.id, "shopify", "A crawled store");
    await StoreTechnologyRepository.record(testDb.db, store.id, [{ name: "Shopify", category: "Ecommerce" }]);

    await app.request("/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ domain: "crawled.myshopify.com" }),
    });

    const listRes = await app.request("/subscriptions", { headers: { cookie } });
    const [subscription] = await listRes.json();

    expect(subscription.last_crawl_status).toBe("active");
    expect(subscription.platform).toBe("shopify");
    expect(subscription.homepage_text).toBe("A crawled store");
    expect(subscription.technologies).toEqual([{ name: "Shopify", category: "Ecommerce" }]);
  });

  it("only returns the requesting user's own subscriptions", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const cookieA = await registerAndLogin(app, "user-a@hyva.dev");
    const cookieB = await registerAndLogin(app, "user-b@hyva.dev");
    const userA = await UserRepository.getByEmail(testDb.db, "user-a@hyva.dev");
    const userB = await UserRepository.getByEmail(testDb.db, "user-b@hyva.dev");
    await BillingSeeder.activePlan(testDb.db, userA!.id);
    await BillingSeeder.activePlan(testDb.db, userB!.id);

    await app.request("/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({ domain: "only-a.myshopify.com" }),
    });

    const bListRes = await app.request("/subscriptions", { headers: { cookie: cookieB } });
    expect(await bListRes.json()).toEqual([]);
  });
});
