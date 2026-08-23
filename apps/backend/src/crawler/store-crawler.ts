import type { Kysely } from "kysely";
import type { Database } from "../db/types.ts";
import type { Store } from "../modules/store/store.ts";
import { StoreCrawlRepository } from "../modules/store/crawl-repository.ts";
import { StoreMetadataRepository } from "../modules/store/metadata-repository.ts";
import { StoreTechnologyRepository } from "../modules/store/technology-repository.ts";
import { HomepageTextExtractor } from "./homepage-text-extractor.ts";
import type { FetchedPage, PageFetcher } from "./page-fetcher.ts";
import type { TechnologyMatcher } from "./technology-matcher.ts";
import type { Logger } from "../logging/logger.ts";

export class StoreCrawler {
  private readonly logger: Logger;

  constructor(
    private readonly matcher: TechnologyMatcher,
    private readonly fetcher: PageFetcher,
    logger: Logger,
  ) {
    this.logger = logger.child({ module: "[STORE_CRAWLER]" });
  }

  async crawlHomepage(db: Kysely<Database>, store: Store): Promise<void> {
    this.logger.info({ storeId: store.id, domain: store.domain }, "crawling homepage");

    const page = await this.fetcher.fetch(`https://${store.domain}`);
    const status = StoreCrawler.statusFor(page);
    await StoreCrawlRepository.record(db, store.id, status);

    if (!page) {
      this.logger.warn({ storeId: store.id, domain: store.domain }, "homepage crawl marked dead");
      return;
    }

    const detected = await this.matcher.match(page.html);
    const platform = detected.some((tech) => tech.name === "Shopify") ? "shopify" : null;
    await StoreMetadataRepository.record(db, store.id, platform, HomepageTextExtractor.extract(page.html));
    await StoreTechnologyRepository.record(db, store.id, detected);

    this.logger.info(
      { storeId: store.id, domain: store.domain, status, platform, technologyCount: detected.length },
      "homepage crawl complete",
    );
  }

  private static statusFor(page: FetchedPage | null): string {
    if (!page) return "dead";
    return page.statusCode >= 200 && page.statusCode < 400 ? "active" : "error";
  }
}
