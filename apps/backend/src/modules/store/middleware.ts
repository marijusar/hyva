import type { Context, Next } from "hono";
import type { AppEnv } from "@/app";
import { Entitlements } from "@/modules/billing/entitlements";
import { StoreSubscriptionRepository } from "./subscription-repository.ts";

export class StoreMiddleware {
  // Chain after AuthMiddleware.requireAuth() + BillingMiddleware.requireActivePlan().
  // Only mount on the actual creation route — not idempotency-aware, so a
  // re-follow of an already-subscribed store also gets blocked at the cap.
  static requireWithinTrackedStoresLimit() {
    return async (c: Context<AppEnv>, next: Next) => {
      const userId = c.get("userId");
      if (!userId) return c.json({ error: "Authentication required" }, 401);

      const db = c.get("db");
      const currentCount = await StoreSubscriptionRepository.getCountForUser(db, userId);
      const { allowed } = await Entitlements.getLimitStatus(db, userId, "tracked_stores", currentCount);
      if (!allowed) {
        return c.json(
          { error: "You've reached your plan's tracked-store limit. Upgrade to follow more.", code: "LIMIT_EXCEEDED" },
          403,
        );
      }

      await next();
    };
  }
}
