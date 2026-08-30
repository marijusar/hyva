import type { Hono } from "hono";
import type { AppEnv } from "@/app";
import { AuthMiddleware } from "@/auth/middleware";
import { BillingHandlers } from "./handlers.ts";

export class BillingRoutes {
  static mount(app: Hono<AppEnv>): void {
    app.get("/billing/plans", BillingHandlers.getPlans);
    app.get("/billing/subscription", AuthMiddleware.requireAuth(), BillingHandlers.getCurrentSubscription);
    app.post("/billing/checkout", AuthMiddleware.requireAuth(), BillingHandlers.createCheckoutSession);
    app.post("/billing/portal", AuthMiddleware.requireAuth(), BillingHandlers.createPortalSession);
    app.post("/billing/webhook", BillingHandlers.webhook);
  }
}
