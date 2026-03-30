---
id: "006"
title: "Complete Architecture Analysis — Multi-tenancy, Token Security, FBR Workflow"
stage: misc
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: 005-fbr-compliance-platform
branch: 005-fbr-compliance-platform
user: System Inn
command: /sp.analyze
labels: ["architecture","multi-tenancy","security","fbr-api","token-management","rls","encryption","ui-ux","performance"]
links:
  spec: "specs/005-fbr-compliance-platform/spec.md"
  ticket: null
  adr: null
  pr: null
files:
  - src/lib/db/schema/index.ts
  - src/lib/db/schema/invoices.ts
  - src/lib/db/schema/fbr.ts
  - src/lib/db/schema/business-profiles.ts
  - src/lib/db/schema/hs-code-master.ts
  - src/lib/fbr/api-client.ts
  - src/lib/fbr/post-invoice.ts
  - src/lib/fbr/validate.ts
  - src/lib/settings/encryption.ts
  - src/lib/auth.ts
  - src/app/api/fbr/submit/route.ts
  - src/app/api/fbr/validate/route.ts
  - src/app/api/invoices/[id]/route.ts
  - src/app/(dashboard)/invoices/invoice-form-client.tsx
  - src/app/(dashboard)/invoices/drafts/page.tsx
tests:
  - "none run — analysis session"
---

## Prompt

/sp.analyze /sp.analyze

Project Context:
I am building a multi-tenant SaaS-based FBR Digital Invoicing Portal using Next.js (App Router), Neon PostgreSQL, Drizzle ORM, and Better Auth. The system integrates with Pakistan FBR official Digital Invoicing APIs.

I need a complete architectural and implementation analysis for:
1. Multi-tenancy architecture (shared DB + RLS, schema isolation options)
2. FBR API token handling — secure storage, encryption, lifecycle, refresh
3. FBR invoice workflow — HS codes, validation, status tracking
4. UI/UX issues — white-on-white, draft popup bug, status display
5. Performance & scalability — connection pooling, rate limiting, queues
6. Enhancement recommendations — audit log, RBAC, bulk submission, retry queue
7. Security audit — any type in encryption, token lifecycle, SQL injection, tenant isolation

## Response snapshot

Comprehensive architecture analysis delivered covering all 7 sections. Key findings:

**Strengths confirmed:**
- AES-256-GCM encryption with random IV and auth tag (correct)
- FBR token stored DB-only, never client-side (correct)
- Per-user token resolution in api-client.ts (correct)
- Invoice immutability enforcement once issued (correct)
- Full fbrSubmissions audit trail with request/response JSONB (correct)
- Two-stage validate-then-submit workflow (correct)

**Gaps identified:**
1. buyerRegistry.organizationId is loose text with no FK — cross-tenant risk if organizationId collides
2. No Neon RLS — tenant isolation is application-layer only (single missing WHERE = data leak)
3. Missing performance indexes on userId FK columns across all tenant-scoped tables
4. No FBR Bearer token expiry tracking — tokens may silently expire
5. fbrReferenceCache has no environment discriminator — sandbox/prod may collide
6. No submission retry queue — failed invoices require manual retry
7. No audit_log table — only FBR submission events are tracked
8. Draft popup bug: DraftsClient renders on New Invoice page incorrectly
9. White-on-white CSS: globals.css color token misconfiguration

**Architecture recommendations:**
- Keep Shared DB + userId tenancy model (correct for scale)
- Add Neon RLS as defense-in-depth second layer
- Add keyVersion to businessProfiles for encryption key rotation
- Store Client Credentials separately from cached Bearer Token with TTL
- Add submission_queue table + cron for background retry
- Add audit_log table for full user action trail
- Fix buyerRegistry to use userId FK
- Add environment discriminator to fbrReferenceCache keys

**Priority P0 (security):**
1. Fix buyerRegistry.organizationId → userId FK
2. Add Neon RLS policies
3. Add indexes on userId FKs
4. Add Bearer token expiry tracking

## Outcome

- ✅ Impact: Full architectural gap analysis completed; 13 prioritized action items identified across security, correctness, and feature categories
- 🧪 Tests: No tests run (analysis session)
- 📁 Files: 15 files read and analyzed (schema, FBR client, encryption, auth, API routes)
- 🔁 Next prompts: `/sp.adr fbr-token-lifecycle-and-rls-strategy` to document key architectural decisions; then implement P0 security fixes
- 🧠 Reflection: The encryption implementation is solid; the main systemic risk is absence of RLS and the buyerRegistry organizationId gap. The token lifecycle (no expiry tracking, no refresh) is the most likely production failure point.

## Evaluation notes (flywheel)

- Failure modes observed: buyerRegistry scope gap could cause cross-tenant data exposure at scale; token expiry not tracked
- Graders run and results (PASS/FAIL): no automated graders — analysis session
- Prompt variant (if applicable): sp.analyze comprehensive
- Next experiment: implement Neon RLS and test with two test users to verify isolation
