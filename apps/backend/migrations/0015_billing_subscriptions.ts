import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("billing_subscriptions")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("user_id", "uuid", (col) => col.notNull().references("users.id").onDelete("cascade"))
    .addColumn("plan_id", "uuid", (col) => col.notNull().references("plans.id"))
    .addColumn("stripe_subscription_id", "text", (col) => col.notNull().unique())
    .addColumn("status", "text", (col) => col.notNull())
    .addColumn("next_payment_at", "timestamptz", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex("billing_subscriptions_user_id_idx")
    .on("billing_subscriptions")
    .column("user_id")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("billing_subscriptions").execute();
}
