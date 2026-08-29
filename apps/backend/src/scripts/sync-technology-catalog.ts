import { DbClient } from "@/db/client";
import { dbEnv } from "@/db/env";
import { LoggerFactory } from "@/logging/logger";
import { TechnologyFingerprints } from "@/crawler/technology-fingerprints";
import { TechnologyCatalogRepository, type CatalogEntry } from "@/modules/technology/catalog-repository";

class SyncTechnologyCatalogCommand {
  static async run(): Promise<void> {
    const logger = LoggerFactory.create("sync-technology-catalog");
    const db = DbClient.create(dbEnv.DATABASE_URL);
    const fingerprints = new TechnologyFingerprints();

    const technologies = await fingerprints.getTechnologies();
    const categories = await fingerprints.getCategories();

    const entries: CatalogEntry[] = [...technologies.entries()].map(([name, tech]) => {
      const categoryId = tech.cats?.[0];
      return { name, category: categoryId !== undefined ? (categories.get(categoryId) ?? null) : null };
    });

    await TechnologyCatalogRepository.upsertMany(db, entries);
    logger.info({ count: entries.length }, "technology catalog synced");

    await db.destroy();
  }
}

await SyncTechnologyCatalogCommand.run();
