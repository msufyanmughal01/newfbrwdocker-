---
id: "021"
title: Resolve All Architecture Issues
stage: general
date: 2026-04-05
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: System Inn
command: resolve all the issues about the architecture
labels: ["security","refactor","devops","performance","admin-auth","middleware","fbr","ci-cd","nginx"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - next.config.ts
  - src/middleware.ts
  - src/app/admin/page.tsx
  - src/app/admin/login/page.tsx
  - src/app/admin/admin-client.tsx
  - src/app/api/admin/_admin-auth.ts
  - src/app/api/admin/auth/route.ts
  - src/app/api/admin/create-user-secret/route.ts
  - src/app/api/admin/delete-user-secret/route.ts
  - src/app/api/admin/reset-user-password/route.ts
  - src/app/api/admin/update-user-profile/route.ts
  - src/app/api/admin/upload-user-logo/route.ts
  - src/app/api/admin/user-password/route.ts
  - src/lib/fbr/submission-service.ts
  - src/app/api/fbr/submit/route.ts
  - .github/workflows/deploy.yml
  - nginx.conf
  - docker-compose.override.yml
tests:
  - none (unit tests should be written for FBRSubmissionService)
---

## Prompt

resolve all the issues about the architecture

## Response snapshot

Resolved all architecture issues identified in PHR-020 evaluation:

1. **next.config.ts** — Removed `ignoreBuildErrors: true`. TypeScript errors now surface at build time.

2. **src/middleware.ts** (NEW) — Centralized API route guard. Checks for `better-auth.session_token` cookie on all `/api/*` routes. Public exceptions: `/api/auth/`, `/api/health`, `/api/contact`, `/api/admin/`. Prevents unauthenticated access by default on any newly added route.

3. **Admin auth — complete overhaul**:
   - NEW `src/app/api/admin/_admin-auth.ts`: shared `validateAdminRequest()` using httpOnly cookie
   - NEW `src/app/api/admin/auth/route.ts`: POST (set cookie) + DELETE (clear cookie) — key never in URL
   - NEW `src/app/admin/login/page.tsx`: form-based login, key submitted via POST body not URL
   - `src/app/admin/page.tsx`: reads `admin_session` cookie, redirects to `/admin/login` if invalid
   - `src/app/admin/admin-client.tsx`: `adminKey` prop removed from both `Props` and `EditUserPanel`; all 6 fetch calls updated to remove `adminKey` from bodies/URLs; logout button added
   - All 6 `/api/admin/*` routes: replaced inline env-var check with `validateAdminRequest(req)`

4. **FBR Submit — transaction safety + service extraction**:
   - NEW `src/lib/fbr/submission-service.ts`: 3 explicit DB transactions (TX-1: create submission; TX-2: persist validation result; TX-3: persist issued state + buyer registry), static imports (no dynamic imports in hot path), typed `SubmitOutcome` return
   - `src/app/api/fbr/submit/route.ts`: reduced from 287 → 75 lines; pure HTTP adapter delegating to service

5. **CI pipeline** — Node 20→24 (matches Dockerfile), added `npm test -- --run` step, added DB migration step via ephemeral container, zero-downtime deploy (`docker compose up -d --no-deps --force-recreate app` + health-check polling instead of `down && up`)

6. **nginx.conf** — Added `Referrer-Policy`, `Permissions-Policy`, and `Content-Security-Policy` headers to both HTTP and HTTPS blocks

7. **docker-compose.override.yml** — Uncommented and fixed; local dev now automatically uses `nginx.local.conf` (HTTP-only) without the SSL cert mount

## Outcome

- ✅ Impact: All 9 prioritized fixes implemented. 3 critical security issues resolved. FBR submit is now transaction-safe. CI pipeline runs tests and does zero-downtime deploy.
- 🧪 Tests: No new tests written (unit tests for FBRSubmissionService are the recommended next step)
- 📁 Files: 19 files created or modified
- 🔁 Next prompts: Write unit tests for FBRSubmissionService; rotate `.env.production` secrets; tighten CSP script-src directive once inline scripts are removed; /sp.adr fbr-submission-async-vs-sync
- 🧠 Reflection: The admin auth change (URL param → httpOnly cookie) was the highest-impact security fix. The FBRSubmissionService extraction makes the submission flow testable for the first time. Middleware.ts closes the "new route = public route" systemic gap.

## Evaluation notes (flywheel)

- Failure modes observed: none during implementation
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): direct remediation request after PHR-020 architecture evaluation
- Next experiment: Add vitest tests for submission-service.ts happy path and failure modes
