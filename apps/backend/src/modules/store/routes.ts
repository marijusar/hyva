import type { Hono } from "hono";
import type { AppEnv } from "../../app.ts";
import { AuthMiddleware } from "../../auth/middleware.ts";
import { StoreHandlers } from "./handlers.ts";

export class StoreRoutes {
  static mount(app: Hono<AppEnv>): void {
    app.post("/subscriptions", AuthMiddleware.requireAuth(), StoreHandlers.subscribe);
    app.delete("/subscriptions/:storeId", AuthMiddleware.requireAuth(), StoreHandlers.unsubscribe);
    app.get("/subscriptions", AuthMiddleware.requireAuth(), StoreHandlers.listSubscriptions);
  }
}
