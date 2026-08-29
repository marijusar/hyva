import { z } from "zod";
import type { StoreProfile } from "./profile-view.ts";

const storeProfileHttpSchema = z.object({
  id: z.uuid(),
  domain: z.string(),
  name: z.string().nullable(),
  last_crawl_status: z.string().nullable().default(null),
  last_crawled_at: z.iso.datetime().nullable().default(null),
  platform: z.string().nullable().default(null),
  homepage_text: z.string().nullable().default(null),
  technologies: z.array(z.object({ name: z.string(), category: z.string().nullable() })),
  technology_events: z.array(
    z.object({
      name: z.string(),
      category: z.string().nullable(),
      event_type: z.string(),
      created_at: z.iso.datetime(),
    }),
  ),
  is_subscribed: z.boolean(),
});

export class StoreProfileHttpResponse {
  static from(profile: StoreProfile) {
    return storeProfileHttpSchema.parse({
      id: profile.id,
      domain: profile.domain,
      name: profile.name,
      last_crawl_status: profile.lastCrawlStatus,
      last_crawled_at: profile.lastCrawledAt?.toISOString(),
      platform: profile.platform,
      homepage_text: profile.homepageText,
      technologies: profile.technologies,
      technology_events: profile.technologyEvents.map((event) => ({
        name: event.name,
        category: event.category,
        event_type: event.eventType,
        created_at: event.createdAt.toISOString(),
      })),
      is_subscribed: profile.isSubscribed,
    });
  }
}
