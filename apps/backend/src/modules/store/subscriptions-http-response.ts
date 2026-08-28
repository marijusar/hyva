import { z } from "zod";
import type { SubscribedStore, SubscribedStoreDetail } from "./subscription-view.ts";

const subscriptionSchema = z.object({
  id: z.uuid(),
  domain: z.string(),
  name: z.string().nullable(),
  last_crawl_status: z.string().nullable().default(null),
  last_crawled_at: z.iso.datetime().nullable().default(null),
  platform: z.string().nullable().default(null),
  homepage_text: z.string().nullable().default(null),
  technologies: z.array(z.object({ name: z.string(), category: z.string().nullable() })),
});

const subscriptionDetailSchema = subscriptionSchema.extend({
  technology_events: z.array(
    z.object({
      name: z.string(),
      category: z.string().nullable(),
      event_type: z.string(),
      created_at: z.iso.datetime(),
    }),
  ),
});

export class StoreSubscriptionsHttpResponse {
  static from(stores: SubscribedStore[]) {
    return stores.map((store) => StoreSubscriptionsHttpResponse.fromOne(store));
  }

  static fromOne(store: SubscribedStore) {
    return subscriptionSchema.parse({
      id: store.id,
      domain: store.domain,
      name: store.name,
      last_crawl_status: store.lastCrawlStatus,
      last_crawled_at: store.lastCrawledAt?.toISOString(),
      platform: store.platform,
      homepage_text: store.homepageText,
      technologies: store.technologies,
    });
  }

  static fromDetail(store: SubscribedStoreDetail) {
    return subscriptionDetailSchema.parse({
      ...StoreSubscriptionsHttpResponse.fromOne(store),
      technology_events: store.technologyEvents.map((event) => ({
        name: event.name,
        category: event.category,
        event_type: event.eventType,
        created_at: event.createdAt.toISOString(),
      })),
    });
  }
}
