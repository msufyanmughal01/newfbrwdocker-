---
id: 002
title: Invoice Client Selector Implementation Plan
stage: plan
date: 2026-02-26
surface: agent
model: claude-sonnet-4-6
feature: 009-invoice-client-select
branch: 009-invoice-client-select
user: System Inn
command: /sp.plan
labels: ["plan","invoice","client-selector","ux","component-upgrade"]
links:
  spec: specs/009-invoice-client-select/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/009-invoice-client-select/plan.md
  - specs/009-invoice-client-select/research.md
  - specs/009-invoice-client-select/data-model.md
  - specs/009-invoice-client-select/quickstart.md
  - specs/009-invoice-client-select/contracts/client-api.md
tests:
  - none run
---

## Prompt

/sp.plan

## Response snapshot

Executed full planning workflow for `009-invoice-client-select`.

**Phase 0 (Research)**: All 5 findings resolved with no NEEDS CLARIFICATION items. Key findings: `/api/clients` (no q param) already returns all clients; existing `ClientSearch` component only needs upgrading (not replacing); client-side filtering chosen for instant response; relocation to full-width row at top of Buyer Information section is the right UX fix.

**Phase 1 (Design)**: No schema changes, no new endpoints. Two files change: `ClientSearch.tsx` (browse mode + client-side filter) and `InvoiceHeader.tsx` (layout relocation). Data model, API contract, and quickstart documented.

**Constitution Check**: All 10 principles pass. No violations.

**Artifacts created**:
- `plan.md` — full implementation plan with Definition of Done
- `research.md` — 5 resolved findings
- `data-model.md` — no schema changes; entity and state model documented
- `contracts/client-api.md` — existing API contracts documented
- `quickstart.md` — 10-item manual test checklist

## Outcome

- ✅ Impact: Full plan ready; 2-file change scope confirmed (ClientSearch.tsx + InvoiceHeader.tsx)
- 🧪 Tests: none run (manual test checklist defined in quickstart.md)
- 📁 Files: 5 planning artifacts created/updated
- 🔁 Next prompts: /sp.tasks to generate task list
- 🧠 Reflection: Pure UX fix — no backend work. Root cause: ClientSearch had 2-char minimum with no browse mode and was visually buried. Smallest viable change confirmed.

## Evaluation notes (flywheel)

- Failure modes observed: ClientSearch component existed but was non-discoverable due to UX design choices
- Graders run and results (PASS/FAIL): Constitution Check — all 10 principles PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): /sp.tasks then /sp.implement
