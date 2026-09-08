#!/usr/bin/env bash
# Applies supabase/migrations/*.sql in order against SUPABASE_DB_URL.
# Each file is idempotent, so re-running is safe.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${SUPABASE_DB_URL:-}" && -f .dev.vars ]]; then
  # .dev.vars is git-ignored and holds the connection string alongside the
  # other server secrets.
  SUPABASE_DB_URL="$(grep -E '^SUPABASE_DB_URL=' .dev.vars | head -1 | cut -d= -f2- | tr -d '"')"
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is not set. Put it in .dev.vars or export it." >&2
  exit 1
fi

for file in supabase/migrations/*.sql; do
  echo "==> $file"
  psql "$SUPABASE_DB_URL" --quiet --set ON_ERROR_STOP=1 --file "$file"
done

echo "All migrations applied."
