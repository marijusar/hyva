# Infra migration: hyva → sorrel namespace

One-time runbook for taking over the `sorrel` naming/namespace on the host
that already runs both this app (as hyva, `/opt/hyva`) and the separate,
older, unrelated sorrel project. **Same physical host for both** — confirmed
2026-09-05. Old sorrel app is fully decommissioned, not preserved elsewhere.

This is a plan, not something already executed — nothing here has been run.
Several steps are destructive/irreversible (data loss) if run out of order
or against the wrong volume. Don't run any step unattended.

## Current state (as of this repo)

- This app deploys via `.github/workflows/deploy.yml` to
  `secrets.HETZNER_HOST` into `/opt/sorrel` (just renamed from `/opt/hyva` —
  **don't merge/deploy this rename until you're ready to execute the cutover
  below**, or the workflow fails on `cd /opt/sorrel`, which doesn't exist yet).
- `docker-compose.prod.yml` now pins `name: sorrel` at the top level — this
  makes Compose's volume/network naming a fixed string (`sorrel_postgres-data`
  etc.) instead of derived from whatever directory it's run from. Without
  this, moving the compose file from `/opt/hyva` to `/opt/sorrel` would make
  Compose look for `sorrel_postgres-data`, not find it, and silently spin up
  a fresh empty database — the real data would sit orphaned in the old
  `hyva_*`-prefixed volumes.
- Old sorrel app: separate repo (`../sorrel`), same host, own compose
  setup, multiple services (api, frontend, marketing, tracker,
  event-router, lead-gen) — check what's actually running before touching it.
- GHCR images renamed `hyva-backend` → `sorrel-backend` — CI must build and
  push at least once under the new tag before any deploy references it.

## Phase 0 — inventory (read-only, do first)

On the host:

```
docker ps -a
docker volume ls
docker network ls
docker compose -f /opt/hyva/docker-compose.prod.yml config    # confirm hyva's actual current volume names
```

Confirm the actual `hyva_postgres-data`-style volume name against reality —
don't assume the prefix, verify it. Also check what's bound to ports 80/443
right now (this app's Traefik, or old sorrel's own reverse proxy) — only one
can hold those ports.

## Phase 1 — backup old sorrel's DB (recommended even though it's being decommissioned)

```
docker exec <old-sorrel-postgres-container> pg_dump -U <user> -Fc <db> > sorrel-old-backup-$(date +%Y%m%d).dump
```

Copy it off the host. Keep for a defined window (e.g. 30 days) before actually deleting.

## Phase 2 — decommission old sorrel's containers/volumes

```
cd <old-sorrel-compose-dir>
docker compose down -v   # -v removes volumes — irreversible, confirm Phase 1 backup first
```

Remove anything not covered by that compose file explicitly by name — don't
reach for `docker system prune`/`-a` on a shared host, it can take out
unrelated things. This also frees port 80/443 for this app's Traefik.

## Phase 3 — stop hyva's running stack (no data loss, just a pause)

```
cd /opt/hyva
docker compose -f docker-compose.prod.yml stop postgres
```

Full stop, not pause — copying a live Postgres data directory mid-write
risks corruption. The rest of the stack (backend, workers) can stay down too
during the cutover window; expect a short outage.

## Phase 4 — move the deploy directory and copy the Postgres volume

```
cp -r /opt/hyva /opt/sorrel        # compose file, .env, traefik/htpasswd — same host, plain cp is fine here

docker volume create sorrel_postgres-data
docker run --rm \
  -v hyva_postgres-data:/from:ro \
  -v sorrel_postgres-data:/to \
  alpine sh -c "cp -a /from/. /to/"
```

**RabbitMQ: skip the copy.** It's job-dispatch only, never a data store (see
`docs/ARCHITECTURE.md`) — starting it fresh/empty on the new stack is fine,
and a raw volume copy wouldn't cleanly work anyway since Mnesia's data
directory is keyed by hostname (`rabbit@$HOSTNAME`), which changes from
`hyva-rabbitmq` to `sorrel-rabbitmq` in the renamed compose file.

## Phase 5 — first deploy + cutover

1. Merge the rename branch, let CI build+push `sorrel-backend:latest` at least once.
2. Point the deploy workflow at `/opt/sorrel` (already set) and run it — pulls
   the image, runs migrations, `up -d`.
3. Verify: `/health`, login, store search/subscribe, dashboard — confirm the
   restored Postgres data is actually there (existing users/subscriptions
   show up, not an empty DB).
4. **Stripe webhook**: if the public domain/URL changes, update the webhook
   endpoint in the Stripe dashboard and rotate `STRIPE_WEBHOOK_SECRET` — otherwise
   billing events silently stop arriving. (Billing is currently paused
   pending real Stripe keys, so lower urgency now, but don't forget before
   billing goes live.)
5. Once confirmed good, remove `/opt/hyva` and the old `hyva_*` volumes.

## Not covered here (separate decisions, ask before doing)

- **GitHub repo rename** (`marijusar/hyva` → `marijusar/sorrel`) — cosmetic,
  GitHub keeps a redirect. Independent of this cutover, do whenever you like.
- **Local working-copy directory rename** (`~/Development/fullstack/hyva` →
  `.../sorrel`) — don't do this without a heads-up: this project's Claude
  memory files are keyed off the current directory path and won't follow
  automatically if the folder is renamed.
