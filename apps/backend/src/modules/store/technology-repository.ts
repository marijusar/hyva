import type { Kysely } from "kysely";
import type { Database } from "../../db/types.ts";
import { type DetectedTechnology } from "../../crawler/technology-matcher.ts";
import { StoreTechnology } from "./store-technology.ts";

export class StoreTechnologyRepository {
  // Active = the latest row per (store_id, name) that hasn't been soft-deleted.
  static async getActiveByStore(db: Kysely<Database>, storeId: string): Promise<StoreTechnology[]> {
    const rows = await StoreTechnologyRepository.latestRowsByName(db, storeId);
    return [...rows.values()].filter((row) => row.deleted_at === null).map((row) => StoreTechnology.fromRow(row));
  }

  // Full reconciliation for one crawl's detected technology set: appends a
  // new row for anything new, reappeared, or whose category changed;
  // soft-deletes (marks the latest row) for anything previously active
  // that's missing from `technologies` this time. One call, no separate
  // step a caller can forget — see StoreTechnologyRepository.getActiveByStore's
  // git history for why: markDeletedMany used to be a public method nothing called.
  static async record(db: Kysely<Database>, storeId: string, technologies: DetectedTechnology[]): Promise<void> {
    const latestByName = await StoreTechnologyRepository.latestRowsByName(db, storeId);
    const detectedNames = new Set(technologies.map((tech) => tech.name));

    const toInsert = technologies.filter((tech) => {
      const latest = latestByName.get(tech.name);
      return !latest || latest.deleted_at !== null || latest.category !== tech.category;
    });

    const toDeleteIds = [...latestByName.entries()]
      .filter(([name, row]) => row.deleted_at === null && !detectedNames.has(name))
      .map(([, row]) => row.id);

    if (toInsert.length > 0) {
      await db
        .insertInto("store_technologies")
        .values(
          toInsert.map((tech) => ({
            store_id: storeId,
            name: tech.name,
            category: tech.category,
          })),
        )
        .execute();
    }

    if (toDeleteIds.length > 0) {
      const now = new Date().toISOString();
      await db
        .updateTable("store_technologies")
        .set({ deleted_at: now, updated_at: now })
        .where("id", "in", toDeleteIds)
        .execute();
    }
  }

  private static async latestRowsByName(db: Kysely<Database>, storeId: string) {
    const rows = await db
      .selectFrom("store_technologies")
      .distinctOn("name")
      .selectAll()
      .where("store_id", "=", storeId)
      .orderBy("name")
      .orderBy("created_at", "desc")
      .execute();

    return new Map(rows.map((row) => [row.name, row]));
  }
}
