import type { Kysely } from "kysely";
import { z } from "zod";
import type { Database } from "@/db/types";
import { PlanLimitRepository } from "./plan-limit-repository.ts";
import { PlanRepository } from "./plan-repository.ts";
import type { Plan } from "./plan.ts";

export const planWithLimitsSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  monthlyPriceCents: z.number(),
  limits: z.array(z.object({ resourceKey: z.string(), maxCount: z.number().nullable() })),
});

export type PlanWithLimits = z.infer<typeof planWithLimitsSchema>;

export class PlanView {
  static async getActivePlans(db: Kysely<Database>): Promise<PlanWithLimits[]> {
    const plans = await PlanRepository.getActivePlans(db);
    return Promise.all(plans.map((plan) => PlanView.build(db, plan)));
  }

  static async build(db: Kysely<Database>, plan: Plan): Promise<PlanWithLimits> {
    const limits = await PlanLimitRepository.getLimitsForPlan(db, plan.id);

    return planWithLimitsSchema.parse({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      monthlyPriceCents: plan.monthlyPriceCents,
      limits,
    });
  }
}
