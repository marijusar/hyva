import { z } from "zod";
import type { TechnologyFingerprints } from "./technology-fingerprints.ts";

export const detectedTechnologySchema = z.object({
  name: z.string(),
  category: z.string().nullable(),
});

export type DetectedTechnology = z.infer<typeof detectedTechnologySchema>;

const SCRIPT_SRC_RE = /<script\b[^>]*\bsrc=["']([^"']+)["']/gi;

// Matches a crawled page's raw HTML against two Wappalyzer signal types:
// `html` (regex against the full HTML text) and `scriptSrc` (regex against
// each <script src> attribute). Deliberately scoped to just these two —
// headers/meta/cookies/dom are a different, much more expensive class of
// check (dom matching alone runs ~650-900ms/page against the full vendored
// technology set) and are out of scope here. Confidence/version metadata
// embedded in the vendored patterns is also ignored for now — presence is
// all we report.
export class TechnologyMatcher {
  constructor(private readonly fingerprints: TechnologyFingerprints) {}

  async match(html: string): Promise<DetectedTechnology[]> {
    const technologies = await this.fingerprints.getTechnologies();
    const categories = await this.fingerprints.getCategories();
    const scriptSrcs = TechnologyMatcher.extractScriptSrcs(html);

    const results: DetectedTechnology[] = [];
    for (const [name, tech] of technologies) {
      const isMatch =
        this.matchesAny(tech.html, [html]) || this.matchesAny(tech.scriptSrc, scriptSrcs);
      if (!isMatch) continue;

      const categoryId = tech.cats?.[0];
      results.push({ name, category: categoryId !== undefined ? (categories.get(categoryId) ?? null) : null });
    }

    return results;
  }

  private matchesAny(patterns: string[] | undefined, values: string[]): boolean {
    if (!patterns) return false;

    for (const pattern of patterns) {
      const regex = TechnologyMatcher.toRegex(pattern);
      if (!regex) continue;
      if (values.some((value) => regex.test(value))) return true;
    }

    return false;
  }

  // Wappalyzer patterns look like `<regex>\;confidence:50\;version:\1` —
  // strip everything after the first `\;` (metadata we're ignoring for
  // now) and compile what's left as a case-insensitive regex.
  private static toRegex(raw: string): RegExp | null {
    const [patternPart] = raw.split("\\;");
    if (!patternPart) return null;

    try {
      return new RegExp(patternPart, "i");
    } catch {
      return null; // malformed regex in vendored data
    }
  }

  private static extractScriptSrcs(html: string): string[] {
    const srcs: string[] = [];
    for (const match of html.matchAll(SCRIPT_SRC_RE)) {
      if (match[1]) srcs.push(match[1]);
    }
    return srcs;
  }
}
