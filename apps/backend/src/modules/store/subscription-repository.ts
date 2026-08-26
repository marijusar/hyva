import type { Kysely } from "kysely";
import type { Database } from "@/db/types";
import { Store } from "./store.ts";
import { StoreSubscription } from "./store-subscription.ts";

export class StoreSubscriptionRepository {
  // Idempotent — subscribing twice just returns the existing subscription.
  static async subscribe(db: Kysely<Database>, userId: string, storeId: string): Promise<StoreSubscription> {
    const inserted = await db
      .insertInto("store_subscriptions")
      .values({ user_id: userId, store_id: storeId })
      .onConflict((oc) => oc.columns(["user_id", "store_id"]).doNothing())
      .returningAll()
      .executeTakeFirst();

    if (inserted) return StoreSubscription.fromRow(inserted);

    const existing = await db
      .selectFrom("store_subscriptions")
      .selectAll()
      .where("user_id", "=", userId)
      .where("store_id", "=", storeId)
      .executeTakeFirstOrThrow();

    return StoreSubscription.fromRow(existing);
  }

  static async unsubscribe(db: Kysely<Database>, userId: string, storeId: string): Promise<void> {
    await db
      .deleteFrom("store_subscriptions")
      .where("user_id", "=", userId)
      .where("store_id", "=", storeId)
      .execute();
  }

  static async getSubscribedStores(db: Kysely<Database>, userId: string): Promise<Store[]> {
    const rows = await db
      .selectFrom("store_subscriptions")
      .innerJoin("stores", "stores.id", "store_subscriptions.store_id")
      .selectAll("stores")
      .where("store_subscriptions.user_id", "=", userId)
      .orderBy("store_subscriptions.created_at", "desc")
      .execute();

    return rows.map((row) => Store.fromRow(row));
  }

  // Ownership-scoped single lookup — undefined if the store doesn't exist
  // or the user isn't subscribed to it, so callers can 404 either way.
  static async getSubscribedStore(db: Kysely<Database>, userId: string, storeId: string): Promise<Store | undefined> {
    const row = await db
      .selectFrom("store_subscriptions")
      .innerJoin("stores", "stores.id", "store_subscriptions.store_id")
      .selectAll("stores")
      .where("store_subscriptions.user_id", "=", userId)
      .where("store_subscriptions.store_id", "=", storeId)
      .executeTakeFirst();

    return row ? Store.fromRow(row) : undefined;
  }
}
