import type { Kysely } from "kysely";
import { z } from "zod";
import type { Database } from "@/db/types";
import { TechnologyCatalogRepository } from "@/modules/technology/catalog-repository";
import { StoreRepository } from "./repository.ts";
import { StoreTechnologyRepository } from "./technology-repository.ts";
import { StoreSubscriptionRepository } from "./subscription-repository.ts";

export const storeSearchResultSchema = z.object({
  id: z.uuid(),
  domain: z.string(),
  name: z.string().nullable(),
  matchedTechnologies: z.array(z.string()),
  isSubscribed: z.boolean(),
});

export type StoreSearchResult = z.infer<typeof storeSearchResultSchema>;

// Unified search: one query matches store domain/name or technology name,
// always returns stores. Technology matching goes through the small
// catalog table first (fuzzy ILIKE there, cheap regardless of app scale),
// then an exact lookup against store_technologies for which stores
// currently have a matched technology active — see
// StoreTechnologyRepository.getActiveStoresForNames for why.
export class StoreSearchView {
  static async search(db: Kysely<Database>, userId: string, rawQuery: string, limit = 25): Promise<StoreSearchResult[]> {
    const query = rawQuery.trim();
    if (!query) return [];

    const [textMatches, catalogMatches] = await Promise.all([
      StoreRepository.searchByText(db, query, limit),
      TechnologyCatalogRepository.searchByName(db, query, limit),
    ]);

    const matchedNames = catalogMatches.map((tech) => tech.name);
    const techMatches =
      matchedNames.length > 0 ? await StoreTechnologyRepository.getActiveStoresForNames(db, matchedNames, limit) : [];

    const matchedNamesByStore = new Map<string, string[]>();
    for (const { storeId, name } of techMatches) {
      matchedNamesByStore.set(storeId, [...(matchedNamesByStore.get(storeId) ?? []), name]);
    }

    const techOnlyIds = [...matchedNamesByStore.keys()].filter((id) => !textMatches.some((store) => store.id === id));
    const techOnlyStores = techOnlyIds.length > 0 ? await StoreRepository.getByIds(db, techOnlyIds.slice(0, limit)) : [];
    const stores = [...textMatches, ...techOnlyStores].slice(0, limit);

    const subscribedIds = await StoreSubscriptionRepository.getSubscribedStoreIds(
      db,
      userId,
      stores.map((store) => store.id),
    );

    return stores.map((store) =>
      storeSearchResultSchema.parse({
        id: store.id,
        domain: store.domain,
        name: store.name,
        matchedTechnologies: matchedNamesByStore.get(store.id) ?? [],
        isSubscribed: subscribedIds.has(store.id),
      }),
    );
  }
}
