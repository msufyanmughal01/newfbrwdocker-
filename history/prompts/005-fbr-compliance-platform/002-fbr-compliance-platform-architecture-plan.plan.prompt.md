---
id: 002
title: FBR Compliance Platform Architecture Plan
stage: plan
date: 2026-02-19
surface: agent
model: claude-sonnet-4-6
feature: 005-fbr-compliance-platform
branch: 005-fbr-compliance-platform
user: System Inn
command: /sp.plan
labels: ["plan","architecture","fbr","invoicing","draft-fix","hs-codes","immutability","ui"]
links:
  spec: specs/005-fbr-compliance-platform/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-fbr-compliance-platform/plan.md
  - specs/005-fbr-compliance-platform/research.md
  - specs/005-fbr-compliance-platform/data-model.md
  - specs/005-fbr-compliance-platform/quickstart.md
  - specs/005-fbr-compliance-platform/contracts/api-contracts.md
tests:
  - Constitution check: all 10 principles PASS
---

## Prompt

(empty — /sp.plan invoked without additional arguments)

## Response snapshot

Executed full /sp.plan workflow for 005-fbr-compliance-platform. Explored codebase to determine confirmed tech stack (Next.js 16, TypeScript 5, Drizzle ORM + Neon PostgreSQL, better-auth, Vitest + Playwright). Identified 9 architectural decisions documented in research.md:

1. Draft storage: migrate from IndexedDB (client-side) to server-side PostgreSQL exclusively — fixes popup bug
2. HS Code Master: new `hs_code_master` table (user-scoped pinned codes) + fallback to FBR reference cache
3. Business profile auto-create: better-auth `user.create.after` hook
4. Invoice status alignment: map spec terms to existing DB enum without schema change
5. Draft search/filter: convert DraftsPage to server shell + DraftsClient
6. Immutability guard: 409 response in PATCH /api/invoices/[id] for issued/submitting status
7. UI modernization: Tailwind 4 design tokens
8. Draft convert: keep simple — Resume + Delete; Submit from invoice view
9. FBR per-user token: decrypt businessProfiles.fbrTokenEncrypted, fall back to env var

**Artifacts created**:
- `plan.md`: 8-phase implementation plan with constitution check, risk analysis, DoD checklist
- `research.md`: 9 decisions with rationale and alternatives considered
- `data-model.md`: all entities with gap analysis; 1 new table (hs_code_master), 0 existing schema changes
- `quickstart.md`: developer setup guide
- `contracts/api-contracts.md`: REST API contracts for new/modified endpoints

**Key finding**: Draft popup root cause confirmed at `invoice-form-client.tsx:104-122`. Fix is a deletion — remove IndexedDB `listDrafts` useEffect.

## Outcome

- ✅ Impact: Complete architecture plan for 8 implementation phases; all NEEDS CLARIFICATION resolved; zero schema breaking changes required
- 🧪 Tests: Constitution check — all 10 principles PASS; no complexity violations
- 📁 Files: 5 artifacts created under specs/005-fbr-compliance-platform/
- 🔁 Next prompts: /sp.tasks — generate testable task list for implementation
- 🧠 Reflection: Codebase was more complete than spec implied. Most infrastructure exists; the work is targeted fixes and additions, not rebuilds. Draft fix is the highest-ROI change (deleting 80 lines).

## Evaluation notes (flywheel)

- Failure modes observed: update-agent-context.ps1 parsed template placeholders from plan.md (script ran before plan was filled); context file updated with template values. Acceptable — does not block implementation.
- Graders run and results (PASS/FAIL): Constitution check — PASS (10/10)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run /sp.tasks to generate task breakdown
