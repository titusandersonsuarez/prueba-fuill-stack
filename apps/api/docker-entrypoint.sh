#!/bin/sh
# Self-bootstrapping entrypoint for the API image.
#
# Used by Railway (and any "deploy from image / Dockerfile" target) where the
# docker-compose command override is NOT present. It guarantees the schema is
# applied on every boot, and seeds demo data ONLY on a fresh database.
#
# The seed script wipes all tables, so it must never run on a restart/redeploy
# of an already-populated database — only on the very first deploy.
set -e

cd /app/apps/api

echo "[entrypoint] prisma migrate deploy..."
node_modules/.bin/prisma migrate deploy

# Exit 0 => no users => fresh DB => seed.  Exit 1 => has data or error => skip.
if node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(c=>process.exit(c>0?1:0)).catch(()=>process.exit(1))"; then
  echo "[entrypoint] empty database — seeding demo data..."
  node dist/prisma/seed.js || echo "[entrypoint] seed failed, continuing without it"
else
  echo "[entrypoint] database already populated — skipping seed"
fi

echo "[entrypoint] starting API..."
exec node dist/src/main.js
