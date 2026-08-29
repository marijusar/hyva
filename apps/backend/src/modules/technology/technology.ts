import type { Selectable } from "kysely";
import type { TechnologiesTable } from "@/db/types";

export class Technology {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly category: string | null,
    public readonly createdAt: Date,
  ) {}

  static fromRow(row: Selectable<TechnologiesTable>): Technology {
    return new Technology(row.id, row.name, row.category, new Date(row.created_at));
  }
}
