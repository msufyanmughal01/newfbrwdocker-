---
id: "014"
title: "Fetch Raw Canary Next.js Docker Dockerfiles"
stage: general
date: "2026-04-02"
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: architext
command: fetch raw github urls
labels: ["docker", "nextjs", "dockerfile", "canary", "reference", "multi-env"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - history/prompts/general/014-fetch-raw-canary-nextjs-docker-dockerfiles.general.prompt.md
tests: []
---

# Prompt

Fetch these URLs and return the full raw content of each:
1. https://raw.githubusercontent.com/vercel/next.js/canary/examples/with-docker/Dockerfile
2. https://raw.githubusercontent.com/vercel/next.js/canary/examples/with-docker-multi-env/Dockerfile

Return each file's content verbatim with clear labels.

# Response

## URL 1: `examples/with-docker/Dockerfile`

Fetched successfully. Key characteristics:
- Base image: `node:24.13.0-slim` (Debian slim, not Alpine)
- 3 stages: `dependencies`, `builder`, `runner`
- Uses `--mount=type=cache` for npm/yarn/pnpm stores in the deps stage
- Uses built-in `node` user (no addgroup/adduser needed)
- `ENV HOSTNAME="0.0.0.0"` set in runner stage
- CMD in exec form: `["node", "server.js"]`
- Copies `.next/standalone`, `.next/static`, and `public`

## URL 2: `examples/with-docker-multi-env/Dockerfile`

This URL returned 404 — there is no root-level Dockerfile. The example uses environment-specific Dockerfiles at:
- `docker/production/Dockerfile` — copies `.env.production.sample` as `.env.production`
- `docker/staging/Dockerfile` — copies `.env.staging.sample` as `.env.production`
- `docker/development/Dockerfile` — copies `.env.development.sample` as `.env.production`

All three multi-env Dockerfiles share the same 3-stage structure (deps/builder/runner) using:
- Base image: `node:20-alpine`
- Custom `nextjs`/`nodejs` user created via `addgroup`/`adduser` (UID 1001)
- CMD in shell form: `HOSTNAME="0.0.0.0" node server.js`
- No build cache mounts

All four Dockerfiles (1 single-env + 3 multi-env) were returned verbatim to the user.
