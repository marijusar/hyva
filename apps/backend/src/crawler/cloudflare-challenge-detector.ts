import type { FetchedPage } from "./page-fetcher.ts";

// cf-mitigated is Cloudflare's own signal and covers managed challenges.
// The HTML markers catch older/JS-challenge variants that don't set it.
const HTML_MARKERS = ["Just a moment...", "cdn-cgi/challenge-platform", "__cf_chl_"];

export class CloudflareChallengeDetector {
  static isChallenge(page: FetchedPage): boolean {
    if (page.cfMitigated !== null) return true;
    return HTML_MARKERS.some((marker) => page.html.includes(marker));
  }
}
