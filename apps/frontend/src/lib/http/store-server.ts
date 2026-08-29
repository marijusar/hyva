import { z } from "zod";
import { ServerHttp } from "./server-http";
import type { HttpResult } from "./types";

const technologySchema = z.object({
  name: z.string(),
  category: z.string().nullable(),
});

const subscriptionSchema = z.object({
  id: z.string(),
  domain: z.string(),
  name: z.string().nullable(),
  last_crawl_status: z.string().nullable(),
  last_crawled_at: z.string().nullable(),
  platform: z.string().nullable(),
  homepage_text: z.string().nullable(),
  technologies: z.array(technologySchema),
});

const technologyEventSchema = z.object({
  name: z.string(),
  category: z.string().nullable(),
  event_type: z.string(),
  created_at: z.string(),
});

const storeProfileSchema = subscriptionSchema.extend({
  technology_events: z.array(technologyEventSchema),
  is_subscribed: z.boolean(),
});

const storeSearchResultSchema = z.object({
  id: z.string(),
  domain: z.string(),
  name: z.string().nullable(),
  matched_technologies: z.array(z.string()),
  is_subscribed: z.boolean(),
});

const subscribeResponseSchema = z.object({ id: z.string(), domain: z.string() });
const unsubscribeResponseSchema = z.object({ message: z.string() });

export type Technology = z.infer<typeof technologySchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type TechnologyEvent = z.infer<typeof technologyEventSchema>;
export type StoreProfile = z.infer<typeof storeProfileSchema>;
export type StoreSearchResult = z.infer<typeof storeSearchResultSchema>;

export class StoreServer {
  static async listSubscriptions(): Promise<HttpResult<Subscription[]>> {
    return ServerHttp.get("/subscriptions", z.array(subscriptionSchema));
  }

  static async getStoreProfile(storeId: string): Promise<HttpResult<StoreProfile>> {
    return ServerHttp.get(`/stores/${storeId}`, storeProfileSchema);
  }

  static async search(query: string): Promise<HttpResult<StoreSearchResult[]>> {
    return ServerHttp.get(`/stores/search?q=${encodeURIComponent(query)}`, z.array(storeSearchResultSchema));
  }

  static async subscribe(domain: string): Promise<HttpResult<{ id: string; domain: string }>> {
    return ServerHttp.post("/subscriptions", { domain }, subscribeResponseSchema);
  }

  static async unsubscribe(storeId: string): Promise<HttpResult<{ message: string }>> {
    return ServerHttp.delete(`/subscriptions/${storeId}`, unsubscribeResponseSchema);
  }
}
