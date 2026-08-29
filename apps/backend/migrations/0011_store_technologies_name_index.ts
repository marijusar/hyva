import { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.createIndex("store_technologies_name_idx").on("store_technologies").column("name").execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex("store_technologies_name_idx").execute();
}
