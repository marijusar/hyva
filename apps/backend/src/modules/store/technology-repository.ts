import type { Kysely } from "kysely";
import type { Database } from "@/db/types";
import { type DetectedTechnology } from "@/crawler/technology-matcher";
import { StoreTechnology } from "./store-technology.ts";

type TechnologyEventType = "added" | "removed";

export class StoreTechnologyRepository {
  // "Active" = the latest event per (store_id, name) whose type isn't "removed".
  static async getActiveByStore(db: Kysely<Database>, storeId: string): Promise<StoreTechnology[]> {
    const rows = await StoreTechnologyRepository.latestRowsByName(db, storeId);
    return [...rows.values()].filter((row) => row.event_type !== "removed").map((row) => StoreTechnology.fromRow(row));
  }

  // Full event history for a store, most recent first — every added/removed
  // event ever recorded, not just current state. Served by the
  // store_technologies_store_id_created_at_idx index.
  static async getEventsByStore(db: Kysely<Database>, storeId: string): Promise<StoreTechnology[]> {
    const rows = await db
      .selectFrom("store_technologies")
      .selectAll()
      .where("store_id", "=", storeId)
      .orderBy("created_at", "desc")
      .execute();

    return rows.map((row) => StoreTechnology.fromRow(row));
  }

  // Pure append-only reconciliation: "added" for anything newly detected
  // (first time seen or reappeared after removal), "removed" for anything
  // previously active that's missing from this crawl. A category drift on
  // an already-active technology is not tracked — only presence/absence is
  // event-worthy right now. No row is ever mutated; store_technologies IS
  // the event log.
  static async record(db: Kysely<Database>, storeId: string, technologies: DetectedTechnology[]): Promise<void> {
    const latestByName = await StoreTechnologyRepository.latestRowsByName(db, storeId);
    const detectedNames = new Set(technologies.map((tech) => tech.name));

    const toInsert: { name: string; category: string | null; eventType: TechnologyEventType }[] = [];

    for (const tech of technologies) {
      const latest = latestByName.get(tech.name);
      if (!latest || latest.event_type === "removed") {
        toInsert.push({ name: tech.name, category: tech.category, eventType: "added" });
      }
    }

    for (const [name, row] of latestByName) {
      if (row.event_type !== "removed" && !detectedNames.has(name)) {
        toInsert.push({ name, category: row.category, eventType: "removed" });
      }
    }

    if (toInsert.length === 0) return;

    await db
      .insertInto("store_technologies")
      .values(toInsert.map((event) => ({ store_id: storeId, name: event.name, category: event.category, event_type: event.eventType })))
      .execute();
  }

  private static async latestRowsByName(db: Kysely<Database>, storeId: string) {
    const rows = await db
      .selectFrom("store_technologies")
      .distinctOn("name")
      .selectAll()
      .where("store_id", "=", storeId)
      .orderBy("name")
      .orderBy("created_at", "desc")
      .execute();

    return new Map(rows.map((row) => [row.name, row]));
  }
}
