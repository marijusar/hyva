import type { Kysely } from "kysely";
import type Stripe from "stripe";
import type { Database } from "@/db/types";
import { BillingSubscriptionRepository } from "./billing-subscription-repository.ts";
import { BillingWebhookError } from "./billing-webhook-errors.ts";
import { PlanRepository } from "./plan-repository.ts";

// Turns a Stripe subscription payload into our mirrored row. Stripe is the
// source of truth for subscription state — this only ever reads from it.
export class SubscriptionSync {
  static async apply(
    db: Kysely<Database>,
    userId: string,
    subscription: Stripe.Subscription,
  ): Promise<BillingWebhookError | null> {
    const item = subscription.items.data[0];
    if (!item) return BillingWebhookError.MissingSubscriptionItem; // defensive — a subscription always has one

    const plan = await PlanRepository.getByStripePriceId(db, item.price.id);
    if (!plan) return BillingWebhookError.UnknownPlanPrice;

    await BillingSubscriptionRepository.upsertFromStripe(db, {
      userId,
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      nextPaymentAt: new Date(item.current_period_end * 1000),
    });

    return null;
  }
}
