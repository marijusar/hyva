import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("store_metadata")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("store_id", "uuid", (col) => col.notNull().references("stores.id").onDelete("cascade"))
    .addColumn("platform", "text")
    .addColumn("homepage_text", "text")
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema.createIndex("store_metadata_store_id_idx").on("store_metadata").column("store_id").execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("store_metadata").execute();
}
