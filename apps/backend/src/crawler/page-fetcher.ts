import { lookup } from "node:dns/promises";
import * as impers from "impers";
import { z } from "zod";
import type { Logger } from "@/logging/logger";

const TIMEOUT_SECONDS = 10;
const DNS_PREFLIGHT_TIMEOUT_MS = 5000;

export const fetchedPageSchema = z.object({
  html: z.string(),
  statusCode: z.number().int(),
  // Cloudflare's official signal for a challenge/managed-challenge response —
  // null on every normal response. See CloudflareChallengeDetector.
  cfMitigated: z.string().nullable(),
});

export type FetchedPage = z.infer<typeof fetchedPageSchema>;

export interface PageFetcher {
  fetch(url: string): Promise<FetchedPage | null>;
}

export class HttpPageFetcher implements PageFetcher {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.child({ module: "[HTTP_PAGE_FETCHER]" });
  }

  async fetch(url: string): Promise<FetchedPage | null> {
    const startedAt = Date.now();
    const hostname = new URL(url).hostname;
    this.logger.debug({ url }, "fetching page");

    if (!(await this.isResolvable(hostname))) {
      this.logger.warn(
        { url, durationMs: Date.now() - startedAt },
        "dns preflight failed, skipping fetch",
      );
      return null;
    }

    try {
      const response = await impers.get(url, {
        impersonate: "safari",
        timeout: TIMEOUT_SECONDS,
        connectTimeout: TIMEOUT_SECONDS,
      });
      const page = fetchedPageSchema.parse({
        html: response.text,
        statusCode: response.status,
        cfMitigated: response.headers.get("cf-mitigated"),
      });
      this.logger.info(
        {
          url,
          statusCode: page.statusCode,
          durationMs: Date.now() - startedAt,
        },
        "fetched page",
      );
      return page;
    } catch (error) {
      this.logger.warn(
        { url, err: error, durationMs: Date.now() - startedAt },
        "page fetch failed",
      );
      return null;
    }
  }

  private isResolvable(hostname: string): Promise<boolean> {
    return Promise.race([
      lookup(hostname).then(
        () => true,
        () => false,
      ),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), DNS_PREFLIGHT_TIMEOUT_MS)),
    ]);
  }
}
