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
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromRow(row: Selectable<PlansTable>): Plan {
    return new Plan(
      row.id,
      row.slug,
      row.name,
      row.stripe_price_id,
      row.monthly_price_cents,
      row.is_active,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }
}
