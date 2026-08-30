import type { Selectable } from "kysely";
import type { BillingCustomersTable } from "@/db/types";

export class BillingCustomer {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly stripeCustomerId: string,
    public readonly createdAt: Date,
  ) {}

  static fromRow(row: Selectable<BillingCustomersTable>): BillingCustomer;
  static fromRow(row: Selectable<BillingCustomersTable> | undefined): BillingCustomer | undefined;
  static fromRow(row: Selectable<BillingCustomersTable> | undefined): BillingCustomer | undefined {
    if (!row) return undefined;

    return new BillingCustomer(row.id, row.user_id, row.stripe_customer_id, new Date(row.created_at));
  }
}
