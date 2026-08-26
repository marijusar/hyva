import type { Hono } from "hono";
import type { AppEnv } from "@/app";
import { AuthMiddleware } from "@/auth/middleware";
import { StoreHandlers } from "./handlers.ts";

export class StoreRoutes {
  static mount(app: Hono<AppEnv>): void {
    app.post("/subscriptions", AuthMiddleware.requireAuth(), StoreHandlers.subscribe);
    app.delete("/subscriptions/:storeId", AuthMiddleware.requireAuth(), StoreHandlers.unsubscribe);
    app.get("/subscriptions", AuthMiddleware.requireAuth(), StoreHandlers.listSubscriptions);
    app.get("/subscriptions/:storeId", AuthMiddleware.requireAuth(), StoreHandlers.getSubscription);
  }
}
