#!/usr/bin/env bash
# Install PostgreSQL on this server, create the app role/database and apply the schema.
# Usage: sudo bash scripts/setup-postgres.sh
set -euo pipefail

cd "$(dirname "$0")/.."

# Make .env values (especially DATABASE_URL) available to this shell so the
# schema is applied as the app role, not as the postgres OS user.
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

DB_NAME="${DB_NAME:-pagalpagal}"
DB_USER="${DB_USER:-pagalpagal}"
DB_PASSWORD="${DB_PASSWORD:-}"

if [ -z "$DB_PASSWORD" ]; then
  DB_PASSWORD="$(node -e '
    const fs = require("fs");
    const text = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "";
    const match = text.match(/^DATABASE_URL=(.*)$/m);
    if (!match) process.exit(0);
    try { process.stdout.write(decodeURIComponent(new URL(match[1].trim()).password)); } catch {}
  ')"
fi

if [ -z "$DB_PASSWORD" ]; then
  echo "Set DB_PASSWORD or DATABASE_URL in .env before running this script."
  exit 1
fi

echo "==> Installing PostgreSQL"
sudo apt-get update -y
sudo apt-get install -y postgresql postgresql-contrib

echo "==> Starting PostgreSQL"
sudo systemctl enable --now postgresql || true

echo "==> Creating role '${DB_USER}' and database '${DB_NAME}'"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
SQL

echo "==> Building the app so the schema can be exported"
npm ci
npm run build

echo "==> Applying the schema"
if [ -n "${DATABASE_URL:-}" ]; then
  node scripts/export-schema.mjs | psql "$DATABASE_URL" -v ON_ERROR_STOP=1
else
  node scripts/export-schema.mjs | sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1
fi

# Repair ownership if the database was created by an earlier run as postgres.
for t in users auth_tokens refresh_tokens media user_photos likes passes blocks matches messages read_states billing_checkouts subscriptions webhook_events; do
  sudo -u postgres psql -q -d "$DB_NAME" -c "ALTER TABLE $t OWNER TO $DB_USER;"
done

echo "==> PostgreSQL is ready."
echo "DATABASE_URL=postgresql://${DB_USER}:<password>@127.0.0.1:5432/${DB_NAME}"
echo "Next: copy .env.example to .env, fill in your secrets, then run bash scripts/deploy.sh"
