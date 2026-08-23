import type { Kysely } from "kysely";
import type { Database } from "../../db/types.ts";
import { StoreMetadata } from "./store-metadata.ts";

export class StoreMetadataRepository {
  static async getLatestByStore(db: Kysely<Database>, storeId: string): Promise<StoreMetadata | undefined> {
    const row = await db
      .selectFrom("store_metadata")
      .selectAll()
      .where("store_id", "=", storeId)
      .orderBy("created_at", "desc")
      .limit(1)
      .executeTakeFirst();

    return row ? StoreMetadata.fromRow(row) : undefined;
  }

  // Diff-gated: only inserts if platform/homepageText differ from the store's
  // latest row (or it has none yet) — the log only grows when something
  // actually changed. Returns null when nothing was inserted.
  static async record(
    db: Kysely<Database>,
    storeId: string,
    platform: string | null,
    homepageText: string | null,
  ): Promise<StoreMetadata | null> {
    const latest = await StoreMetadataRepository.getLatestByStore(db, storeId);
    if (latest && latest.platform === platform && latest.homepageText === homepageText) {
      return null;
    }

    const row = await db
      .insertInto("store_metadata")
      .values({ store_id: storeId, platform, homepage_text: homepageText })
      .returningAll()
      .executeTakeFirstOrThrow();

    return StoreMetadata.fromRow(row);
  }
}
