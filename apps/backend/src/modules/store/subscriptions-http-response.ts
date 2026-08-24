import { z } from "zod";
import type { SubscribedStore } from "./subscription-view.ts";

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

export class StoreSubscriptionsHttpResponse {
  static from(stores: SubscribedStore[]) {
    return stores.map((store) =>
      subscriptionSchema.parse({
        id: store.id,
        domain: store.domain,
        name: store.name,
        last_crawl_status: store.lastCrawlStatus,
        last_crawled_at: store.lastCrawledAt?.toISOString(),
        platform: store.platform,
        homepage_text: store.homepageText,
        technologies: store.technologies,
      }),
    );
  }
}
