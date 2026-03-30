---
id: 002
title: FBR API Integration Tasks Generation
stage: tasks
date: 2026-02-17
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-fbr-api-integration
branch: 003-fbr-api-integration
user: system-inn
command: /sp.tasks
labels: ["fbr-api", "tasks", "implementation-plan", "qr-code", "submission-flow", "buyer-registry"]
links:
  spec: specs/003-fbr-api-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-fbr-api-integration/tasks.md
tests:
  - none (tasks phase — tests will be defined during implementation)
---

## Prompt

(Invoked via /sp.tasks with empty args — feature auto-detected from current branch `003-fbr-api-integration`)

Generate actionable, dependency-ordered implementation tasks for the FBR API Integration & End-to-End Invoice Submission feature, building on the design artifacts produced by /sp.plan: plan.md, spec.md, research.md, data-model.md, contracts/fbr-integration-api.md, quickstart.md.

## Response snapshot

Generated complete tasks.md for 003-fbr-api-integration with 62 tasks across 10 phases organized by user story:

**File**: `specs/003-fbr-api-integration/tasks.md`

**Phase Summary**:
- Phase 1 (T001–T002): Setup — install react-qr-code, qrcode, @types/qrcode
- Phase 2 (T003–T014): Foundation — DB schema (fbr_submissions, fbr_reference_cache, buyer_registry), extend invoices table, FBR API client, error codes catalog (100+), scenarios config (SN001–SN028), status machine, PostgreSQL cache utilities
- Phase 3 (T015–T022): US1 FBR Submit Flow — validate.ts, post-invoice.ts, /api/fbr/validate route, /api/fbr/submit route, SubmissionStatus component, FBRErrorDisplay component, invoice form integration
- Phase 4 (T023–T028): US2 QR Code & Print — QRCode.tsx (1.0×1.0 inch SVG), InvoicePrint.tsx, invoice detail page ([id]/page.tsx), print page route ([id]/print/page.tsx)
- Phase 5 (T029–T034): US3 HS Code Search — hs-codes.ts, hs-uom.ts, /api/fbr/reference/hs-codes route, HSCodeSearch.tsx component with UOM auto-populate
- Phase 6 (T035–T038): US4 STATL NTN Verify — statl.ts, /api/fbr/verify-ntn route, NTNVerifier.tsx badge
- Phase 7 (T039–T042): US5 Buyer Registry — /api/buyers route, BuyerSearch.tsx autocomplete
- Phase 8 (T043–T048): US6 FBR Error Display — provinces.ts, uom.ts, reference routes (provinces, uom), field-level error highlighting integration
- Phase 9 (T049–T053): Reference Data APIs — tax-rates.ts, /api/fbr/reference/tax-rates, replace static province/UOM dropdowns
- Phase 10 (T054–T062): Polish — .env.example, invoice list page, sidebar nav link, cleanup

**Task Statistics**:
- Total: 62 tasks
- Parallelizable [P]: ~20 tasks
- US1 (FBR Submit): 8 tasks (T015–T022)
- US2 (QR Print): 6 tasks (T023–T028)
- US3 (HS Search): 6 tasks (T029–T034)
- US4 (STATL Verify): 4 tasks (T035–T038)
- US5 (Buyer Registry): 4 tasks (T039–T042)
- US6 (Error Display): 6 tasks (T043–T048)
- Foundation: 12 tasks (T003–T014)
- Setup: 2 tasks (T001–T002)
- Polish: 9 tasks (T054–T062)

**MVP Scope**: Phases 1–4 (T001–T028) — installs deps, DB schema, FBR client, full submit flow, QR print layout. Delivers: users can submit FBR-compliant invoices and print with QR code.

**Dependency Order**: Phase 2 blocks all user stories. Within each story, data layer → service layer → route → component → integration.

## Outcome

- ✅ Impact: 62 implementation tasks ready for /sp.implement. All 6 user stories have complete, independently testable task phases. MVP (T001–T028) delivers end-to-end FBR submission + QR print.
- 🧪 Tests: Not requested in spec — unit/E2E tests planned separately per plan.md (error-codes.test.ts, scenarios.test.ts, status-machine.test.ts, cache.test.ts, fbr-submission.spec.ts)
- 📁 Files: specs/003-fbr-api-integration/tasks.md (62 tasks across 10 phases)
- 🔁 Next prompts: /sp.implement to execute tasks starting from Phase 1; test with FBR Sandbox SN001 after Phase 3
- 🧠 Reflection: Tasks are organized by user story (US1–US6) to enable independent delivery. Phase 2 foundation is the critical-path blocker — DB schema and FBR API client must be done before any user story work. The MVP boundary at T028 gives the earliest functional deliverable.

## Evaluation notes (flywheel)

- Failure modes observed: None — all design artifacts were available and complete from /sp.plan
- Graders run and results (PASS/FAIL): Format validation PASS — all 62 tasks follow [checkbox][ID][P?][Story?] format with file paths
- Prompt variant (if applicable): /sp.tasks with auto-detected feature from branch name
- Next experiment: /sp.implement to execute Phase 1 + Phase 2 first, then Phase 3 (US1 FBR Submit)
