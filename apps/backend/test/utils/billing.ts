import type { Kysely } from "kysely";
import type { Database } from "#src/db/types";
import { BillingCustomerRepository } from "#src/modules/billing/billing-customer-repository";
import { BillingSubscriptionRepository } from "#src/modules/billing/billing-subscription-repository";
import { PlanRepository } from "#src/modules/billing/plan-repository";

// Seeds a plan + billing customer + "active" subscription for a user, so
// tests can hit routes gated by BillingMiddleware.requireActivePlan()
// without going through Stripe.
export class BillingSeeder {
  static async activePlan(db: Kysely<Database>, userId: string): Promise<void> {
    const plan = await PlanRepository.upsertBySlug(db, {
      slug: `test-plan-${crypto.randomUUID()}`,
      name: "Test plan",
      stripePriceId: `price_test_${crypto.randomUUID()}`,
      monthlyPriceCents: 1900,
      sortOrderIndex: 0,
    });

    await BillingCustomerRepository.create(db, userId, `cus_test_${crypto.randomUUID()}`);

    await BillingSubscriptionRepository.upsertFromStripe(db, {
      userId,
      planId: plan.id,
      stripeSubscriptionId: `sub_test_${crypto.randomUUID()}`,
      status: "active",
      nextPaymentAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }
}
