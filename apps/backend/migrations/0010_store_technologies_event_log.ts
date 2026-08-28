import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("store_technologies").addColumn("event_type", "text").execute();

  await sql`update store_technologies set event_type = 'removed' where deleted_at is not null`.execute(db);
  await sql`update store_technologies set event_type = 'added' where deleted_at is null`.execute(db);

  await db.schema
    .alterTable("store_technologies")
    .alterColumn("event_type", (col) => col.setNotNull())
    .execute();

  await db.schema.alterTable("store_technologies").dropColumn("deleted_at").execute();
  await db.schema.alterTable("store_technologies").dropColumn("updated_at").execute();

  await db.schema
    .createIndex("store_technologies_store_id_created_at_idx")
    .on("store_technologies")
    .columns(["store_id", "created_at"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex("store_technologies_store_id_created_at_idx").execute();

  await db.schema.alterTable("store_technologies").addColumn("deleted_at", "timestamptz").execute();
  await db.schema
    .alterTable("store_technologies")
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await sql`update store_technologies set deleted_at = now() where event_type = 'removed'`.execute(db);

  await db.schema.alterTable("store_technologies").dropColumn("event_type").execute();
}
