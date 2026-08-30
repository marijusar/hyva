import type { Selectable } from "kysely";
import type { BillingSubscriptionsTable } from "@/db/types";

export class BillingSubscription {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly planId: string,
    public readonly stripeSubscriptionId: string,
    public readonly status: string,
    public readonly nextPaymentAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromRow(row: Selectable<BillingSubscriptionsTable>): BillingSubscription;
  static fromRow(row: Selectable<BillingSubscriptionsTable> | undefined): BillingSubscription | undefined;
  static fromRow(row: Selectable<BillingSubscriptionsTable> | undefined): BillingSubscription | undefined {
    if (!row) return undefined;

    return new BillingSubscription(
      row.id,
      row.user_id,
      row.plan_id,
      row.stripe_subscription_id,
      row.status,
      new Date(row.next_payment_at),
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }
}
