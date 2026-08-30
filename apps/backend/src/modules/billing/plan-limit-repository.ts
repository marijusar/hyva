import type { Kysely } from "kysely";

import type { Database } from "@/db/types";

export interface PlanLimit {
  resourceKey: string;
  maxCount: number | null;
}

export class PlanLimitRepository {
  // null covers both "no row for this resource" and "row exists with
  // max_count = null" — both mean unlimited, callers don't need to tell them apart.
  static async getMaxCountForPlan(
    db: Kysely<Database>,
    planId: string,
    resourceKey: string,
  ): Promise<number | null> {
    const row = await db
      .selectFrom("plan_limits")
      .select("max_count")
      .where("plan_id", "=", planId)
      .where("resource_key", "=", resourceKey)
      .executeTakeFirst();

    return row?.max_count ?? null;
  }

  static async getLimitsForPlan(db: Kysely<Database>, planId: string): Promise<PlanLimit[]> {
    const rows = await db
      .selectFrom("plan_limits")
      .select(["resource_key", "max_count"])
      .where("plan_id", "=", planId)
      .execute();

    return rows.map((row) => ({ resourceKey: row.resource_key, maxCount: row.max_count }));
  }

  // Used only by the sync-plans script.
  static async upsertForPlan(
    db: Kysely<Database>,
    planId: string,
    resourceKey: string,
    maxCount: number | null,
  ): Promise<void> {
    await db
      .insertInto("plan_limits")
      .values({ plan_id: planId, resource_key: resourceKey, max_count: maxCount })
      .onConflict((oc) => oc.columns(["plan_id", "resource_key"]).doUpdateSet({ max_count: maxCount }))
      .execute();
  }
}
