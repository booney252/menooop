#!/usr/bin/env bash
# Applies the real migrations to a throwaway local Postgres and runs the
# row-level-security suite against them. No Supabase project needed.
#
#   npm run db:verify
#
# Requires a local postgres (apt install postgresql). PGPORT defaults to 5433
# so it never collides with a real one on 5432.
set -euo pipefail

PORT="${PGPORT:-5433}"
DB="${PGDATABASE:-marlow_verify}"
HOST="${PGHOST:-127.0.0.1}"
USER="${PGUSER:-marlow}"

psql -h "$HOST" -p "$PORT" -U "$USER" -d postgres -tc "select 1" >/dev/null 2>&1 || {
  echo "No Postgres on $HOST:$PORT. Start one, or see supabase/local/README.md." >&2
  exit 1
}

dropdb -h "$HOST" -p "$PORT" -U "$USER" --if-exists "$DB"
createdb -h "$HOST" -p "$PORT" -U "$USER" "$DB"

run() { psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -v ON_ERROR_STOP=1 -q -f "$1"; }

run supabase/local/shim.sql
for m in supabase/migrations/*.sql; do
  echo "  applying $(basename "$m")"
  run "$m"
done
run supabase/local/rls-test.sql
