import type { Selectable } from "kysely";
import type { StoresTable } from "@/db/types";

export class Store {
  private constructor(
    public readonly id: string,
    public readonly domain: string,
    public readonly name: string | null,
    public readonly createdAt: Date,
  ) {}

  static fromRow(row: Selectable<StoresTable>): Store {
    return new Store(row.id, row.domain, row.name, new Date(row.created_at));
  }
}
