import type { Hono } from "hono";
import type { AppEnv } from "@/app";
import { AuthMiddleware } from "@/auth/middleware";
import { BillingMiddleware } from "@/modules/billing/middleware";
import { StoreHandlers } from "./handlers.ts";
import { StoreMiddleware } from "./middleware.ts";

export class StoreRoutes {
  static mount(app: Hono<AppEnv>): void {
    app.post(
      "/subscriptions",
      AuthMiddleware.requireAuth(),
      BillingMiddleware.requireActivePlan(),
      StoreMiddleware.requireWithinTrackedStoresLimit(),
      StoreHandlers.subscribe,
    );
    app.delete(
      "/subscriptions/:storeId",
      AuthMiddleware.requireAuth(),
      BillingMiddleware.requireActivePlan(),
      StoreHandlers.unsubscribe,
    );
    app.get(
      "/subscriptions",
      AuthMiddleware.requireAuth(),
      BillingMiddleware.requireActivePlan(),
      StoreHandlers.listSubscriptions,
    );

    app.get(
      "/stores/search",
      AuthMiddleware.requireAuth(),
      BillingMiddleware.requireActivePlan(),
      StoreHandlers.search,
    );
    app.get(
      "/stores/:id",
      AuthMiddleware.requireAuth(),
      BillingMiddleware.requireActivePlan(),
      StoreHandlers.getProfile,
    );
  }
}
