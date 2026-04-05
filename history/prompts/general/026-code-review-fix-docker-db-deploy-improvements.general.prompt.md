---
id: "026"
title: Code Review fix/docker-db-deploy-improvements PR
stage: general
date: 2026-04-05
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: System Inn
command: /engineering:code-review
labels: ["security","docker","crypto","ci-cd","code-review"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/app/api/admin/auth/route.ts
  - src/app/api/admin/_admin-auth.ts
  - src/app/api/admin/reset-user-password/route.ts
  - src/lib/crypto/symmetric.ts
  - src/lib/crypto/transit-server.ts
  - src/lib/crypto/transit-client.ts
  - src/lib/crypto/with-decryption.ts
  - .github/workflows/deploy.yml
  - Dockerfile
  - docker-compose.yml
  - nginx.conf
tests:
  - none run
---

## Prompt

/engineering:code-review (no additional arguments — reviews current branch fix/docker-db-deploy-improvements vs main)

## Response snapshot

Performed a structured code review across security, performance, correctness, and maintainability dimensions.

**3 Critical issues found:**
1. Admin password reset stores AES-encrypted password instead of bcrypt hash — breaks user login after reset.
2. Admin session cookie stores raw ADMIN_SECRET_KEY value — should store opaque session token.
3. DB migration error suppression (`|| echo ...`) swallows real migration failures, allowing broken schema deploys.

**3 High issues:**
4. Rollback container name mismatch (docker compose vs manual docker stop/rm).
5. Migration container missing `--network` flag — can't reach Postgres.
6. No rate limiting on admin login endpoint.

**3 Medium issues:**
7. Timing-unsafe string comparison in `validateAdminRequest`.
8. SHA-256 used as KDF instead of HKDF.
9. ECDH private key logged to stdout in dev mode.

**4 Low issues:**
10. btoa spread pattern may overflow on large payloads.
11. Two separate RUN commands in Dockerfile (extra layer).
12. YOUR_DOMAIN placeholder in nginx.conf.
13. NEXT_TELEMETRY_DISABLED not set in runner stage.

**Verdict:** Request Changes — issues #1 and #3 are functional blockers for production safety.

## Outcome

- ✅ Impact: Identified 3 critical, 3 high, 3 medium, 4 low issues across the PR. Most critical are a cryptographic misuse (passwords encrypted not hashed) and a CI/CD reliability gap (migration errors silently swallowed).
- 🧪 Tests: none run
- 📁 Files: read-only review, no files modified
- 🔁 Next prompts: Fix issue #1 (password hashing), fix issue #3 (migration error handling), fix issue #4 (rollback container naming)
- 🧠 Reflection: The infrastructure and transit-encryption architecture are well-designed. The critical bugs are in the application layer, specifically in how passwords are stored and how CI errors are handled.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Fix password hashing in reset-user-password route by checking better-auth's internal hash API
