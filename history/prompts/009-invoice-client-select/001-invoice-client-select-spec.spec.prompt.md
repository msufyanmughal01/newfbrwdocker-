---
id: 001
title: Invoice Client Selector Spec
stage: spec
date: 2026-02-26
surface: agent
model: claude-sonnet-4-6
feature: 009-invoice-client-select
branch: 009-invoice-client-select
user: System Inn
command: /sp.specify
labels: ["spec","invoice","client-selector","ux","discoverability"]
links:
  spec: specs/009-invoice-client-select/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/009-invoice-client-select/spec.md
  - specs/009-invoice-client-select/checklists/requirements.md
  - history/prompts/009-invoice-client-select/001-invoice-client-select-spec.spec.prompt.md
tests:
  - none run
---

## Prompt

i have saved the client info but i am unable to select that there is no option to select from the saved client in the create invoice form

## Response snapshot

Created spec for feature `009-invoice-client-select` on branch `009-invoice-client-select`.

Root cause identified by code inspection: `ClientSearch` component already exists in `InvoiceHeader.tsx` but is visually buried inside the Business Name field section. It requires typing 2+ characters before showing any results (no browse mode), making it non-discoverable.

Spec covers 3 user stories:
- **P1**: Browse and select a saved client (core fix — make picker visible with browse mode)
- **P2**: Search/filter within the picker
- **P3**: Clear a selected client

9 functional requirements defined (FR-001 to FR-009). 5 measurable success criteria defined. All checklist items pass.

## Outcome

- ✅ Impact: Spec captures the UX discoverability fix needed; no new backend work required
- 🧪 Tests: none run
- 📁 Files: specs/009-invoice-client-select/spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.plan or /sp.clarify for implementation planning
- 🧠 Reflection: The ClientSearch component existed but was hidden. Spec-first approach surfaced the root cause (browse-mode missing + poor placement) before any code was written.

## Evaluation notes (flywheel)

- Failure modes observed: ClientSearch had 2-char minimum with no browse mode, making it non-discoverable; placed under a small label inside Business Name field
- Graders run and results (PASS/FAIL): checklist — all PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Upgrade ClientSearch to show all clients on open (fetch without q param), remove 2-char minimum
