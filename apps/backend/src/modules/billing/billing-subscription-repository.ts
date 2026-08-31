import type { Kysely } from "kysely";
import { z } from "zod";
import type { Database } from "@/db/types";
import { BillingSubscription } from "./billing-subscription.ts";

export const upsertBillingSubscriptionSchema = z.object({
  userId: z.string(),
  planId: z.string(),
  stripeSubscriptionId: z.string(),
  status: z.string(),
  nextPaymentAt: z.date(),
});

export type UpsertBillingSubscription = z.infer<typeof upsertBillingSubscriptionSchema>;

export class BillingSubscriptionRepository {
  // No trials in this repo — "active" is the only status that counts as paid.
  static async getActiveForUser(db: Kysely<Database>, userId: string): Promise<BillingSubscription | undefined> {
    const row = await db
      .selectFrom("billing_subscriptions")
      .selectAll()
      .where("user_id", "=", userId)
      .where("status", "=", "active")
      .orderBy("next_payment_at", "desc")
      .executeTakeFirst();

    if (!row) {
      return undefined;
    }
    return BillingSubscription.fromRow(row);
  }

  static async getByStripeSubscriptionId(
    db: Kysely<Database>,
    stripeSubscriptionId: string,
  ): Promise<BillingSubscription | undefined> {
    const row = await db
      .selectFrom("billing_subscriptions")
      .selectAll()
      .where("stripe_subscription_id", "=", stripeSubscriptionId)
      .executeTakeFirst();

    if (!row) {
      return undefined;
    }
    return BillingSubscription.fromRow(row);
  }

  // Single write path for every webhook branch (checkout completed, subscription
  // updated/deleted) — Stripe is the source of truth, we just mirror its state.
  static async upsertFromStripe(
    db: Kysely<Database>,
    subscription: UpsertBillingSubscription,
  ): Promise<BillingSubscription> {
    const row = await db
      .insertInto("billing_subscriptions")
      .values({
        user_id: subscription.userId,
        plan_id: subscription.planId,
        stripe_subscription_id: subscription.stripeSubscriptionId,
        status: subscription.status,
        next_payment_at: subscription.nextPaymentAt.toISOString(),
      })
      .onConflict((oc) =>
        oc.column("stripe_subscription_id").doUpdateSet({
          plan_id: subscription.planId,
          status: subscription.status,
          next_payment_at: subscription.nextPaymentAt.toISOString(),
          updated_at: new Date().toISOString(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return BillingSubscription.fromRow(row);
  }
}
