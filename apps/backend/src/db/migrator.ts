import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Kysely } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely/migration";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class MigrationRunner {
  static create(db: Kysely<any>): Migrator {
    return new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: path.join(__dirname, "..", "..", "migrations"),
      }),
    });
  }
}
