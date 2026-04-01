# # ── Stage 1: Dependencies ────────────────────────────────────────────────────
# FROM node:20-alpine AS deps
# WORKDIR /app

# # Install libc compat for native modules on Alpine
# RUN apk add --no-cache libc6-compat

# COPY package.json package-lock.json ./
# RUN npm ci

# # ── Stage 2: Builder ─────────────────────────────────────────────────────────
# FROM node:20-alpine AS builder
# WORKDIR /app

# ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED=1

# # Copy installed node_modules from deps stage
# COPY --from=deps /app/node_modules ./node_modules

# # Copy source
# COPY . .

# # Build Next.js standalone output.
# # DATABASE_URL is NOT needed at build time — db/index.ts uses lazy init.
# # BETTER_AUTH_URL is NOT needed at build time — auth.ts only reads it at runtime.
# RUN npm run build

# # ── Stage 3: Runner ──────────────────────────────────────────────────────────
# FROM node:20-alpine AS runner
# WORKDIR /app

# RUN apk add --no-cache libc6-compat curl

# ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED=1

# # Non-root user for security
# RUN addgroup --system --gid 1001 nodejs \
#  && adduser  --system --uid 1001 nextjs

# # public/ must be readable by the nextjs user
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# # Standalone server output (includes its own minimal node_modules)
# COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# # Static assets served by the standalone server under /_next/static/
# COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# USER nextjs

# EXPOSE 3000

# ENV PORT=3000
# ENV HOSTNAME=0.0.0.0

# # Use exec form so node is PID 1 and receives shutdown signals correctly
# CMD ["node", "server.js"]
# ── Stage 1: Dependencies ────────────────────────────────────────────────────

# ── Stage 1: Dependencies ────────────────────────────────────────────────────

FROM node:20-alpine AS deps
WORKDIR /app

# Required for native modules compatibility

RUN apk add --no-cache libc6-compat

# Copy only package files (better caching)

COPY package.json package-lock.json ./

# Faster + stable install

RUN npm ci --prefer-offline --no-audit --progress=false

# ── Stage 2: Builder ─────────────────────────────────────────────────────────

FROM node:20-alpine AS builder
WORKDIR /app

# MUST exist here too

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy dependencies

COPY --from=deps /app/node_modules ./node_modules

# Copy source code

COPY . .

# Build Next.js standalone output

RUN npm run build

# ── Stage 3: Runner ──────────────────────────────────────────────────────────

FROM node:20-alpine AS runner
WORKDIR /app

# Runtime dependencies

RUN apk add --no-cache libc6-compat curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user

RUN addgroup --system --gid 1001 nodejs \
&& adduser --system --uid 1001 nextjs

# Copy public assets

COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy standalone build (includes server.js)

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets

COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
