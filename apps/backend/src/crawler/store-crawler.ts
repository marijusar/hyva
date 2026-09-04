import type { Kysely } from "kysely";
import type { Database } from "@/db/types";
import type { Store } from "@/modules/store/store";
import { StoreCrawlRepository } from "@/modules/store/crawl-repository";
import { StoreMetadataRepository } from "@/modules/store/metadata-repository";
import { StoreTechnologyRepository } from "@/modules/store/technology-repository";
import { CloudflareChallengeDetector } from "./cloudflare-challenge-detector.ts";
import { HomepageTextExtractor } from "./homepage-text-extractor.ts";
import type { FetchedPage, PageFetcher } from "./page-fetcher.ts";
import type { TechnologyMatcher } from "./technology-matcher.ts";
import type { TechnologyEventPublisher } from "@/queue/technology-event-publisher";
import type { Logger } from "@/logging/logger";

export class StoreCrawler {
  private readonly logger: Logger;

  constructor(
    private readonly matcher: TechnologyMatcher,
    private readonly fetcher: PageFetcher,
    private readonly publisher: TechnologyEventPublisher,
    logger: Logger,
  ) {
    this.logger = logger.child({ module: "[STORE_CRAWLER]" });
  }

  async crawlHomepage(db: Kysely<Database>, store: Store): Promise<void> {
    this.logger.info({ storeId: store.id, domain: store.domain }, "crawling homepage");

    const page = await this.fetcher.fetch(`https://${store.domain}`);
    const status = StoreCrawler.statusFor(page);
    await StoreCrawlRepository.record(db, store.id, status);

    // Only an active crawl reflects the real storefront — diffing a dead,
    // blocked, or errored page reports every known technology as removed.
    if (!page || status !== "active") {
      this.logger.warn({ storeId: store.id, domain: store.domain, status }, "homepage crawl unusable, skipping diff");
      return;
    }

    const detected = await this.matcher.match(page.html);
    const platform = detected.some((tech) => tech.name === "Shopify") ? "shopify" : null;
    await StoreMetadataRepository.record(db, store.id, platform, HomepageTextExtractor.extract(page.html));

    const events = await StoreTechnologyRepository.record(db, store.id, detected);
    await Promise.all(events.map((event) => this.publisher.publish({ storeId: store.id, ...event })));

    this.logger.info(
      {
        storeId: store.id,
        domain: store.domain,
        status,
        platform,
        technologyCount: detected.length,
        eventCount: events.length,
      },
      "homepage crawl complete",
    );
  }

  private static statusFor(page: FetchedPage | null): string {
    if (!page) return "dead";
    if (CloudflareChallengeDetector.isChallenge(page)) return "blocked";
    return page.statusCode >= 200 && page.statusCode < 400 ? "active" : "error";
  }
}
