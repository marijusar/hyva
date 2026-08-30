import { z } from "zod";
import { ServerHttp } from "./server-http";
import type { HttpResult } from "./types";

const planLimitSchema = z.object({
  resource_key: z.string(),
  max_count: z.number().nullable(),
});

const planSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  monthly_price_cents: z.number(),
  limits: z.array(planLimitSchema),
});

const currentSubscriptionSchema = z.object({
  plan: z.object({ slug: z.string(), name: z.string(), monthly_price_cents: z.number() }),
  status: z.string(),
  next_payment_at: z.string(),
});

const checkoutSessionSchema = z.object({ url: z.string() });
const portalSessionSchema = z.object({ url: z.string() });

export type Plan = z.infer<typeof planSchema>;
export type CurrentSubscription = z.infer<typeof currentSubscriptionSchema>;

export class BillingServer {
  static async getPlans(): Promise<HttpResult<Plan[]>> {
    return ServerHttp.get("/billing/plans", z.array(planSchema));
  }

  static async getCurrentSubscription(): Promise<HttpResult<CurrentSubscription | null>> {
    return ServerHttp.get("/billing/subscription", currentSubscriptionSchema.nullable());
  }

  static async createCheckoutSession(planSlug: string): Promise<HttpResult<{ url: string }>> {
    return ServerHttp.post("/billing/checkout", { planSlug }, checkoutSessionSchema);
  }

  static async createPortalSession(): Promise<HttpResult<{ url: string }>> {
    return ServerHttp.post("/billing/portal", {}, portalSessionSchema);
  }
}
