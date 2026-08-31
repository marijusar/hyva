import type { Kysely } from "kysely";
import type { Database } from "@/db/types";
import { BillingSubscription } from "./billing-subscription.ts";
import { BillingSubscriptionRepository } from "./billing-subscription-repository.ts";
import { Plan } from "./plan.ts";
import { PlanLimitRepository } from "./plan-limit-repository.ts";
import { PlanRepository } from "./plan-repository.ts";

export interface ActivePlan {
  subscription: BillingSubscription;
  plan: Plan;
}

export interface LimitStatus {
  allowed: boolean;
  limit: number | null;
}

// The only place the rest of the backend should ask "is this user paid,
// and what can they do" — product modules never touch billing tables directly.
export class Entitlements {
  static async getActivePlan(db: Kysely<Database>, userId: string): Promise<ActivePlan | null> {
    const subscription = await BillingSubscriptionRepository.getActiveForUser(db, userId);
    if (!subscription) return null;

    const plan = await PlanRepository.getById(db, subscription.planId);
    if (!plan) return null; // defensive — FK guarantees this shouldn't happen

    return { subscription, plan };
  }

  static async getLimitStatus(
    db: Kysely<Database>,
    userId: string,
    resourceKey: string,
    currentCount: number,
  ): Promise<LimitStatus> {
    const active = await Entitlements.getActivePlan(db, userId);
    if (!active) return { allowed: false, limit: 0 };

    const limit = await PlanLimitRepository.getMaxCountForPlan(db, active.plan.id, resourceKey);
    if (limit === null) return { allowed: true, limit: null };

    return { allowed: currentCount < limit, limit };
  }
}
