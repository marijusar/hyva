import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vendorDir = path.join(__dirname, "..", "..", "vendor", "webappanalyzer");

// Pinned commit, not floating `main` — reproducible builds, deliberate
// updates only (rerun this script to pull a newer pin).
const REF = "1b9eee8154c0f01e7888c5242cf6fbbc4a3fcea6";
const RAW_BASE = `https://raw.githubusercontent.com/enthec/webappanalyzer/${REF}`;
const API_BASE = `https://api.github.com/repos/enthec/webappanalyzer/contents/src/technologies?ref=${REF}`;

const NOTICE = `This directory vendors fingerprint data from enthec/webappanalyzer
(https://github.com/enthec/webappanalyzer), pinned at commit ${REF}.

The data (technologies/*.json, categories.json, groups.json) is GPLv3-licensed
— see LICENSE in this directory. Only the data is vendored; the matching
engine that reads it (apps/backend/src/crawler/technology-matcher.ts) is
original code, not derived from webappanalyzer's own (unrelated) engine.

Re-run \`pnpm --filter backend sync:technologies\` to pull a newer pinned
commit deliberately — this is never fetched automatically at build/run time.
`;

class TechnologySync {
  static async run(): Promise<void> {
    await fs.mkdir(path.join(vendorDir, "technologies"), { recursive: true });

    await TechnologySync.fetchTo("categories.json", path.join(vendorDir, "categories.json"));
    await TechnologySync.fetchTo("groups.json", path.join(vendorDir, "groups.json"));
    await TechnologySync.fetchTo("LICENSE", path.join(vendorDir, "LICENSE"), "");

    const files = await TechnologySync.listTechnologyFiles();
    for (const file of files) {
      await TechnologySync.fetchTo(`technologies/${file}`, path.join(vendorDir, "technologies", file));
    }

    await fs.writeFile(path.join(vendorDir, "NOTICE"), NOTICE);
    console.log(`synced ${files.length} technology files + categories.json + groups.json + LICENSE at ${REF}`);
  }

  private static async listTechnologyFiles(): Promise<string[]> {
    const res = await fetch(API_BASE, { headers: { "User-Agent": "hyva-sync-technologies" } });
    if (!res.ok) throw new Error(`GitHub API request failed: ${res.status} ${res.statusText}`);

    const entries = (await res.json()) as { name: string; type: string }[];
    return entries.filter((entry) => entry.type === "file").map((entry) => entry.name);
  }

  private static async fetchTo(srcRelativePath: string, destPath: string, prefix = "src/"): Promise<void> {
    const url = `${RAW_BASE}/${prefix}${srcRelativePath}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);

    await fs.writeFile(destPath, await res.text());
  }
}

await TechnologySync.run();
