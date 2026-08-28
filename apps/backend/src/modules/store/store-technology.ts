import type { Selectable } from "kysely";
import type { StoreTechnologiesTable } from "@/db/types";

export class StoreTechnology {
  private constructor(
    public readonly id: string,
    public readonly storeId: string,
    public readonly name: string,
    public readonly category: string | null,
    public readonly eventType: string,
    public readonly createdAt: Date,
  ) {}

  static fromRow(row: Selectable<StoreTechnologiesTable>): StoreTechnology {
    return new StoreTechnology(row.id, row.store_id, row.name, row.category, row.event_type, new Date(row.created_at));
  }
}
