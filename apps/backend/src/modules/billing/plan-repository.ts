import type { Kysely } from "kysely";
import { z } from "zod";
import type { Database } from "@/db/types";
import { Plan } from "./plan.ts";

export const upsertPlanSchema = z.object({
  slug: z.string(),
  name: z.string(),
  stripePriceId: z.string(),
  monthlyPriceCents: z.number().int().positive(),
});

export type UpsertPlan = z.infer<typeof upsertPlanSchema>;

export class PlanRepository {
  static async getActivePlans(db: Kysely<Database>): Promise<Plan[]> {
    const rows = await db
      .selectFrom("plans")
      .selectAll()
      .where("is_active", "=", true)
      .orderBy("monthly_price_cents", "asc")
      .execute();

    return rows.map((row) => Plan.fromRow(row));
  }

  static async getBySlug(db: Kysely<Database>, slug: string): Promise<Plan | undefined> {
    const row = await db.selectFrom("plans").selectAll().where("slug", "=", slug).executeTakeFirst();
    if (!row) {
      return undefined;
    }
    return Plan.fromRow(row);
  }

  static async getById(db: Kysely<Database>, id: string): Promise<Plan | undefined> {
    const row = await db.selectFrom("plans").selectAll().where("id", "=", id).executeTakeFirst();
    if (!row) {
      return undefined;
    }
    return Plan.fromRow(row);
  }

  static async getByStripePriceId(db: Kysely<Database>, stripePriceId: string): Promise<Plan | undefined> {
    const row = await db
      .selectFrom("plans")
      .selectAll()
      .where("stripe_price_id", "=", stripePriceId)
      .executeTakeFirst();
    if (!row) {
      return undefined;
    }
    return Plan.fromRow(row);
  }

  // Used only by the sync-plans script — keyed by slug so re-running it
  // is idempotent and safe across Stripe test/live environments.
  static async upsertBySlug(db: Kysely<Database>, plan: UpsertPlan): Promise<Plan> {
    const row = await db
      .insertInto("plans")
      .values({
        slug: plan.slug,
        name: plan.name,
        stripe_price_id: plan.stripePriceId,
        monthly_price_cents: plan.monthlyPriceCents,
      })
      .onConflict((oc) =>
        oc.column("slug").doUpdateSet({
          name: plan.name,
          stripe_price_id: plan.stripePriceId,
          monthly_price_cents: plan.monthlyPriceCents,
          updated_at: new Date().toISOString(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return Plan.fromRow(row);
  }
}
