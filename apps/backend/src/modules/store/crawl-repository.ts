import type { Kysely } from "kysely";
import type { Database } from "../../db/types.ts";
import { Store } from "./store.ts";
import { StoreCrawl } from "./store-crawl.ts";

export class StoreCrawlRepository {
  // Always appends — one row per crawl attempt, regardless of whether the
  // outcome changed, so staleness can be judged by "when did we last check"
  // rather than "when did the status last change".
  static async record(db: Kysely<Database>, storeId: string, status: string): Promise<StoreCrawl> {
    const row = await db
      .insertInto("store_crawls")
      .values({ store_id: storeId, status })
      .returningAll()
      .executeTakeFirstOrThrow();

    return StoreCrawl.fromRow(row);
  }

  // Stores with no crawl row yet (never attempted) or whose latest attempt
  // is older than `staleAfterMs`. Runs as part of an async background sweep
  // (not a hot path), so the aggregate-over-the-log cost here is acceptable.
  static async getPendingForCrawl(db: Kysely<Database>, limit: number, staleAfterMs: number): Promise<Store[]> {
    const staleBefore = new Date(Date.now() - staleAfterMs).toISOString();

    const rows = await db
      .selectFrom("stores")
      .leftJoin(
        (eb) =>
          eb
            .selectFrom("store_crawls")
            .select(["store_id", (eb2) => eb2.fn.max("created_at").as("last_crawled_at")])
            .groupBy("store_id")
            .as("latest_crawl"),
        (join) => join.onRef("latest_crawl.store_id", "=", "stores.id"),
      )
      .selectAll("stores")
      .where((eb) =>
        eb.or([eb("latest_crawl.last_crawled_at", "is", null), eb("latest_crawl.last_crawled_at", "<", staleBefore)]),
      )
      .limit(limit)
      .execute();

    return rows.map((row) => Store.fromRow(row));
  }

  // Single-store lookup — O(log n) via the store_crawls_store_id_created_at_idx
  // composite index (backward index scan), unlike the full-table sweep above.
  static async getLatestByStore(db: Kysely<Database>, storeId: string): Promise<StoreCrawl | undefined> {
    const row = await db
      .selectFrom("store_crawls")
      .selectAll()
      .where("store_id", "=", storeId)
      .orderBy("created_at", "desc")
      .limit(1)
      .executeTakeFirst();

    return row ? StoreCrawl.fromRow(row) : undefined;
  }
}
