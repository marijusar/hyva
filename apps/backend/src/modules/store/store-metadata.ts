import type { Selectable } from "kysely";
import type { StoreMetadataTable } from "@/db/types";

export class StoreMetadata {
  private constructor(
    public readonly id: string,
    public readonly storeId: string,
    public readonly platform: string | null,
    public readonly homepageText: string | null,
    public readonly createdAt: Date,
  ) {}

  static fromRow(row: Selectable<StoreMetadataTable>): StoreMetadata {
    return new StoreMetadata(row.id, row.store_id, row.platform, row.homepage_text, new Date(row.created_at));
  }
}
