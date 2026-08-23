import type { Selectable } from "kysely";
import type { StoreCrawlsTable } from "../../db/types.ts";

export class StoreCrawl {
  private constructor(
    public readonly id: string,
    public readonly storeId: string,
    public readonly status: string,
    public readonly createdAt: Date,
  ) {}

  static fromRow(row: Selectable<StoreCrawlsTable>): StoreCrawl {
    return new StoreCrawl(row.id, row.store_id, row.status, new Date(row.created_at));
  }
}
