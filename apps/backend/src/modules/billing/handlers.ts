import type { Context } from "hono";
import type { AppEnv } from "@/app";
import { BillingCustomerRepository } from "./billing-customer-repository.ts";
import { BillingCustomers } from "./billing-customers.ts";
import { billingEnv } from "./env.ts";
import { Entitlements } from "./entitlements.ts";
import { PaymentServiceProvider } from "./payment-service-provider.ts";
import { PlanRepository } from "./plan-repository.ts";
import { PlanView } from "./plan-view.ts";
import { PlansHttpResponse } from "./plans-http-response.ts";
import { BillingSchemas } from "./schemas.ts";
import { stripeClient } from "./stripe-client.ts";
import { BillingWebhookProcessor } from "./billing-webhook-processor.ts";

export class BillingHandlers {
  static async getPlans(c: Context<AppEnv>) {
    const db = c.get("db");
    const plans = await PlanView.getActivePlans(db);
    return c.json(PlansHttpResponse.from(plans));
  }

  static async getCurrentSubscription(c: Context<AppEnv>) {
    const userId = c.get("userId");
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const db = c.get("db");
    const active = await Entitlements.getActivePlan(db, userId);
    if (!active) return c.json(null);

    return c.json({
      plan: { slug: active.plan.slug, name: active.plan.name, monthly_price_cents: active.plan.monthlyPriceCents },
      status: active.subscription.status,
      next_payment_at: active.subscription.nextPaymentAt.toISOString(),
    });
  }

  static async createCheckoutSession(c: Context<AppEnv>) {
    const parsed = BillingSchemas.checkout.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: "Invalid request", issues: parsed.error.issues }, 400);
    }

    const userId = c.get("userId");
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const db = c.get("db");
    const plan = await PlanRepository.getBySlug(db, parsed.data.planSlug);
    if (!plan || !plan.isActive) {
      return c.json({ error: "Plan not found" }, 404);
    }
    if (!plan.stripePriceId) {
      return c.json({ error: "Plan is not configured for checkout" }, 400);
    }

    const stripeCustomerId = await BillingCustomers.getOrCreateStripeCustomerId(db, userId);

    const session = await stripeClient.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: userId,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${billingEnv.FRONTEND_URL}/dashboard/billing?checkout=success`,
      cancel_url: `${billingEnv.FRONTEND_URL}/dashboard/billing?checkout=cancel`,
    });

    if (!session.url) {
      return c.json({ error: "Failed to create checkout session" }, 502);
    }

    return c.json({ url: session.url });
  }

  static async createPortalSession(c: Context<AppEnv>) {
    const userId = c.get("userId");
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const db = c.get("db");
    const customer = await BillingCustomerRepository.getByUserId(db, userId);
    if (!customer) {
      return c.json({ error: "No billing account yet" }, 400);
    }

    const session = await stripeClient.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: `${billingEnv.FRONTEND_URL}/dashboard/billing`,
    });

    return c.json({ url: session.url });
  }

  static async webhook(c: Context<AppEnv>) {
    const signature = c.req.header("stripe-signature");
    if (!signature) return c.json({ error: "Missing signature" }, 400);

    const rawBody = await c.req.text();
    const event = PaymentServiceProvider.verifyWebhookEvent(rawBody, signature);
    if (!event) return c.json({ error: "Invalid signature" }, 400);

    await BillingWebhookProcessor.process(c.get("db"), event);

    return c.json({ received: true });
  }
}
