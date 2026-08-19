# Hyva — Architecture

Shopify competitor tracking tool. Store owners subscribe to a category or exact
competitor stores, get alerted when those stores add products, change prices,
or restock. Ad tracking (Meta Ad Library) correlated against product changes
to surface "this is likely their winning product" signals.

## Business context

- Target: $200k-$300k ARR, bootstrapped, no VC.
- Niche market (~$3M-$50M TAM), not huge-market VC territory — see
  [Dullien's entrepreneurship guide](https://thomasdullien.github.io/guides/entrepreneurship/)
  for the reasoning: special market insight + willingness to dominate a niche
  over years fits bootstrap, not fundraising.
- Moat: existing 400k-store Shopify database + working Meta Ad Library scraper.
  Most competitors (Koala Inspector, PPSPY, Sell The Trend) either buy scraped
  data or hit rate limits — data acquisition is normally the hard part, already
  solved here.
- Differentiator: correlate product launch events with ad longevity/variation
  count to flag high-confidence "winning product" signals, not just raw diffs.
- Pricing model target: ~$40-70/mo blended ARPU, 350-500 paying customers.

## Language/stack decision

Constraint: monolith, max 2 languages backend, minimize ops surface for a
solo/small-team bootstrap.

- **TypeScript** — Next.js app covers both frontend and backend (API routes).
  One runtime, one deploy target, shared types, no context-switching.
- **Python** — isolated to Meta Ad Library scraping only. Best-in-class
  scraping libraries (Playwright etc.) live here. Runs as a separate small
  worker service, triggered via RabbitMQ, writes results back to the shared
  Postgres DB.
- Go was considered for the store-diff worker (concurrency story is nicer)
  but dropped to stay within the 2-language constraint — the diff engine's
  real bottleneck is scrape politeness/rate-limiting against target stores,
  not local CPU/concurrency ceiling, so TS worker pools (p-limit /
  worker_threads) are sufficient.
- **OpenClaw** (computer-use style browser agent) is a tactical fallback for
  ad library scraping if Meta's UI/anti-bot measures break the Python
  scraper — not primary path, used adaptively when structured scraping fails.

## Services

1. **Next.js app** (TS) — frontend (dashboard, subscription management, alert
   feed) + backend (REST API routes, auth, billing, store-diff worker logic).
2. **Python ad-scraper worker** — consumes jobs from RabbitMQ, scrapes Meta Ad
   Library, writes ad creative/spend/duration data to Postgres.
3. **Postgres** — single source of truth. Stores, products, snapshots, diff
   events, subscriptions, ad signals, users.
4. **RabbitMQ** — job orchestration (store scrape jobs, ad scrape jobs).
   Durable queues + persistent messages, dead-letter exchange for retry on
   failure. Not used for data storage, only job dispatch.

## Core engine

**Diff engine**: cron-scheduled worker polls `/products.json` per subscribed
store (schedule tier depends on subscription plan — hourly/daily), diffs
against the last snapshot, emits events: `new_product`, `price_change`,
`restock`. Must be idempotent — retries happen via RabbitMQ redelivery.

**Correlation/signal engine**: cross-references `new_product` events with ad
data — ad running >14 days and/or multiple creative variations for the same
product = high-confidence "winning product" flag surfaced to subscribers.

**Subscription model**: users follow a category (niche/tag) or an exact
store, get a feed + email/webhook alert on diff events matching their
subscription.

## Data layer

- **Kysely** as query builder (no ORM abstraction, close to raw SQL, full
  control — chosen over Prisma/Drizzle).
- Core tables (initial sketch, refine when building schema):
  - `stores` — the 400k-store universe, metadata, category/niche tags
  - `products`, `product_snapshots` — current + historical state per store
  - `product_events` — diff engine output (new/price_change/restock)
  - `ad_creatives`, `ad_signals` — Meta Ad Library data, keyed to store/product
  - `users`, `subscriptions` — who follows what
  - `alerts` — delivered/pending notifications per subscription

## API layer

REST via Next.js API routes. Chosen over tRPC to keep the option open for a
public/third-party API later without a rewrite.

## Frontend

Next.js App Router, Tailwind + shadcn/ui. See
[frontend-development skill](../.claude/skills/frontend-development/SKILL.md).

## Backend conventions

See [backend-development skill](../.claude/skills/backend-development/SKILL.md).
