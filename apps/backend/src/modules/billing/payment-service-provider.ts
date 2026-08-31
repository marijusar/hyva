import type Stripe from "stripe";
import { billingEnv } from "./env.ts";
import { stripeClient } from "./stripe-client.ts";

export class PaymentServiceProvider {
  static verifyWebhookEvent(rawBody: string, signature: string): Stripe.Event | null {
    try {
      return stripeClient.webhooks.constructEvent(rawBody, signature, billingEnv.STRIPE_WEBHOOK_SECRET);
    } catch {
      return null;
    }
  }
}
