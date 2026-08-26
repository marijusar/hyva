import type { Selectable } from "kysely";
import type { StoreTechnologiesTable } from "@/db/types";

export class StoreTechnology {
  private constructor(
    public readonly id: string,
    public readonly storeId: string,
    public readonly name: string,
    public readonly category: string | null,
    public readonly deletedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromRow(row: Selectable<StoreTechnologiesTable>): StoreTechnology {
    return new StoreTechnology(
      row.id,
      row.store_id,
      row.name,
      row.category,
      row.deleted_at ? new Date(row.deleted_at) : null,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }
}
