import type { Kysely } from "kysely";
import type Stripe from "stripe";
import type { Database } from "@/db/types";
import type { Logger } from "@/logging/logger";
import { BillingCustomerRepository } from "./billing-customer-repository.ts";
import { BillingWebhookError } from "./billing-webhook-errors.ts";
import { BillingWebhookEventRepository } from "./billing-webhook-event-repository.ts";
import { nullableStripeIdSchema } from "./stripe-id.ts";
import { stripeClient } from "./stripe-client.ts";
import { SubscriptionSync } from "./subscription-sync.ts";

// The single entry point for Stripe webhook delivery. Stripe is the source
// of truth for subscription state — this only ever mirrors it into our DB.
export class BillingWebhookProcessor {
  static async process(db: Kysely<Database>, logger: Logger, event: Stripe.Event): Promise<void> {
    await db.transaction().execute(async (trx) => {
      const isNew = await BillingWebhookEventRepository.insertIfNew(trx, event.id, event.type);
      if (!isNew) return;

      const error = await BillingWebhookProcessor.route(trx, event);
      if (error) {
        logger.warn({ eventId: event.id, eventType: event.type, error }, "billing webhook event not applied");
      }
    });
  }

  private static async route(trx: Kysely<Database>, event: Stripe.Event): Promise<BillingWebhookError | null> {
    switch (event.type) {
      case "checkout.session.completed":
        return BillingWebhookProcessor.handleCheckoutCompleted(trx, event.data.object);
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        return BillingWebhookProcessor.handleSubscriptionChanged(trx, event.data.object);
      default:
        // invoice.payment_failed and everything else: no-op beyond the
        // idempotency row above. customer.subscription.updated (status:
        // past_due) is Stripe's paired event and the real source of truth.
        return null;
    }
  }

  private static async handleCheckoutCompleted(
    trx: Kysely<Database>,
    session: Stripe.Checkout.Session,
  ): Promise<BillingWebhookError | null> {
    const stripeSubscriptionId = nullableStripeIdSchema.parse(session.subscription);
    if (!stripeSubscriptionId) return null; // not a subscription checkout — nothing to sync

    const stripeCustomerId = nullableStripeIdSchema.parse(session.customer);
    if (!stripeCustomerId) return BillingWebhookError.MissingStripeCustomerId;

    // Invariant: BillingCustomers.getOrCreateStripeCustomerId always creates
    // the local row before a checkout session is ever issued for this customer.
    const customer = await BillingCustomerRepository.getByStripeCustomerId(trx, stripeCustomerId);
    if (!customer) return BillingWebhookError.UnknownBillingCustomer;

    const subscription = await stripeClient.subscriptions.retrieve(stripeSubscriptionId);
    return SubscriptionSync.apply(trx, customer.userId, subscription);
  }

  private static async handleSubscriptionChanged(
    trx: Kysely<Database>,
    subscription: Stripe.Subscription,
  ): Promise<BillingWebhookError | null> {
    const stripeCustomerId = nullableStripeIdSchema.parse(subscription.customer);
    if (!stripeCustomerId) return BillingWebhookError.MissingStripeCustomerId;

    const customer = await BillingCustomerRepository.getByStripeCustomerId(trx, stripeCustomerId);
    if (!customer) return BillingWebhookError.UnknownBillingCustomer;

    return SubscriptionSync.apply(trx, customer.userId, subscription);
  }
}
