import { z } from "zod";
import type { PlanWithLimits } from "./plan-view.ts";

const planSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  monthly_price_cents: z.number(),
  limits: z.array(z.object({ resource_key: z.string(), max_count: z.number().nullable() })),
});

export class PlansHttpResponse {
  static from(plans: PlanWithLimits[]) {
    return plans.map((plan) => PlansHttpResponse.fromOne(plan));
  }

  static fromOne(plan: PlanWithLimits) {
    return planSchema.parse({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      monthly_price_cents: plan.monthlyPriceCents,
      limits: plan.limits.map((limit) => ({ resource_key: limit.resourceKey, max_count: limit.maxCount })),
    });
  }
}
