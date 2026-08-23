import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vendorDir = path.join(__dirname, "..", "..", "vendor", "webappanalyzer");

export interface RawTechnology {
  cats?: number[];
  html?: string[];
  scriptSrc?: string[];
}

interface RawCategory {
  name: string;
}

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
    const categoriesRaw = JSON.parse(await fs.readFile(path.join(vendorDir, "categories.json"), "utf-8"));
    this.categories = new Map(
      Object.entries(categoriesRaw as Record<string, RawCategory>).map(([id, cat]) => [Number(id), cat.name]),
    );

    const files = await fs.readdir(path.join(vendorDir, "technologies"));
    const technologies = new Map<string, RawTechnology>();
    for (const file of files) {
      const raw = JSON.parse(await fs.readFile(path.join(vendorDir, "technologies", file), "utf-8"));
      for (const [name, tech] of Object.entries(raw as Record<string, RawTechnology>)) {
        technologies.set(name, tech);
      }
    }
    this.technologies = technologies;
  }
}
