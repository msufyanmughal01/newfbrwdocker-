---
id: "015"
title: Compare Dockerfile Official Nextjs vs Project
stage: general
date: 2026-04-02
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: user
command: compare official nextjs dockerfile with project dockerfile
labels: ["docker", "nextjs", "comparison", "dockerfile"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - Dockerfile
tests: []
---

## Prompt

User asked to read:
- https://github.com/vercel/next.js/tree/canary/examples/with-docker-multi-env
- https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

Then compare which code is better between what was written in the project vs the official Next.js Dockerfile.

## Response

Fetched both official Next.js Docker examples (canary branch). Performed detailed comparison.

**Official wins:**
- `--mount=type=cache` BuildKit cache mounts for faster rebuilds
- Multi-package-manager support (npm/yarn/pnpm auto-detect via lockfile)
- Node 24 (newer LTS) with `ARG NODE_VERSION` for easy upgrades

**Project wins:**
- `curl` installed in runner (needed for Docker healthchecks)
- Explicit UID/GID 1001 for `nextjs:nodejs` user (better for volume permission mapping)
- NEXT_TELEMETRY_DISABLED=1 set by default
- Alpine base (~50MB smaller than slim)

**Verdict:** Project Dockerfile is production-ready and has real advantages. Main improvement to adopt: `--mount=type=cache` for npm in the deps stage, and bump Node to 22/24-alpine.
