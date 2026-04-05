---
id: "013"
title: "Fetch Vercel Next.js Docker Examples"
stage: general
date: "2026-04-02"
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: architext
command: fetch github urls
labels: ["docker", "nextjs", "reference", "multi-env", "dockerfile"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - history/prompts/general/013-fetch-vercel-nextjs-docker-examples.general.prompt.md
tests: []
---

# Prompt

Fetch the content of these two GitHub URLs and return the full content of each:
1. https://github.com/vercel/next.js/tree/canary/examples/with-docker-multi-env
2. https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

For URL 1, also fetch the raw files inside that directory (Dockerfile, docker-compose.yml, etc). Try fetching:
- https://raw.githubusercontent.com/vercel/next.js/canary/examples/with-docker-multi-env/Dockerfile
- https://raw.githubusercontent.com/vercel/next.js/canary/examples/with-docker-multi-env/docker-compose.yml
- https://raw.githubusercontent.com/vercel/next.js/canary/examples/with-docker-multi-env/.env.production

For URL 2, fetch the raw file:
- https://raw.githubusercontent.com/vercel/next.js/canary/examples/with-docker/Dockerfile

Return all content verbatim.

# Response

Retrieved all content via GitHub API (gh cli). Key findings:

## with-docker-multi-env structure
- No Dockerfile at root; Dockerfiles are at `docker/development/Dockerfile`, `docker/staging/Dockerfile`, `docker/production/Dockerfile`
- No `docker-compose.yml`; files are named `compose.yaml`
- No `.env.production`; pattern uses `.env.production.sample`, `.env.staging.sample`, `.env.development.sample`
- Multi-env strategy: each environment's Dockerfile does `COPY .env.<env>.sample .env.production` before `npm run build`
- Base image: `node:20-alpine`
- User: custom `nextjs` user created with `addgroup`/`adduser`
- Ports: development=3001, staging=3002, production=3003

## with-docker (single-env) Dockerfile
- Base image: `node:24.13.0-slim` (not Alpine)
- Uses `--mount=type=cache` for npm/yarn/pnpm caches
- Uses built-in `node` user (no addgroup/adduser)
- 3 stages: dependencies, builder, runner
- Sets `ENV HOSTNAME="0.0.0.0"` in runner stage

## Outcome
All file contents returned verbatim to user. No files created or modified in the project.
