# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Install ALL dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client (TypeScript files into src/generated/)
RUN npx prisma generate

# Build Next.js (compiles Prisma client TS → JS into .next/server)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 2: Runtime ────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Chromium for Puppeteer
RUN apk add --no-cache \
    chromium chromium-chromedriver \
    nss freetype harfbuzz ca-certificates \
    ttf-freefont ttf-liberation \
    dumb-init bash curl \
    python3 make g++

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/data && \
    chown nextjs:nodejs /app/data

# Copy standalone output
COPY --from=builder /app/.next/standalone ./

# Copy static assets
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema (for migrations in entrypoint)
COPY --from=builder /app/prisma ./prisma

# Copy generated Prisma client (TypeScript source - needed for prisma generate to work)
COPY --from=builder /app/src/generated ./src/generated

# Rebuild native modules for alpine (better-sqlite3)
RUN cd /app && npm rebuild better-sqlite3 2>/dev/null || true

# Re-generate Prisma client in production context
# This compiles the TS client to JS using the production node_modules
RUN npx prisma generate 2>/dev/null || true

# Entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/docker-entrypoint.sh"]
