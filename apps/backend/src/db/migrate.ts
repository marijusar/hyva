import { DbClient } from "./client.ts";
import { MigrationRunner } from "./migrator.ts";
import { dbEnv } from "./env.ts";

export class MigrateCommand {
  static async run(): Promise<void> {
    const db = DbClient.create(dbEnv.DATABASE_URL);
    const migrator = MigrationRunner.create(db);

    const { error, results } = await migrator.migrateToLatest();

    for (const result of results ?? []) {
      if (result.status === "Success") {
        console.log(`migration "${result.migrationName}" executed`);
      } else if (result.status === "Error") {
        console.error(`migration "${result.migrationName}" failed`);
      }
    }

    await db.destroy();

    if (error) {
      console.error(error);
      process.exit(1);
    }
  }
}

void MigrateCommand.run();
