import type { Kysely } from "kysely";
import { z } from "zod";
import type { Database } from "@/db/types";
import { StoreSubscriptionRepository } from "./subscription-repository.ts";
import { StoreCrawlRepository } from "./crawl-repository.ts";
import { StoreMetadataRepository } from "./metadata-repository.ts";
import { StoreTechnologyRepository } from "./technology-repository.ts";
import type { Store } from "./store.ts";

export const subscribedStoreSchema = z.object({
  id: z.uuid(),
  domain: z.string(),
  name: z.string().nullable(),
  lastCrawlStatus: z.string().optional(),
  lastCrawledAt: z.date().optional(),
  platform: z.string().optional(),
  homepageText: z.string().optional(),
  technologies: z.array(z.object({ name: z.string(), category: z.string().nullable() })),
});

export type SubscribedStore = z.infer<typeof subscribedStoreSchema>;

// Read-side counterpart to StoreCrawler: that composes the writes into
// store_crawls/store_metadata/store_technologies, this composes the reads
// back into one shape for a user's subscribed stores.
export class SubscriptionView {
  static async forUser(db: Kysely<Database>, userId: string): Promise<SubscribedStore[]> {
    const stores = await StoreSubscriptionRepository.getSubscribedStores(db, userId);
    return Promise.all(stores.map((store) => SubscriptionView.build(db, store)));
  }

  static async forUserStore(db: Kysely<Database>, userId: string, storeId: string): Promise<SubscribedStore | undefined> {
    const store = await StoreSubscriptionRepository.getSubscribedStore(db, userId, storeId);
    if (!store) return undefined;
    return SubscriptionView.build(db, store);
  }

  private static async build(db: Kysely<Database>, store: Store): Promise<SubscribedStore> {
    const [lastCrawl, metadata, technologies] = await Promise.all([
      StoreCrawlRepository.getLatestByStore(db, store.id),
      StoreMetadataRepository.getLatestByStore(db, store.id),
      StoreTechnologyRepository.getActiveByStore(db, store.id),
    ]);

    return subscribedStoreSchema.parse({
      id: store.id,
      domain: store.domain,
      name: store.name,
      lastCrawlStatus: lastCrawl?.status,
      lastCrawledAt: lastCrawl?.createdAt,
      platform: metadata?.platform ?? undefined,
      homepageText: metadata?.homepageText ?? undefined,
      technologies: technologies.map((tech) => ({ name: tech.name, category: tech.category })),
    });
  }
}
