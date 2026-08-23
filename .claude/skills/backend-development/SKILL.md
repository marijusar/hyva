---
name: backend-development
description: Conventions for backend work on Hyva (Hono on Node, Kysely/Postgres, RabbitMQ, Python ad-scraper worker). Use when writing or editing routes, DB queries/migrations, queue producers/consumers, or the diff/correlation engines in apps/backend.
---

# Backend development — Hyva

Full context: [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md).

## Stack

- **Hono** on Node (`@hono/node-server`), TS — separate service from the
  Next.js frontend, not API routes inside it. REST, not tRPC (public API
  optionality kept open).
- **Compiled via `tsc`, not Node's native strip-only execution** — Node's
  built-in TypeScript support (`--experimental-strip-types`) only erases
  type annotations; it can't transform syntax that generates real JS
  (constructor parameter properties, enums, namespaces with runtime code —
  see `modules/store/store.ts` for a parameter-property example). `tsc`
  (TypeScript 7, the Go-native compiler) compiles `src/` to `dist/` instead,
  and every process runs the compiled output. Still not ts-node/tsx — no
  runtime-transpilation dependency, just a real compile step instead of
  type-erasure-only. `pnpm dev` runs a background `tsc --watch` alongside
  `node --watch dist/index.js`, so editing a source file still
  recompiles+restarts automatically, same as before. One-shot scripts
  (`db:migrate`, `sync:technologies`, future crawler scripts) build once
  then run the compiled output: `tsc -p tsconfig.build.json && node
  dist/....js`. Relative imports still use literal `.ts` extensions in
  source (`./app.ts`, not `./app.js`); `tsconfig.json`'s
  `rewriteRelativeImportExtensions: true` rewrites them to `.js` in the
  compiled `dist/` output.
- **Cross-directory imports use the `#` subpath alias**, not deep relative
  paths — `#src/db/client` (bare, no extension) instead of
  `../../src/db/client.ts`. Defined in `package.json`'s `imports` field:
  `#src/*`, `#test/*`, `#migrations/*`. This is Node's native subpath-imports
  mechanism (not a bundler alias), so it resolves identically under `node`,
  `tsc`, and vitest. Keep same-directory sibling imports as plain relative
  paths — only alias when crossing a directory boundary (e.g. `test/` →
  `src/`).
- **Env vars**: never read `process.env` directly or fall back with `??`.
  `src/env.ts` parses `process.env` through a Zod schema once at import and
  exports the typed, validated `env` — import that everywhere. Fail fast on
  missing/invalid config, no silent defaults. Durations are expressed in
  **milliseconds** end-to-end (`ACCESS_TOKEN_TTL_MS`, not `_MINUTES`/`_DAYS`).
- **No floating functions.** Group related functions into a class used
  purely as a namespace, with `static` methods — not instance methods, not
  constructor-injected DI. Dependencies (e.g. a Kysely `db`) are passed as
  explicit parameters to each static method, not stored on the class.
  Example: `class Password { static hash(plain) {...} }`,
  `class UserRepository { static create(db, ...) {...} }`,
  `class AuthHandlers { static register(c) {...} }`. Exception: classes that
  legitimately hold per-instance state (e.g. `TestDatabase` in the
  integration test utils) stay instance-based — this rule eliminates
  floating functions/ad-hoc modules, it doesn't ban all instance state.
- **Kysely** — query builder, no ORM. Write SQL-shaped queries, no magic.
  Generated/defaulted columns use Kysely's `Generated<T>` in table types.
- **Postgres** — single source of truth.
- **RabbitMQ** (`amqplib` or `amqp-connection-manager`) — job dispatch only,
  never a data store. Not yet wired into the app; container is running in
  dev compose, no producers/consumers written yet.
- **Python worker** — Meta Ad Library scraping only. Isolated service,
  triggered via RabbitMQ, writes results directly to Postgres. Not yet
  built.

## Folder structure

```
apps/backend/
  src/
    index.ts          # entrypoint — Server.start()
    app.ts             # AppFactory.create(db) — Hono app, db injected via context
    env.ts              # Zod-validated env vars
    db/
      types.ts          # Kysely Database interface
      client.ts         # DbClient.create(connectionString)
      migrator.ts        # MigrationRunner.create(db), FileMigrationProvider
      migrate.ts          # MigrateCommand.run() — migration runner script (db:migrate)
    auth/
      password.ts        # Password.hash / Password.verify (bcryptjs)
      tokens.ts           # Tokens.createAccessToken / createRefreshToken / verifyToken (jose)
      middleware.ts        # AuthMiddleware.requireAuth() / requireRole(role)
    modules/
      user/
        repository.ts      # UserRepository — static methods, db passed in
        handlers.ts          # AuthHandlers.register / login / logout / me
        routes.ts             # mounts /auth/* onto the app
  migrations/            # Kysely migration files (0001_init.ts, ...)
  test/
    global-setup.ts       # vitest globalSetup — testcontainers Postgres + migrate once
    utils/database.ts      # TestDatabase — per-test DB cloned from template
    *.test.ts
```

## Integration test strategy

Modeled on `../sorrel`'s pattern and
[gajus's Postgres integration test writeup](https://gajus.com/blog/setting-up-postgre-sql-for-running-integration-tests):
one Postgres testcontainer per test run, migrated once into a template
database; each individual test clones its own database off that template
(`CREATE DATABASE ... TEMPLATE ...`) instead of re-running migrations or
sharing state.

- `test/global-setup.ts` (vitest `globalSetup`, runs once): starts a
  `PostgreSqlContainer`, runs `MigrationRunner.create(db).migrateToLatest()`
  against its default database, provides connection info via vitest's
  `inject`/`provide`.
- `test/utils/database.ts` (`TestDatabase`, per test): `setup()` clones a
  fresh database from the template via a `max: 1` admin pool (template
  cloning requires no other session on the source db — close the admin pool
  right after), returns a `Kysely` instance for it. `teardown()` destroys
  that instance and drops the database.
- Tests build the app under test with `AppFactory.create(testDb.db)` — the
  Hono app takes its `db` as a plain argument (see `src/app.ts`), so tests
  never need env vars, module-reset hacks, or a running dev server. Call
  `app.request(path)` directly. Auth-related env vars (`JWT_SECRET` etc.)
  still get parsed at import time regardless, so `vitest.config.ts` sets
  dummy values for the whole schema via `test.env`.
- Run: `pnpm --filter backend test` (`vitest run`).

## Conventions

- **Idempotency required** for anything consumed off a queue — RabbitMQ will
  redeliver on failure/restart. Diff/scrape jobs must be safe to run twice
  (upsert, not insert-blind).
- **Rate-limit scrapers deliberately.** The diff engine's real bottleneck is
  politeness against target stores, not local throughput — don't optimize
  concurrency past what's safe for avoiding IP bans / ToS trouble.
- **Migrations**: one file per change in `apps/backend/migrations`, run via
  `pnpm --filter backend db:migrate`. No editing a migration after it's
  shipped.
- **Queue topology**: durable queues, persistent messages, dead-letter
  exchange per queue for failed jobs (don't silently drop — inspect and
  requeue or discard explicitly).
- **REST routes**: resource-based paths (`/stores/:id`, `/subscriptions`),
  standard HTTP verbs/status codes, no RPC-style action endpoints unless
  there's no resource shape that fits.
- **Cross-service contract**: Python worker and TS backend only communicate
  via RabbitMQ (job in) and Postgres (result out) — no direct HTTP calls
  between them, no shared code.
- **Diff engine output**: every detected change becomes a row in
  `product_events`, never a mutation-only update — the event log is what
  subscriptions/alerts and the correlation engine read from.
