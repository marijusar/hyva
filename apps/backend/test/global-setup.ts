import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { ProvidedContext } from "vitest";
import { DbClient } from "#src/db/client";
import { MigrationRunner } from "#src/db/migrator";

interface SetupContext {
  provide<T extends keyof ProvidedContext>(key: T, value: ProvidedContext[T]): void;
}

// Runs once for the whole test run: starts a single Postgres container and
// migrates its default database to the latest schema. That migrated database
// becomes the TEMPLATE every individual test clones from (see
// test/utils/database.ts) — cloning a template is a `CREATE DATABASE ...
// TEMPLATE` and is orders of magnitude faster than re-running migrations
// per test. https://gajus.com/blog/setting-up-postgre-sql-for-running-integration-tests
class GlobalTestSetup {
  private static container: StartedPostgreSqlContainer | undefined;

  static async setup({ provide }: SetupContext): Promise<void> {
    GlobalTestSetup.container = await new PostgreSqlContainer("postgres:18-alpine").start();

    const templateDb = DbClient.create(GlobalTestSetup.container.getConnectionUri());
    const { error } = await MigrationRunner.create(templateDb).migrateToLatest();
    await templateDb.destroy();
    if (error) throw error;

    provide("TEST_PG_HOST", GlobalTestSetup.container.getHost());
    provide("TEST_PG_PORT", String(GlobalTestSetup.container.getPort()));
    provide("TEST_PG_USER", GlobalTestSetup.container.getUsername());
    provide("TEST_PG_PASSWORD", GlobalTestSetup.container.getPassword());
    provide("TEST_PG_TEMPLATE_DB", GlobalTestSetup.container.getDatabase());
  }

  static async teardown(): Promise<void> {
    await GlobalTestSetup.container?.stop();
  }
}

// vitest's `globalSetup` contract requires these exact named exports —
// they just delegate to the class above.
export const setup = GlobalTestSetup.setup;
export const teardown = GlobalTestSetup.teardown;
