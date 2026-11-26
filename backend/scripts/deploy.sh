#!/usr/bin/env bash
# Build and start the backend with PM2 on the VPS.
# Usage: bash scripts/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "No .env found. Copy .env.example to .env and edit it first."
  exit 1
fi

echo "==> Installing dependencies"
npm ci

echo "==> Building"
npm run build

echo "==> Removing dev-only dependencies"
npm prune --omit=dev

if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 is not installed. Run: npm install -g pm2"
  exit 1
fi

echo "==> Starting with PM2"
pm2 delete pagalpagal >/dev/null 2>&1 || true
pm2 start ecosystem.config.cjs
pm2 save

echo "==> Deployed. Check: curl http://127.0.0.1:4000/health"
