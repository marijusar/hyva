import type { Kysely } from "kysely";
import type Stripe from "stripe";
import type { Database } from "@/db/types";
import { BillingCustomerRepository } from "./billing-customer-repository.ts";
import { BillingSubscriptionRepository } from "./billing-subscription-repository.ts";
import { BillingWebhookEventRepository } from "./billing-webhook-event-repository.ts";
import { PlanRepository } from "./plan-repository.ts";
import { stripeClient } from "./stripe-client.ts";

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

// The single entry point for Stripe webhook delivery. Stripe is the source
// of truth for subscription state — this only ever mirrors it into our DB.
export class BillingWebhookProcessor {
  static async process(db: Kysely<Database>, event: Stripe.Event): Promise<void> {
    await db.transaction().execute(async (trx) => {
      const isNew = await BillingWebhookEventRepository.insertIfNew(trx, event.id, event.type);
      if (!isNew) return;

      switch (event.type) {
        case "checkout.session.completed":
          await BillingWebhookProcessor.handleCheckoutCompleted(trx, event.data.object);
          break;
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await BillingWebhookProcessor.handleSubscriptionChanged(trx, event.data.object);
          break;
        default:
          // invoice.payment_failed and everything else: no-op beyond the
          // idempotency row above. customer.subscription.updated (status:
          // past_due) is Stripe's paired event and the real source of truth.
          break;
      }
    });
  }

  private static async handleCheckoutCompleted(
    trx: Kysely<Database>,
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const stripeCustomerId = idOf(session.customer);
    const stripeSubscriptionId = idOf(session.subscription);
    if (!stripeCustomerId || !stripeSubscriptionId) return; // not a subscription checkout

    let customer = await BillingCustomerRepository.getByStripeCustomerId(trx, stripeCustomerId);
    if (!customer && session.client_reference_id) {
      // Self-heal: normally already created when the checkout session was
      // issued, but resolve defensively in case this event beats our own write.
      customer = await BillingCustomerRepository.create(trx, session.client_reference_id, stripeCustomerId);
    }
    if (!customer) return; // can't resolve which user this belongs to

    const subscription = await stripeClient.subscriptions.retrieve(stripeSubscriptionId);
    await BillingWebhookProcessor.upsertSubscription(trx, customer.userId, subscription);
  }

  private static async handleSubscriptionChanged(
    trx: Kysely<Database>,
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const stripeCustomerId = idOf(subscription.customer);
    if (!stripeCustomerId) return;

    const customer = await BillingCustomerRepository.getByStripeCustomerId(trx, stripeCustomerId);
    if (!customer) return; // no local user linked to this customer — nothing to mirror

    await BillingWebhookProcessor.upsertSubscription(trx, customer.userId, subscription);
  }

  private static async upsertSubscription(
    trx: Kysely<Database>,
    userId: string,
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const item = subscription.items.data[0];
    if (!item) return; // defensive — a subscription always has at least one item

    const plan = await PlanRepository.getByStripePriceId(trx, item.price.id);
    if (!plan) return; // unknown price — nothing we can map this to

    await BillingSubscriptionRepository.upsertFromStripe(trx, {
      userId,
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      nextPaymentAt: new Date(item.current_period_end * 1000),
    });
  }
}
