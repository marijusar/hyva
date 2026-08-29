import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TechnologyCatalogRepository } from "#src/modules/technology/catalog-repository";
import { TestDatabase } from "./utils/database.ts";

describe("TechnologyCatalogRepository", () => {
  const testDb = new TestDatabase();

  beforeEach(async () => {
    await testDb.setup();
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  it("upsertMany() inserts new technologies", async () => {
    await TechnologyCatalogRepository.upsertMany(testDb.db, [
      { name: "Klaviyo", category: "email" },
      { name: "Shopify", category: "ecommerce" },
    ]);

    const rows = await testDb.db.selectFrom("technologies").selectAll().execute();
    expect(rows.map((row) => row.name).sort()).toEqual(["Klaviyo", "Shopify"]);
  });

  it("upsertMany() updates category on conflict rather than leaving it stale", async () => {
    await TechnologyCatalogRepository.upsertMany(testDb.db, [{ name: "Klaviyo", category: "email" }]);
    await TechnologyCatalogRepository.upsertMany(testDb.db, [{ name: "Klaviyo", category: "marketing" }]);

    const rows = await testDb.db.selectFrom("technologies").selectAll().where("name", "=", "Klaviyo").execute();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.category).toBe("marketing");
  });

  it("searchByName() matches substrings", async () => {
    await TechnologyCatalogRepository.upsertMany(testDb.db, [
      { name: "Klaviyo", category: "email" },
      { name: "Shopify", category: "ecommerce" },
    ]);

    const results = await TechnologyCatalogRepository.searchByName(testDb.db, "klav");
    expect(results.map((tech) => tech.name)).toEqual(["Klaviyo"]);
  });
});
