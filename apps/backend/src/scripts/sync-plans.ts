import { DbClient } from "@/db/client";
import { dbEnv } from "@/db/env";
import { LoggerFactory } from "@/logging/logger";
import { PlanLimitRepository } from "@/modules/billing/plan-limit-repository";
import { PlanRepository } from "@/modules/billing/plan-repository";
import { syncPlansEnv } from "./sync-plans-env.ts";

// Prices and limits mirror the landing page's TIERS
// (apps/frontend/src/app/(marketing)/page.tsx) — "N stores unlocked per
// month" there is read as a concurrent tracked-store cap for v1 (no monthly
// reset, no unlock mechanic yet).
const PLANS = [
  {
    slug: "starter",
    name: "Starter",
    monthlyPriceCents: 4900,
    sortOrderIndex: 1,
    stripePriceId: syncPlansEnv.STRIPE_PRICE_STARTER,
    trackedStoresLimit: 100,
  },
  {
    slug: "growth",
    name: "Growth",
    monthlyPriceCents: 14900,
    sortOrderIndex: 2,
    stripePriceId: syncPlansEnv.STRIPE_PRICE_GROWTH,
    trackedStoresLimit: 500,
  },
  {
    slug: "scale",
    name: "Scale",
    monthlyPriceCents: 39900,
    sortOrderIndex: 3,
    stripePriceId: syncPlansEnv.STRIPE_PRICE_SCALE,
    trackedStoresLimit: 2000,
  },
] as const;

class SyncPlansCommand {
  static async run(): Promise<void> {
    const logger = LoggerFactory.create("sync-plans");
    const db = DbClient.create(dbEnv.DATABASE_URL);

    for (const plan of PLANS) {
      const row = await PlanRepository.upsertBySlug(db, plan);
      await PlanLimitRepository.upsertForPlan(db, row.id, "tracked_stores", plan.trackedStoresLimit);
      logger.info({ slug: plan.slug }, "plan synced");
    }

    await db.destroy();
  }
}

await SyncPlansCommand.run();
