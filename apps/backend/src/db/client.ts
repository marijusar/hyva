import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "./types.ts";

export class DbClient {
  static create(connectionString: string): Kysely<Database> {
    return new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool({ connectionString }),
      }),
    });
  }
}
