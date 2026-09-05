#!/usr/bin/env bash
set -euo pipefail

# Clones the production Postgres database and restores it into the local
# dev stack, replacing whatever's there. Contains real customer data
# (emails, Stripe IDs, etc.) once downloaded — delete the dump when done,
# don't commit it, treat it like any other prod secret.
#
# Usage:
#   HETZNER_HOST=<host> HETZNER_SSH_USER=<user> ./scripts/clone-prod-db.sh
#
# Same host/user as the deploy GH Action secrets. Export them in your own
# shell (or a local, gitignored .env you source) — never hardcode here.
#
# Optional overrides:
#   REMOTE_COMPOSE_DIR   default: /opt/sorrel   (where docker-compose.prod.yml lives on the server)
#   DEV_POSTGRES_USER    default: postgres
#   DEV_POSTGRES_DB      default: sorrel_dev

HETZNER_HOST="${HETZNER_HOST:?set HETZNER_HOST}"
HETZNER_SSH_USER="${HETZNER_SSH_USER:?set HETZNER_SSH_USER}"
REMOTE_COMPOSE_DIR="${REMOTE_COMPOSE_DIR:-/opt/sorrel}"
DEV_POSTGRES_USER="${DEV_POSTGRES_USER:-postgres}"
DEV_POSTGRES_DB="${DEV_POSTGRES_DB:-sorrel_dev}"

DUMP_FILE="/tmp/sorrel-prod-$(date +%Y%m%d-%H%M%S).dump"

echo "This will REPLACE your local dev database with a snapshot of PRODUCTION data."
read -r -p "Type 'yes' to continue: " confirm
[[ "$confirm" == "yes" ]] || { echo "Aborted."; exit 1; }

echo "==> Reading prod DB credentials from the server's .env..."
PROD_USER=$(ssh "$HETZNER_SSH_USER@$HETZNER_HOST" "grep '^POSTGRES_USER=' $REMOTE_COMPOSE_DIR/.env | cut -d= -f2")
PROD_DB=$(ssh "$HETZNER_SSH_USER@$HETZNER_HOST" "grep '^POSTGRES_DB=' $REMOTE_COMPOSE_DIR/.env | cut -d= -f2")

echo "==> Dumping production database ($PROD_DB) via SSH..."
ssh "$HETZNER_SSH_USER@$HETZNER_HOST" \
  "cd $REMOTE_COMPOSE_DIR && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $PROD_USER -Fc $PROD_DB" \
  > "$DUMP_FILE"

echo "==> Downloaded to $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"

echo "==> Restoring into local dev database ($DEV_POSTGRES_DB)..."
docker compose exec -T postgres pg_restore \
  --clean --if-exists --no-owner --no-privileges \
  -U "$DEV_POSTGRES_USER" -d "$DEV_POSTGRES_DB" < "$DUMP_FILE"

echo "==> Done. Local dev DB now mirrors production as of $(date)."
echo "==> Dump kept at $DUMP_FILE — real customer data, delete it once you're done: rm $DUMP_FILE"
