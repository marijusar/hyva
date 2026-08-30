import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("plans")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("slug", "text", (col) => col.notNull().unique())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("stripe_price_id", "text", (col) => col.unique())
    .addColumn("monthly_price_cents", "integer", (col) => col.notNull())
    .addColumn("is_active", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("sort_order_index", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable("plan_limits")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("plan_id", "uuid", (col) => col.notNull().references("plans.id").onDelete("cascade"))
    .addColumn("resource_key", "text", (col) => col.notNull())
    .addColumn("max_count", "integer")
    .addUniqueConstraint("plan_limits_plan_id_resource_key_key", ["plan_id", "resource_key"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("plan_limits").execute();
  await db.schema.dropTable("plans").execute();
}
