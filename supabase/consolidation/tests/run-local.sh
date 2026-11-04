#!/usr/bin/env bash
# End-to-end test of the consolidation scripts against a LOCAL Supabase stack.
#
# Prereqs: supabase CLI, docker, psql, node >= 18, and a local stack started
# from a fresh `supabase db reset` whose config.toml has
#   [api] schemas = ["public", "graphql_public", "boatbooking", "tt"]
#
# Usage:
#   SUPABASE_DB_CONTAINER=supabase_db_<project_id> \
#   SUPABASE_ANON_KEY=... SUPABASE_SERVICE_KEY=... \
#   TT_REPO=/path/to/tt ./run-local.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
BB_SQL="$HERE/.."
TT_REPO="${TT_REPO:-$HERE/../../../../tt}"
TT_SQL="$TT_REPO/supabase/consolidation"
CONTAINER="${SUPABASE_DB_CONTAINER:?set SUPABASE_DB_CONTAINER (docker ps)}"
BASE="${LOCAL_DB_BASE:-postgresql://postgres:postgres@127.0.0.1:54322}"
export TARGET_DB_URL="$BASE/postgres"
export TT_SOURCE_DB_URL="$BASE/ttsource"
export PGOPTIONS="-c client_min_messages=warning"
P=(psql -X -q -v ON_ERROR_STOP=1)

echo "== simulated old tt project (separate database with its own auth schema)"
"${P[@]}" "$TARGET_DB_URL" -c "drop database if exists ttsource" -c "create database ttsource"
"${P[@]}" "$TT_SOURCE_DB_URL" -c "create schema if not exists extensions"
docker exec "$CONTAINER" pg_dump -U postgres -s -n auth --no-owner --no-privileges postgres | "${P[@]}" "$TT_SOURCE_DB_URL" >/dev/null
"${P[@]}" "$TT_SOURCE_DB_URL" -f "$HERE/fixtures/tt_legacy.sql" >/dev/null
"${P[@]}" "$TT_SOURCE_DB_URL" -f "$HERE/fixtures/seed_tt.sql" >/dev/null

echo "== legacy boatbooking (public schema) + users"
"${P[@]}" "$TARGET_DB_URL" -f "$HERE/fixtures/bb_legacy.sql" >/dev/null
"${P[@]}" "$TARGET_DB_URL" -f "$HERE/fixtures/seed_bb.sql" >/dev/null

echo "== consolidation"
"${P[@]}" "$TARGET_DB_URL" -f "$BB_SQL/01_shared_platform.sql"
"${P[@]}" "$TARGET_DB_URL" -f "$BB_SQL/02_boatbooking_schema.sql"
"${P[@]}" "$TARGET_DB_URL" -f "$TT_SQL/03_tt_schema.sql"
"$TT_SQL/migrate_tt_data.sh"

echo "== idempotency (re-run 01-03)"
for f in "$BB_SQL/01_shared_platform.sql" "$BB_SQL/02_boatbooking_schema.sql" "$TT_SQL/03_tt_schema.sql"; do
  "${P[@]}" "$TARGET_DB_URL" -f "$f"
done

echo "== restart PostgREST so it picks up the new schemas"
docker restart "${CONTAINER/supabase_db_/supabase_rest_}" >/dev/null
for _ in $(seq 30); do
  curl -sf -o /dev/null "${SUPABASE_URL:-http://127.0.0.1:54321}/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" && break
  sleep 1
done

echo "== RLS / grant tests"
node "$HERE/rls.test.mjs"
