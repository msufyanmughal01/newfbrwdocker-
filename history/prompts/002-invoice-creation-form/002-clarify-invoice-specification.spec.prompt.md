---
id: 002
title: Clarify invoice specification
stage: spec
date: 2026-02-14
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-invoice-creation-form
branch: 002-invoice-creation-form
user: System Inn
command: /sp.clarify
labels: ["clarification", "FBR", "requirements", "validation", "drafts"]
links:
  spec: specs/002-invoice-creation-form/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-invoice-creation-form/spec.md
  - dataformat.md (referenced for FBR requirements)
tests:
  - Specification coverage validation (all categories resolved or deferred appropriately)
---

## Prompt

/sp.clarify

Risk: Real-time calculations may cause performance issues with many line items

Mitigation: Implement debouncing for calculation triggers and optimize render cycles using React's useMemo and useCallback.

Solution:

Batch calculation updates instead of recalculating on every keystroke.

Memoize subtotal, tax, and total calculations per line item.

Use virtualized rendering if line items exceed 50 to avoid DOM bottlenecks.

Stress test with large datasets to validate performance.

2. Risk: Draft saving in browser storage may be lost if user clears cache

Mitigation: Clearly communicate local storage limitations to users.

Solution:

Use Neon Postgres as a server-side storage for drafts.

On every draft save, send the invoice JSON payload to a draft_invoices table in Neon.

Implement auto-save intervals (e.g., every 30–60 seconds) to persist drafts safely.

Provide UI indication of draft status ("Saved locally" vs "Saved to server").

Optionally, combine with local storage for offline resilience, syncing to Neon when online.

3. Risk: Form architecture may not align with future FBR requirements

Mitigation: Review FBR documentation early in the development lifecycle.

Solution:

Design invoice schema with flexible metadata fields (JSON column in Neon Postgres).

Separate core invoice fields from optional/custom fields to accommodate FBR changes.

Keep UI modular so new FBR-required fields can be added without refactoring existing components.

Document schema mappings for easier integration with FBR APIs.

4. Risk: Complex validation logic may become difficult to maintain

Mitigation: Use schema-based validation with centralized rule definitions.

Solution:

Use a library like Zod or Yup to define reusable validation schemas.

Centralize validation logic in /src/lib/validators/invoice.schema.ts.

Write unit tests for each validation rule to prevent regressions.

Use form libraries (e.g., React Hook Form) to integrate validation seamlessly with UI.

## Response snapshot

Conducted comprehensive clarification session with 5 targeted questions, extracting business requirements from user's implementation-focused input and integrating FBR Digital Invoicing API v1.12 specification (dataformat.md).

**Clarifications Resolved**:

1. **Maximum line items**: Up to 100 per invoice (balances complexity with real-world needs)
2. **Draft auto-save**: Every 60 seconds with visual feedback (prevents data loss, modern UX)
3. **Draft retention**: Indefinite without auto-delete (user-controlled cleanup)
4. **FBR compliance**: Integrated complete FBR API v1.12 field requirements from dataformat.md
5. **Invoice types**: Both Sale Invoices and Debit Notes from start (full regulatory compliance)

**Specification Enhancements**:
- Requirements expanded from 29 to 49 (FR-001 through FR-049)
- Added Clarifications section with Session 2026-02-14 Q&A record
- Created User Story 1b for Debit Note creation (P1 priority)
- Enhanced Key Entities with FBR-specific fields:
  - Invoice: invoice type, reference number for Debit Notes
  - LineItem: HS code, multiple tax types (sales tax, extra tax, further tax), sale type, discount
  - Customer: NTN/CNIC, province, registration type
  - Seller: NTN/CNIC, province (new entity)
- Expanded validation requirements: NTN/CNIC format (7/13 digits), invoice reference format (22/28 digits), HS codes, tax rates
- Added 5 new edge cases: 100-item limit behavior, draft accumulation, debit note validation
- Updated dependencies: FBR Digital Invoicing API v1.12, reference data APIs (Province, HS Code, Tax Rate, UOM)

**Coverage Analysis**:
- 9 of 13 categories fully resolved
- 4 categories appropriately deferred to planning phase (observability, detailed error recovery, security implementation, performance optimization)
- No critical ambiguities remaining

**Approach**:
- Extracted business requirements from user's technical implementation details
- Maintained technology-agnostic specification (avoided React, Neon Postgres, Zod specifics in spec)
- Integrated FBR requirements without adding implementation details
- All requirements remain testable and measurable

## Outcome

- ✅ Impact: Specification significantly enhanced with FBR compliance requirements, clear data model, and unambiguous acceptance criteria; ready for planning phase
- 🧪 Tests: Coverage validation passed (9/13 categories resolved, 4 appropriately deferred)
- 📁 Files: Updated spec.md (49 requirements, 6 user stories, 5 entities), referenced dataformat.md
- 🔁 Next prompts: Ready for `/sp.plan` to design technical architecture and implementation approach
- 🧠 Reflection: Successfully transformed implementation-focused risk mitigations into business requirements; FBR API integration significantly expands scope but provides clear compliance path

## Evaluation notes (flywheel)

- Failure modes observed: User initially provided implementation details (React hooks, Neon Postgres) which needed translation to business requirements
- Graders run and results (PASS/FAIL): Specification coverage analysis - PASS (all critical categories resolved or appropriately deferred)
- Prompt variant (if applicable): Interactive clarification with recommendations for each question
- Next experiment (smallest change to try): Consider creating a separate FBR compliance checklist document to track API integration requirements
