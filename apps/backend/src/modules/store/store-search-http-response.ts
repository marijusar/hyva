import { z } from "zod";
import type { StoreSearchResult } from "./search-view.ts";

const storeSearchResultHttpSchema = z.object({
  id: z.uuid(),
  domain: z.string(),
  name: z.string().nullable(),
  matched_technologies: z.array(z.string()),
  is_subscribed: z.boolean(),
});

export class StoreSearchHttpResponse {
  static from(results: StoreSearchResult[]) {
    return results.map((result) =>
      storeSearchResultHttpSchema.parse({
        id: result.id,
        domain: result.domain,
        name: result.name,
        matched_technologies: result.matchedTechnologies,
        is_subscribed: result.isSubscribed,
      }),
    );
  }
}
