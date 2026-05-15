# ─── Build context: monorepo root ────────────────────────────────────────────
# docker build -f apps/api/Dockerfile -t prescriptions-api .

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

# ── Stage 1: Install & build ──────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Copy workspace manifests first (maximise layer cache)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# Copy source (after install so dep layer is cached separately)
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# 1) Compile shared package → packages/shared/dist/  (main: ./dist/index.js)
RUN pnpm --filter @prescriptions/shared build

# 2) Generate Prisma client
RUN pnpm --filter @prescriptions/api exec prisma generate

# 3) Compile NestJS API
RUN pnpm --filter @prescriptions/api build

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy node_modules from builder so native addons (bcrypt) are pre-compiled
# for the same Alpine platform without needing build tools in production.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Compiled shared package (workspace symlink resolves → packages/shared/dist/)
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY packages/shared/package.json ./packages/shared/

# Compiled API output
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Prisma schema (needed for `prisma migrate deploy`) + generated client
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Workspace manifests (needed by Node module resolution)
COPY pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/

EXPOSE 3001

# To run migrations before startup:
#   docker compose run --rm api sh -c "cd apps/api && node_modules/.bin/prisma migrate deploy"
CMD ["node", "apps/api/dist/main.js"]
