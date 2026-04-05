---
id: "017"
title: Docker Next.js Crash Deep-Dive Audit
stage: general
date: 2026-04-03
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: system-inn
command: audit docker crash causes
labels: ["docker","nextjs","sharp","better-auth","standalone","security","healthcheck"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - Dockerfile
  - next.config.ts
  - package.json
  - .dockerignore
  - docker-compose.yml
  - .env.production
tests:
  - none
---

## Prompt

"I have a Next.js application that runs perfectly via npm run dev/start on my local machine but crashes or 'collapses' when running inside a Docker container. Please perform a deep-dive audit based on the following constraints:

1. Path Resolution & OS Differences: In my local environment, paths are resolved based on my host OS. In Docker, we are using a Linux environment. Check my codebase for hardcoded absolute paths (e.g., C:\Users\...) or incorrect case-sensitivity in imports (Linux is case-sensitive, Windows is not).

2. Native Dependencies: Specifically check for the sharp package or any SWC-based binaries. If these were installed on my host and copied into the container, they will fail. Provide the specific RUN commands to rebuild these for the container's architecture.

3. Environment & Build-Time Constants: Audit my next.config.js for the output: 'standalone' setting. Also, check if my NEXT_PUBLIC_ variables are being passed during the docker build phase (ARG) or only at runtime (ENV), as Next.js requires these at build time.

4. Dockerfile Structure: Analyze my Dockerfile for a multi-stage build. Ensure that node_modules are not being copied from the host via a missing .dockerignore, and that the WORKDIR is correctly mapped to the internal Linux pathing (e.g., /app).

5. File System Permissions: Ensure the nextjs user inside the container has permission to read/write to the .next and public folders.

Please review my package.json, next.config.js, and Dockerfile and identify the specific package or configuration line causing the collapse."

## Response snapshot

Full audit performed across Dockerfile, next.config.ts, package.json, .dockerignore, docker-compose.yml, .env.production, and src/lib/db/index.ts.

CONFIRMED CLEAN: .dockerignore excludes node_modules; output: standalone set; 3-stage multi-stage build; sharp installed inside Docker not copied from host; WORKDIR /app consistent; USER node before CMD; no NEXT_PUBLIC_ variables; no hardcoded Windows paths; permissions on .next and public correct.

CRITICAL ISSUES FOUND:
1. sharp ^0.34.5 (package.json:38) is NOT traced into standalone output by @vercel/nft because it is lazily/optionally loaded by Next.js image optimizer. Result: missing from /app/node_modules at runtime → crash or image optimization failure. Fix: add outputFileTracingIncludes to next.config.ts.
2. BETTER_AUTH_URL=http://localhost:3000 in .env.production:6 — localhost inside container resolves to the container, not host. All auth flows (login, OAuth, CSRF) fail silently. Fix: set to real public domain.
3. /api/health route referenced in docker-compose.yml:21 healthcheck does not exist. Container always marked unhealthy. Fix: create src/app/api/health/route.ts.
4. .env.production not in .dockerignore — real credentials (Neon DB password, Google OAuth secret, ENCRYPTION_KEY, RESEND_API_KEY) baked into image layers via COPY . . at Dockerfile:45. Fix: add .env.production to .dockerignore.
5. typescript.ignoreBuildErrors: true in next.config.ts:5 silently swallows TypeScript errors during build.

## Outcome

- ✅ Impact: Identified 5 issues (2 critical crash causes, 2 high-severity, 1 medium) across Dockerfile, next.config.ts, .env.production, .dockerignore, and docker-compose.yml
- 🧪 Tests: none run — read-only audit
- 📁 Files: Dockerfile, next.config.ts, package.json, .dockerignore, docker-compose.yml, .env.production, src/lib/db/index.ts
- 🔁 Next prompts: fix sharp tracing in next.config.ts; create /api/health route; add .env.production to .dockerignore; update BETTER_AUTH_URL
- 🧠 Reflection: The sharp standalone tracing gap is the most subtle and common Next.js Docker crash cause. BETTER_AUTH_URL=localhost is a classic container networking mistake.

## Evaluation notes (flywheel)

- Failure modes observed: none — clean audit run
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): add outputFileTracingIncludes for sharp and rebuild
