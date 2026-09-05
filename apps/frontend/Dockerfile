# Build context is the repo root (pnpm workspace) — build with:
#   docker build -f apps/frontend/Dockerfile -t sorrel-frontend .

FROM node:26-alpine AS base
RUN npm install -g pnpm@10.5.2
WORKDIR /workspace
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

FROM base AS deps
RUN pnpm install --frozen-lockfile --filter frontend...

FROM deps AS build
COPY apps/frontend apps/frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter frontend build

FROM node:26-alpine AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /workspace

# `output: "standalone"` (next.config.ts) already traces/prunes only the
# node_modules the compiled server actually needs, mirroring the workspace
# layout (outputFileTracingRoot points at the repo root) — no second pnpm
# install needed here, unlike the backend's Dockerfile. `static` and
# `public` are excluded from the standalone trace by design and must be
# copied in manually.
COPY --from=build /workspace/apps/frontend/.next/standalone ./
COPY --from=build /workspace/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=build /workspace/apps/frontend/public ./apps/frontend/public

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
