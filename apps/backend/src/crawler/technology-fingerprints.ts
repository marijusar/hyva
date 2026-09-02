import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vendorDir = path.join(__dirname, "..", "..", "vendor", "webappanalyzer");

export const rawTechnologySchema = z.object({
  cats: z.array(z.number()).optional(),
  html: z.array(z.string()).optional(),
  scriptSrc: z.array(z.string()).optional(),
});

export type RawTechnology = z.infer<typeof rawTechnologySchema>;

const rawCategorySchema = z.object({
  name: z.string(),
});

const technologiesFileSchema = z.record(z.string(), rawTechnologySchema);
const categoriesFileSchema = z.record(z.string(), rawCategorySchema);

// Upstream `[\s\S]*` patterns rescan the whole document once per matching tag —
// 19s on a 16.5MB homepage, which freezes the worker's event loop. Each is
// replaced by the literal it actually keys on; applied after load so
// `sync:technologies` cannot silently revert them.
const HTML_PATTERN_OVERRIDES = new Map<string, string[]>([
  ["Liveinternet", ["//counter\\.yadro\\.ru/hit"]],
  ["Elm-ui", ["\\.explain > \\.ctr > \\.s"]],
  [
    "SAP Commerce Cloud",
    [
      "<[^>]+/(?:sys_master|hybr|_ui/(?:.*responsive/)?(?:desktop|common(?:/images|/img|/css|ico)?))/",
      "<script[^>]{0,512}hybris[^>]{0,512}\\.js",
    ],
  ],
  ["Akamai mPulse", ["go-mpulse\\.net/boomerang"]],
]);

// One instance per worker process. Loads the vendored fingerprint data
// (vendor/webappanalyzer/, see NOTICE there for provenance/license) from
// disk once, caches it in memory for the process lifetime — every crawled
// page after the first reuses the same in-memory maps, no re-read/re-parse.
export class TechnologyFingerprints {
  private technologies: Map<string, RawTechnology> | null = null;
  private categories: Map<number, string> | null = null;

  async getTechnologies(): Promise<Map<string, RawTechnology>> {
    if (!this.technologies) {
      await this.loadFromDisk();
    }
    if (!this.technologies) {
      throw new Error("TechnologyFingerprints: technologies map still empty after loadFromDisk()");
    }
    return this.technologies;
  }

  async getCategories(): Promise<Map<number, string>> {
    if (!this.categories) {
      await this.loadFromDisk();
    }
    if (!this.categories) {
      throw new Error("TechnologyFingerprints: categories map still empty after loadFromDisk()");
    }
    return this.categories;
  }

  private async loadFromDisk(): Promise<void> {
    const categoriesRaw = categoriesFileSchema.parse(
      JSON.parse(await fs.readFile(path.join(vendorDir, "categories.json"), "utf-8")),
    );
    this.categories = new Map(Object.entries(categoriesRaw).map(([id, cat]) => [Number(id), cat.name]));

    const files = await fs.readdir(path.join(vendorDir, "technologies"));
    const technologies = new Map<string, RawTechnology>();
    for (const file of files) {
      const raw = technologiesFileSchema.parse(
        JSON.parse(await fs.readFile(path.join(vendorDir, "technologies", file), "utf-8")),
      );
      for (const [name, tech] of Object.entries(raw)) {
        technologies.set(name, tech);
      }
    }
    TechnologyFingerprints.applyHtmlPatternOverrides(technologies);
    this.technologies = technologies;
  }

  private static applyHtmlPatternOverrides(technologies: Map<string, RawTechnology>): void {
    for (const [name, html] of HTML_PATTERN_OVERRIDES) {
      const tech = technologies.get(name);
      if (!tech) {
        throw new Error(
          `TechnologyFingerprints: no vendored technology "${name}" to override — drop it from HTML_PATTERN_OVERRIDES`,
        );
      }
      tech.html = html;
    }
  }
}
