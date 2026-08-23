import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppFactory } from "#src/app";
import { LoggerFactory } from "#src/logging/logger";
import { TestDatabase } from "./utils/database.ts";

describe("GET /stores", () => {
  const testDb = new TestDatabase();

  beforeEach(async () => {
    await testDb.setup();
  });

  afterEach(async () => {
    await testDb.teardown();
  });

  it("returns an empty list against a freshly cloned template database", async () => {
    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));

    const res = await app.request("/stores");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns rows inserted in this test only (isolation check)", async () => {
    await testDb.db
      .insertInto("stores")
      .values({ domain: "example.myshopify.com", name: "Example" })
      .execute();

    const app = AppFactory.create(testDb.db, LoggerFactory.create("test"));
    const res = await app.request("/stores");
    const body = (await res.json()) as { domain: string }[];

    expect(body).toHaveLength(1);
    expect(body[0]?.domain).toBe("example.myshopify.com");
  });
});
