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

const subscriptionDetailSchema = subscriptionSchema.extend({
  technology_events: z.array(technologyEventSchema),
});

export type Technology = z.infer<typeof technologySchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type TechnologyEvent = z.infer<typeof technologyEventSchema>;
export type SubscriptionDetail = z.infer<typeof subscriptionDetailSchema>;

export class StoreServer {
  static async listSubscriptions(): Promise<HttpResult<Subscription[]>> {
    return ServerHttp.get("/subscriptions", z.array(subscriptionSchema));
  }

  static async getSubscription(storeId: string): Promise<HttpResult<SubscriptionDetail>> {
    return ServerHttp.get(`/subscriptions/${storeId}`, subscriptionDetailSchema);
  }
}
