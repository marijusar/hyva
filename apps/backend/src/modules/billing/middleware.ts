import type { Context, Next } from "hono";
import type { AppEnv } from "@/app";
import { Entitlements } from "./entitlements.ts";

export class BillingMiddleware {
  // Chain after AuthMiddleware.requireAuth() — assumes userId is already set.
  static requireActivePlan() {
    return async (c: Context<AppEnv>, next: Next) => {
      const userId = c.get("userId");
      if (!userId) return c.json({ error: "Authentication required" }, 401);

      const active = await Entitlements.getActivePlan(c.get("db"), userId);
      if (!active) {
        return c.json({ error: "An active subscription is required", code: "NO_ACTIVE_PLAN" }, 402);
      }

      await next();
    };
  }
}
