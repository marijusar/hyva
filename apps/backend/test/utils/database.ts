import { Pool } from "pg";
import { inject } from "vitest";
import type { Kysely } from "kysely";
import { DbClient } from "#src/db/client";
import type { Database } from "#src/db/types";

// One instance per test. `setup()` clones a fresh database off the migrated
// template (see test/global-setup.ts) so every test gets full schema
// isolation without re-running migrations. `CREATE DATABASE ... TEMPLATE`
// requires no other session on the source db, hence the dedicated max:1
// admin pool and closing it right after the clone.
export class TestDatabase {
  private dbName = "";
  db!: Kysely<Database>;

  async setup(): Promise<Kysely<Database>> {
    const { templateDb } = TestDatabase.pgConfig();
    this.dbName = `test_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const admin = new Pool({ connectionString: TestDatabase.buildUrl("postgres"), max: 1 });
    await admin.query(`CREATE DATABASE "${this.dbName}" TEMPLATE "${templateDb}"`);
    await admin.end();

    this.db = DbClient.create(TestDatabase.buildUrl(this.dbName));
    return this.db;
  }

  async teardown(): Promise<void> {
    await this.db.destroy();

    const admin = new Pool({ connectionString: TestDatabase.buildUrl("postgres"), max: 1 });
    await admin.query(`DROP DATABASE "${this.dbName}"`);
    await admin.end();
  }

  private static pgConfig() {
    return {
      host: inject("TEST_PG_HOST"),
      port: Number(inject("TEST_PG_PORT")),
      user: inject("TEST_PG_USER"),
      password: inject("TEST_PG_PASSWORD"),
      templateDb: inject("TEST_PG_TEMPLATE_DB"),
    };
  }

  private static buildUrl(database: string): string {
    const { host, port, user, password } = TestDatabase.pgConfig();
    return `postgres://${user}:${password}@${host}:${port}/${database}`;
  }
}
