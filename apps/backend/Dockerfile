# Build context is the repo root (pnpm workspace) — build with:
#   docker build -f apps/backend/Dockerfile -t hyva-backend .

FROM node:26-alpine AS base
RUN npm install -g pnpm@10.5.2
WORKDIR /workspace
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

FROM base AS deps
RUN pnpm install --frozen-lockfile --filter backend...

FROM deps AS build
COPY apps/backend apps/backend
RUN pnpm --filter backend build

FROM base AS prod-deps
RUN pnpm install --frozen-lockfile --prod --filter backend

FROM node:26-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /workspace

# pnpm symlinks package node_modules into the workspace-root pnpm store, so
# both node_modules trees must be copied together, in the same relative
# layout, or the symlinks in apps/backend/node_modules dangle.
COPY --from=prod-deps /workspace/node_modules ./node_modules
COPY --from=prod-deps /workspace/apps/backend/package.json ./apps/backend/package.json
COPY --from=prod-deps /workspace/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=build /workspace/apps/backend/dist ./apps/backend/dist
COPY apps/backend/migrations ./apps/backend/migrations
COPY apps/backend/vendor ./apps/backend/vendor

WORKDIR /workspace/apps/backend
RUN addgroup -S app && adduser -S app -G app
USER app

CMD ["node", "dist/index.js"]
