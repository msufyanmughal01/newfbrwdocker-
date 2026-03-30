---
id: 001
title: FBR API Integration Implementation Plan
stage: plan
date: 2026-02-17
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-fbr-api-integration
branch: 003-fbr-api-integration
user: system-inn
command: /sp.plan 003-fbr-api-integration
labels: ["fbr-api", "qr-code", "reference-data", "buyer-registry", "error-codes", "submission-flow"]
links:
  spec: specs/003-fbr-api-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-fbr-api-integration/plan.md
  - specs/003-fbr-api-integration/research.md
  - specs/003-fbr-api-integration/data-model.md
  - specs/003-fbr-api-integration/quickstart.md
  - specs/003-fbr-api-integration/contracts/fbr-integration-api.md
  - specs/003-fbr-api-integration/checklists/requirements.md
tests:
  - none (planning phase — tests defined in tasks.md)
---

## Prompt

003-fbr-api-integration

(Invoked via /sp.plan to generate implementation plan for FBR API Integration & End-to-End Invoice Submission feature, building on 002-invoice-creation-form)

## Response snapshot

Generated complete implementation plan for 003-fbr-api-integration:

**Branch**: `003-fbr-api-integration` (new, created from 002-invoice-creation-form)

**Artifacts produced**:
1. `specs/003-fbr-api-integration/spec.md` — 6 user stories, 45 FRs, 5 NFRs, 8 success criteria
2. `specs/003-fbr-api-integration/plan.md` — Architecture, 4 ADRs, file structure, constitution check (PASS)
3. `specs/003-fbr-api-integration/research.md` — 7 research decisions (QR library, cache pattern, proxy, debounce, scenarios, error codes, status machine)
4. `specs/003-fbr-api-integration/data-model.md` — 3 new tables (fbr_submissions, fbr_reference_cache, buyer_registry), extended invoices table, TypeScript interfaces
5. `specs/003-fbr-api-integration/contracts/fbr-integration-api.md` — 9 internal API routes + 15 FBR external API endpoints
6. `specs/003-fbr-api-integration/quickstart.md` — Developer setup, env vars, sandbox test scenarios

**Key Architectural Decisions**:
- Server-side FBR proxy (Bearer token never in browser)
- PostgreSQL JSONB cache for reference data (no Redis)
- react-qr-code SVG for print QR (1.0×1.0 inch)
- Static TypeScript Map for 100+ error codes
- Status machine: draft → validating → validated → submitting → issued | failed

**Constitution**: PASS on all 10 principles. CRITICAL: Principle VIII (Security) — token server-side only. Principle IX (Data Integrity) — issued invoices immutable.

## Outcome

- ✅ Impact: Complete planning artifacts ready for /sp.tasks. All 15 FBR API endpoints mapped, 28 scenarios documented, 3 new DB tables designed.
- 🧪 Tests: Unit tests planned for error-codes.ts, scenarios.ts, status-machine.ts, cache.ts; E2E for full sandbox submission
- 📁 Files: 6 planning artifacts created across specs/003-fbr-api-integration/
- 🔁 Next prompts: /sp.tasks to generate dependency-ordered implementation tasks
- 🧠 Reflection: The QR version 2 capacity issue (22 chars > 20 char limit) was caught in research and mitigated with auto-version selection. The server-side proxy pattern is the correct security architecture for Bearer token protection.

## Evaluation notes (flywheel)

- Failure modes observed: None — all FBR spec data was available from PDF
- Graders run and results (PASS/FAIL): Constitution check PASS
- Prompt variant (if applicable): /sp.plan with feature name arg
- Next experiment: /sp.tasks to generate 60-80 implementation tasks across 6 phases
