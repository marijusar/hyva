import type { Context } from "hono";
import type { AppEnv } from "@/app";
import { StoreRepository } from "./repository.ts";
import { StoreSubscriptionRepository } from "./subscription-repository.ts";
import { SubscriptionView } from "./subscription-view.ts";
import { StoreSubscriptionsHttpResponse } from "./subscriptions-http-response.ts";
import { StoreSchemas } from "./schemas.ts";

export class StoreHandlers {
  static async subscribe(c: Context<AppEnv>) {
    const parsed = StoreSchemas.subscribe.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: "Invalid request", issues: parsed.error.issues }, 400);
    }

    const userId = c.get("userId");
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const db = c.get("db");
    const store = await StoreRepository.getOrCreateByDomain(db, parsed.data.domain);
    await StoreSubscriptionRepository.subscribe(db, userId, store.id);

    return c.json({ id: store.id, domain: store.domain }, 201);
  }

  static async unsubscribe(c: Context<AppEnv>) {
    const userId = c.get("userId");
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const storeId = c.req.param("storeId");
    if (!storeId) return c.json({ error: "Invalid request" }, 400);

    await StoreSubscriptionRepository.unsubscribe(c.get("db"), userId, storeId);

    return c.json({ message: "Unsubscribed" });
  }

  static async listSubscriptions(c: Context<AppEnv>) {
    const userId = c.get("userId");
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const stores = await SubscriptionView.forUser(c.get("db"), userId);

    return c.json(StoreSubscriptionsHttpResponse.from(stores));
  }

  static async getSubscription(c: Context<AppEnv>) {
    const userId = c.get("userId");
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const storeId = c.req.param("storeId");
    if (!storeId) return c.json({ error: "Invalid request" }, 400);

    const store = await SubscriptionView.forUserStore(c.get("db"), userId, storeId);
    if (!store) return c.json({ error: "Not found" }, 404);

    return c.json(StoreSubscriptionsHttpResponse.fromOne(store));
  }
}
