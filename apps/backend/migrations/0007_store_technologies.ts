import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("store_technologies")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("store_id", "uuid", (col) => col.notNull().references("stores.id").onDelete("cascade"))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("category", "text")
    .addColumn("deleted_at", "timestamptz")
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex("store_technologies_store_id_name_created_at_idx")
    .on("store_technologies")
    .columns(["store_id", "name", "created_at"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("store_technologies").execute();
}
