import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { RabbitMQContainer, type StartedRabbitMQContainer } from "@testcontainers/rabbitmq";
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
//
// Also starts a single RabbitMQ container for the whole run. Unlike
// Postgres, there's no per-test template-clone equivalent — queue tests
// share the one broker and are responsible for purging their own queues
// between tests (see test/homepage-crawl-queue.test.ts).
class GlobalTestSetup {
  private static postgresContainer: StartedPostgreSqlContainer | undefined;
  private static rabbitmqContainer: StartedRabbitMQContainer | undefined;

  static async setup({ provide }: SetupContext): Promise<void> {
    [GlobalTestSetup.postgresContainer, GlobalTestSetup.rabbitmqContainer] = await Promise.all([
      new PostgreSqlContainer("postgres:18-alpine").start(),
      new RabbitMQContainer("rabbitmq:4-management-alpine").start(),
    ]);

    const templateDb = DbClient.create(GlobalTestSetup.postgresContainer.getConnectionUri());
    const { error } = await MigrationRunner.create(templateDb).migrateToLatest();
    await templateDb.destroy();
    if (error) throw error;

    provide("TEST_PG_HOST", GlobalTestSetup.postgresContainer.getHost());
    provide("TEST_PG_PORT", String(GlobalTestSetup.postgresContainer.getPort()));
    provide("TEST_PG_USER", GlobalTestSetup.postgresContainer.getUsername());
    provide("TEST_PG_PASSWORD", GlobalTestSetup.postgresContainer.getPassword());
    provide("TEST_PG_TEMPLATE_DB", GlobalTestSetup.postgresContainer.getDatabase());
    provide("TEST_RABBITMQ_URI", GlobalTestSetup.rabbitmqContainer.getAmqpUrl());
  }

  static async teardown(): Promise<void> {
    await Promise.all([GlobalTestSetup.postgresContainer?.stop(), GlobalTestSetup.rabbitmqContainer?.stop()]);
  }
}

// vitest's `globalSetup` contract requires these exact named exports —
// they just delegate to the class above.
export const setup = GlobalTestSetup.setup;
export const teardown = GlobalTestSetup.teardown;
