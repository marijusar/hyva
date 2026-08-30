import type { Selectable } from "kysely";
import type { PlansTable } from "@/db/types";

export class Plan {
  private constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly name: string,
    public readonly stripePriceId: string | null,
    public readonly monthlyPriceCents: number,
    public readonly isActive: boolean,
    public readonly sortOrderIndex: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromRow(row: Selectable<PlansTable>): Plan;
  static fromRow(row: Selectable<PlansTable> | undefined): Plan | undefined;
  static fromRow(row: Selectable<PlansTable> | undefined): Plan | undefined {
    if (!row) return undefined;

    return new Plan(
      row.id,
      row.slug,
      row.name,
      row.stripe_price_id,
      row.monthly_price_cents,
      row.is_active,
      row.sort_order_index,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }
}
