import type { Kysely } from "kysely";
import { z } from "zod";
import type { Database } from "@/db/types";
import { StoreRepository } from "./repository.ts";
import { StoreTechnologyRepository } from "./technology-repository.ts";
import { StoreSubscriptionRepository } from "./subscription-repository.ts";
import { SubscriptionView, subscribedStoreSchema } from "./subscription-view.ts";

export const storeProfileSchema = subscribedStoreSchema.extend({
  technologyEvents: z.array(
    z.object({
      name: z.string(),
      category: z.string().nullable(),
      eventType: z.string(),
      createdAt: z.date(),
    }),
  ),
  isSubscribed: z.boolean(),
});

export type StoreProfile = z.infer<typeof storeProfileSchema>;

// Full profile for one store — works for any store, regardless of whether
// the caller follows it. `userId` is only used to compute `isSubscribed`;
// it does not gate the lookup. This is what /dashboard/[storeId] and
// search results both render — following a store only changes whether
// you're notified about it, not whether you can see it.
export class StoreProfileView {
  static async forStore(db: Kysely<Database>, storeId: string, userId: string): Promise<StoreProfile | undefined> {
    const store = await StoreRepository.getById(db, storeId);
    if (!store) return undefined;

    const [base, events, subscription] = await Promise.all([
      SubscriptionView.build(db, store),
      StoreTechnologyRepository.getEventsByStore(db, store.id),
      StoreSubscriptionRepository.getSubscribedStore(db, userId, store.id),
    ]);

    return storeProfileSchema.parse({
      ...base,
      technologyEvents: events.map((event) => ({
        name: event.name,
        category: event.category,
        eventType: event.eventType,
        createdAt: event.createdAt,
      })),
      isSubscribed: subscription !== undefined,
    });
  }
}
