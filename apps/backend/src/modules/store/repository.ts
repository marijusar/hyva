import type { Kysely } from "kysely";
import { z } from "zod";
import type { Database } from "@/db/types";
import { Store } from "./store.ts";

export const newStoreSchema = z.object({
  domain: z.string(),
  name: z.string().nullable(),
});

export type NewStore = z.infer<typeof newStoreSchema>;

export class StoreRepository {
  static async create(db: Kysely<Database>, store: NewStore): Promise<Store> {
    const row = await db
      .insertInto("stores")
      .values({ domain: store.domain, name: store.name })
      .returningAll()
      .executeTakeFirstOrThrow();

    return Store.fromRow(row);
  }

  static async getById(db: Kysely<Database>, id: string): Promise<Store | undefined> {
    const row = await db.selectFrom("stores").selectAll().where("id", "=", id).executeTakeFirst();
    return row ? Store.fromRow(row) : undefined;
  }

  static async getByDomain(db: Kysely<Database>, domain: string): Promise<Store | undefined> {
    const row = await db.selectFrom("stores").selectAll().where("domain", "=", domain).executeTakeFirst();
    return row ? Store.fromRow(row) : undefined;
  }

  // Subscribing to a domain we haven't seen yet still creates the store row
  // — it just has no crawl history until the next orchestrator sweep picks
  // it up (getPendingForCrawl finds it via "no store_crawls row yet").
  static async getOrCreateByDomain(db: Kysely<Database>, domain: string): Promise<Store> {
    const existing = await StoreRepository.getByDomain(db, domain);
    if (existing) return existing;

    return StoreRepository.create(db, { domain, name: null });
  }

  // Bulk import — skips domains that already exist rather than overwriting
  // (a re-import shouldn't clobber a store's `name` back to null).
  static async upsertMany(db: Kysely<Database>, domains: string[]): Promise<void> {
    if (domains.length === 0) return;

    await db
      .insertInto("stores")
      .values(domains.map((domain) => ({ domain, name: null })))
      .onConflict((oc) => oc.column("domain").doNothing())
      .execute();
  }

  static async searchByText(db: Kysely<Database>, query: string, limit = 25): Promise<Store[]> {
    const pattern = `%${query}%`;
    const rows = await db
      .selectFrom("stores")
      .selectAll()
      .where((eb) => eb.or([eb("domain", "ilike", pattern), eb("name", "ilike", pattern)]))
      .orderBy("domain")
      .limit(limit)
      .execute();

    return rows.map((row) => Store.fromRow(row));
  }

  // Hydrates stores that matched a search only via technology, not text.
  static async getByIds(db: Kysely<Database>, ids: string[]): Promise<Store[]> {
    if (ids.length === 0) return [];

    const rows = await db.selectFrom("stores").selectAll().where("id", "in", ids).execute();
    return rows.map((row) => Store.fromRow(row));
  }
}
