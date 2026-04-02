---
id: 012
title: Fix Next.js Docker + Nginx Crash Causes
stage: general
date: 2026-04-02
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: msufyanmughal01
command: "fix docker app collapsing after dockerizing using official Next.js Docker docs"
labels: ["docker","nginx","nextjs","deployment","bug-fix"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - Dockerfile
  - nginx.conf
  - nginx.local.conf
tests:
  - none
---

## Prompt

you have my chrome access now get the official docs of use nextjs with docker and nginx and implement that why my app is collapesing after dockerizing

## Response snapshot

Fetched official Next.js self-hosting docs (nextjs.org/docs/app/guides/self-hosting) and the official with-docker example Dockerfile from the Next.js canary repo. Identified 4 root causes and applied fixes:

1. **Dockerfile — missing `.next` dir ownership**: Official guide requires `mkdir .next && chown nextjs:nodejs .next` after creating the non-root user, before copying build artifacts. Without this, Next.js cannot write its runtime prerender cache → crash.

2. **nginx — hardcoded `Connection 'upgrade'`**: All locations used `Connection 'upgrade'` for every request. For non-WebSocket requests this breaks HTTP keep-alive and causes connection failures. Fixed using a `map` block: `map $http_upgrade $connection_upgrade { default upgrade; '' close; }`.

3. **nginx — missing `proxy_buffering off`**: Official docs explicitly state nginx must disable buffering for Next.js streaming (Suspense, Server Actions). Added `proxy_buffering off` to all proxy locations.

4. **nginx — no proxy timeouts**: Default nginx timeout is 60s. DB-heavy routes can exceed this. Added `proxy_read_timeout 120s`, `proxy_connect_timeout 10s`, `proxy_send_timeout 120s`.

## Outcome

- ✅ Impact: App should no longer crash/collapse after Docker build. nginx now correctly proxies all HTTP and WebSocket connections.
- 🧪 Tests: Manual — rebuild with `docker compose up --build` and verify app loads
- 📁 Files: Dockerfile, nginx.conf, nginx.local.conf
- 🔁 Next prompts: Test the build locally with `docker compose up --build`; if DB issues persist check .env.production DATABASE_URL
- 🧠 Reflection: The `Connection 'upgrade'` nginx bug is extremely common and rarely documented as a crash cause. The `.next` dir ownership is called out explicitly in the official Dockerfile example.

## Evaluation notes (flywheel)

- Failure modes observed: App crash after dockerizing, likely manifesting as 502 Bad Gateway or container restart loop
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Add `proxy_next_upstream error timeout` to nginx for automatic failover on upstream errors
