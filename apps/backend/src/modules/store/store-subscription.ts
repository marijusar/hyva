import type { Selectable } from "kysely";
import type { StoreSubscriptionsTable } from "@/db/types";

export class StoreSubscription {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly storeId: string,
    public readonly createdAt: Date,
  ) {}

  static fromRow(row: Selectable<StoreSubscriptionsTable>): StoreSubscription {
    return new StoreSubscription(row.id, row.user_id, row.store_id, new Date(row.created_at));
  }
}
