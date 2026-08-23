import { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createIndex("store_crawls_store_id_created_at_idx")
    .on("store_crawls")
    .columns(["store_id", "created_at"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex("store_crawls_store_id_created_at_idx").execute();
}
