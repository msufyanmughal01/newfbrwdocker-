---
id: "020"
title: Architecture Evaluation FBR Portal
stage: general
date: 2026-04-05
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: System Inn
command: /engineering:architecture
labels: ["architecture","security","performance","devops","code-review"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/app/api/fbr/submit/route.ts
  - Dockerfile
  - docker-compose.yml
  - next.config.ts
  - src/lib/db/index.ts
  - .github/workflows/deploy.yml
  - src/app/admin/page.tsx
tests:
  - none
---

## Prompt

/engineering:architecture — Full architecture evaluation of the FBR Digital Invoicing Portal codebase. Analyze architecture style, project structure, scalability, maintainability, performance, security, DevOps/deployment, best practices, and provide a scored refactoring plan.

## Response snapshot

Delivered a 10-section architecture evaluation covering:
- Pattern: Modular Monolith (Next.js App Router + Layered API)
- Critical security issues: secrets in .env.production, admin via URL query param, no middleware.ts
- FBR submit route: 287-line handler with no DB transaction, 7 sequential writes
- Scalability bottlenecks: synchronous FBR submission, Neon HTTP driver without pooling, single-server deploy
- DevOps gaps: no vitest in CI, no migration step, Node version mismatch (CI=20 vs Docker=24), downtime on deploy
- ignoreBuildErrors: true in next.config.ts silences TypeScript errors to production
- Score: 5.5/10 — good bones, serious security and reliability gaps

## Outcome

- ✅ Impact: Full architectural picture produced with prioritized remediation list (4 Critical, 4 High, 5 Medium, 3 Low items)
- 🧪 Tests: n/a (analysis only)
- 📁 Files: No files modified
- 🔁 Next prompts: /sp.adr fbr-submission-async-vs-sync, fix secrets leak, add middleware.ts, wrap submit in DB transaction
- 🧠 Reflection: The codebase has solid structural intent and a written constitution, but security posture has three independent critical vulnerabilities that need immediate attention before any feature work.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): engineering:architecture skill
- Next experiment: Apply /sp.adr for FBR sync vs async decision
