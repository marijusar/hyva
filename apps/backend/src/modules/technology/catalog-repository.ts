import type { Kysely } from "kysely";
import { z } from "zod";
import type { Database } from "@/db/types";
import { Technology } from "./technology.ts";

export const catalogEntrySchema = z.object({
  name: z.string(),
  category: z.string().nullable(),
});

export type CatalogEntry = z.infer<typeof catalogEntrySchema>;

export class TechnologyCatalogRepository {
  // Re-runnable resync: refreshes category on conflict rather than
  // doNothing — a technology's category can change upstream between
  // vendor pulls, and a stale category shouldn't survive a resync.
  static async upsertMany(db: Kysely<Database>, technologies: CatalogEntry[]): Promise<void> {
    if (technologies.length === 0) return;

    await db
      .insertInto("technologies")
      .values(technologies.map((tech) => ({ name: tech.name, category: tech.category })))
      .onConflict((oc) => oc.column("name").doUpdateSet((eb) => ({ category: eb.ref("excluded.category") })))
      .execute();
  }

  // Small, slow-growing table (bounded by vendored technology count, not
  // crawl volume) — an unindexed ILIKE scan here stays cheap regardless
  // of app scale, unlike scanning store_technologies directly.
  static async searchByName(db: Kysely<Database>, query: string, limit = 50): Promise<Technology[]> {
    const rows = await db
      .selectFrom("technologies")
      .selectAll()
      .where("name", "ilike", `%${query}%`)
      .limit(limit)
      .execute();

    return rows.map((row) => Technology.fromRow(row));
  }
}
