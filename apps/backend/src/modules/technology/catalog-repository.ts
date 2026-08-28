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
  // Refreshes category on conflict, so a resync doesn't leave it stale.
  static async upsertMany(db: Kysely<Database>, technologies: CatalogEntry[]): Promise<void> {
    if (technologies.length === 0) return;

    await db
      .insertInto("technologies")
      .values(technologies.map((tech) => ({ name: tech.name, category: tech.category })))
      .onConflict((oc) => oc.column("name").doUpdateSet((eb) => ({ category: eb.ref("excluded.category") })))
      .execute();
  }

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
