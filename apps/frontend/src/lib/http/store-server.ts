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

export type Technology = z.infer<typeof technologySchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;

export class StoreServer {
  static async listSubscriptions(): Promise<HttpResult<Subscription[]>> {
    return ServerHttp.get("/subscriptions", z.array(subscriptionSchema));
  }

  static async getSubscription(storeId: string): Promise<HttpResult<Subscription>> {
    return ServerHttp.get(`/subscriptions/${storeId}`, subscriptionSchema);
  }
}
