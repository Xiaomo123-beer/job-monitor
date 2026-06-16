#!/bin/bash
set -e

echo "========================================="
echo "  岗位监测助手"
echo "========================================="
echo ""

# Ensure persistent data directory
mkdir -p /app/data

# Push database schema (idempotent)
echo "[Entrypoint] Syncing database..."
cd /app
npx prisma db push --schema=prisma/schema.prisma --accept-data-loss 2>&1 || true

echo "[Entrypoint] Starting server on :${PORT:-3000}"

exec node server.js
