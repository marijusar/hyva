---
name: frontend-development
description: Conventions for frontend work on Sorrel (Next.js App Router, Tailwind, shadcn/ui, light-only theme, cookie-based auth against the Hono backend). Use when building or editing dashboard UI, auth pages, subscription management, alert feed, or any component/page in apps/frontend.
---

# Frontend development — Sorrel

Full context: [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md).

## Stack

- Next.js App Router, TS.
- Tailwind + shadcn/ui — no CSS Modules, no separate component library.
- **Light-only theme ("white shadcn" look).** `globals.css` has no `.dark`
  block and no `@custom-variant dark` — this is deliberate, not an
  oversight. Don't reintroduce dark-mode CSS/toggle without being asked;
  `:root`'s `oklch(1 0 0)` background is the only palette.
- **Backend is a separate service**, not API routes inside this app —
  `apps/backend` (Hono). Talk to it via `src/lib/api.ts`'s `Api` class
  (`Api.get`/`Api.post`), which always sends `credentials: "include"` so the
  httpOnly auth cookies (`access_token`/`refresh_token`, set by the backend)
  flow with every request. Read directly via `process.env.*` (Next.js
  inlines `NEXT_PUBLIC_*` vars at build time; this is a different runtime
  model than the backend's Zod-validated `process.env`, so the backend's
  never-read-`process.env`-directly rule doesn't apply here).
  **Two different base URLs, don't conflate them**: `NEXT_PUBLIC_API_URL`
  (browser-facing, e.g. `http://localhost:8090`) for client components'
  `Api`, vs `INTERNAL_API_URL` (server-only, e.g. `http://backend:8080` —
  the Docker-network hostname) for server components' `ServerApi`. A
  server-side `fetch` runs *inside the frontend's own container*, where the
  browser-facing URL doesn't reach the backend container — this bit in
  practice (500s from `ECONNREFUSED`) before `INTERNAL_API_URL` was added.
- **No `useEffect`.** Load data in server components (`async` component +
  `await`), or trigger fetches from the event handler that needs them (form
  submit, button click) — never a `useEffect` that fires on mount.
  `/login`/`/register` are client components (need form state + submit
  handlers) using `Api` (`src/lib/api.ts`, browser `fetch` with
  `credentials: "include"`). `/dashboard` is a server component that reads
  the auth cookie via `next/headers`' `cookies()` and calls `GET /auth/me`
  through `ServerApi` (`src/lib/api-server.ts`), `redirect()`-ing to
  `/login` server-side on failure — its logout button is a small client
  component (`dashboard/logout-button.tsx`) with a plain `onClick` handler,
  not a `useEffect`. `/` (root) redirects to `/login`.
- **Two API client helpers, don't mix them up**: `Api` (client components,
  browser fetch, relies on the browser's cookie jar) vs `ServerApi` (server
  components only — manually forwards `cookies()` since a server-side
  `fetch` has no browser cookie jar to inherit from).

## Folder structure

```
src/
  app/               # routes (App Router) — login/, register/, dashboard/, ...
  components/
    ui/              # shadcn-generated primitives, don't hand-edit generated parts
    <feature>/        # feature-specific components (alert-feed/, subscriptions/, ...)
  lib/
    api.ts             # Api.get/post — fetch wrapper, credentials: "include"
    utils.ts            # shadcn's cn() helper etc.
```

## Conventions

- **Server components by default.** Only mark `"use client"` when the
  component needs interactivity (state, effects, event handlers) — e.g. any
  form, or anything reading auth state client-side. Don't default to client
  components out of habit.
- **shadcn/ui first** for any primitive (button, dialog, table, form input)
  — install via the shadcn CLI (`pnpm dlx shadcn@latest add <component>`),
  customize via Tailwind classes, don't hand-roll a primitive that shadcn
  already provides.
- **Tailwind utility-first** — no custom CSS files unless something is
  genuinely inexpressible in utilities.
- **Data fetching**: always in server components (`ServerApi`) unless the
  data must update without a navigation, in which case trigger the fetch
  from an event handler (`Api`) — never `useEffect`.
- **React event types**: `React.FormEvent` is deprecated in this project's
  `@types/react` version ("doesn't actually exist") — use `SubmitEvent` for
  form `onSubmit` handlers instead.
- **10-minutes-to-dopamine principle** (from the product's own design goal):
  the subscription flow and alert feed should show a subscriber real signal
  fast — don't bury the "here's what changed" view behind onboarding steps.
- **Dashboard-heavy product** — this is a SaaS dashboard, not a marketing
  site. Optimize component choices (tables, feeds, filters) for information
  density and scanning speed over decorative layout.
