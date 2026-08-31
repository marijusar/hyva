import type { Kysely } from "kysely";
import type { Database } from "@/db/types";
import { BillingCustomer } from "./billing-customer.ts";

export class BillingCustomerRepository {
  static async getByUserId(db: Kysely<Database>, userId: string): Promise<BillingCustomer | undefined> {
    const row = await db.selectFrom("billing_customers").selectAll().where("user_id", "=", userId).executeTakeFirst();
    if (!row) {
      return undefined;
    }
    return BillingCustomer.fromRow(row);
  }

  static async getByStripeCustomerId(
    db: Kysely<Database>,
    stripeCustomerId: string,
  ): Promise<BillingCustomer | undefined> {
    const row = await db
      .selectFrom("billing_customers")
      .selectAll()
      .where("stripe_customer_id", "=", stripeCustomerId)
      .executeTakeFirst();
    if (!row) {
      return undefined;
    }
    return BillingCustomer.fromRow(row);
  }

  static async create(db: Kysely<Database>, userId: string, stripeCustomerId: string): Promise<BillingCustomer> {
    const row = await db
      .insertInto("billing_customers")
      .values({ user_id: userId, stripe_customer_id: stripeCustomerId })
      .returningAll()
      .executeTakeFirstOrThrow();

    return BillingCustomer.fromRow(row);
  }
}
