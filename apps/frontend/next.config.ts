import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Docker build context is the pnpm workspace root (two levels up from
  // this file) — without this, Next only traces apps/frontend and misses
  // the hoisted workspace-root node_modules the standalone bundle needs.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // next's require-hook.js requires @swc/helpers via a dynamic (non-static)
  // path at runtime, which @vercel/nft's tracer doesn't follow — the
  // standalone bundle silently omits it and the server crashes on start
  // (MODULE_NOT_FOUND) unless it's force-included here.
  outputFileTracingIncludes: {
    "/**": ["../../node_modules/.pnpm/@swc+helpers@*/node_modules/@swc/helpers/**"],
  },
};

export default nextConfig;
