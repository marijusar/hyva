# Sorrel — Architecture

Shopify competitor tracking tool. Right now the product is store follows:
users follow exact competitor stores and see their detected tech stack
(technologies added/removed) and crawl status. No product/price/restock
tracking or ad-signal correlation exists yet.

## Business context

- Target: $200k-$300k ARR, bootstrapped, no VC.
- Niche market (~$3M-$50M TAM), not huge-market VC territory — see
  [Dullien's entrepreneurship guide](https://thomasdullien.github.io/guides/entrepreneurship/)
  for the reasoning: special market insight + willingness to dominate a niche
  over years fits bootstrap, not fundraising.
- Moat: existing 400k-store Shopify database. Most competitors (Koala
  Inspector, PPSPY, Sell The Trend) either buy scraped data or hit rate
  limits — data acquisition is normally the hard part, already solved here.
- Pricing model target: ~$40-70/mo blended ARPU, 350-500 paying customers.

## Language/stack decision

Constraint: monolith-ish, minimize ops surface for a solo/small-team
bootstrap.

- **TypeScript** — single language, both apps. Frontend is a Next.js app;
  backend is a separate Hono service (not Next.js API routes) — see
  [backend-development skill](../.claude/skills/backend-development/SKILL.md).

## Services

1. **Next.js app** (TS) — frontend: dashboard, store search/discover,
   subscription (store follow) management, billing.
2. **Hono backend** (TS) — REST API: auth, billing, store search/subscribe,
   store crawler + technology-fingerprint detection.
3. **Postgres** — single source of truth. Stores, store metadata/crawls,
   detected technologies, subscriptions, users, billing.
4. **RabbitMQ** — job dispatch for the homepage-crawl worker and the
   technology-event worker. Durable queues + persistent messages, dead-letter
   exchange for retry on failure. Not used for data storage, only dispatch.

## Core engine

**Crawler**: fetches each subscribed store's homepage, extracts text/metadata,
and matches known technology fingerprints (script/URL patterns) against it.
Detected additions/removals are logged as events (`store_technologies`,
`event_type` added/removed) — idempotent, safe to run twice.

**Subscription model**: users follow an exact store (no category/niche
following) and see that store's current tech stack and crawl status on their
dashboard.

## Data layer

- **Kysely** as query builder (no ORM abstraction, close to raw SQL, full
  control — chosen over Prisma/Drizzle).
- Core tables:
  - `stores` — the 400k-store universe
  - `store_metadata`, `store_crawls` — per-store crawl results/status
  - `store_technologies` — detected technology add/remove event log
  - `technologies` — technology catalog
  - `store_subscriptions` — which user follows which store
  - `users`, billing tables — accounts and subscriptions

## API layer

REST via Next.js API routes. Chosen over tRPC to keep the option open for a
public/third-party API later without a rewrite.

## Frontend

Next.js App Router, Tailwind + shadcn/ui. See
[frontend-development skill](../.claude/skills/frontend-development/SKILL.md).

## Backend conventions

See [backend-development skill](../.claude/skills/backend-development/SKILL.md).
