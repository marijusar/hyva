import type { Kysely } from "kysely";
import type { Database } from "../../db/types.ts";
import { Store } from "./store.ts";

export interface NewStore {
  domain: string;
  name: string | null;
}

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
}
