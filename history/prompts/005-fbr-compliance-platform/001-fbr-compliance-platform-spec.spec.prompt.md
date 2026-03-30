---
id: 001
title: FBR Compliance Platform Full Spec
stage: spec
date: 2026-02-19
surface: agent
model: claude-sonnet-4-6
feature: 005-fbr-compliance-platform
branch: 005-fbr-compliance-platform
user: System Inn
command: /sp.specify
labels: ["spec","fbr","invoicing","compliance","master-data","draft-workflow","analytics","ui"]
links:
  spec: specs/005-fbr-compliance-platform/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-fbr-compliance-platform/spec.md
  - specs/005-fbr-compliance-platform/checklists/requirements.md
  - history/prompts/005-fbr-compliance-platform/001-fbr-compliance-platform-spec.spec.prompt.md
tests:
  - Specification quality checklist: all items pass (specs/005-fbr-compliance-platform/checklists/requirements.md)
---

## Prompt

Part 1: Reference Architecture Analysis

Modern digital invoicing and tax-compliance platforms follow structured workflow architecture with strict separation of concerns:

Master data (HS codes, clients, tax configs) must be predefined and reusable.

Business profile configuration auto-populates invoices.

Draft workflows are isolated from active invoice creation.

Analytics dashboards use indexed aggregations with date filters.

Government API integrations (e.g., FBR APIs) require strict validation, retry logic, and audit logging.

Full-system regression testing is mandatory in compliance-based systems.

Key Insight: Compliance-driven applications must treat invoice generation, draft handling, and FBR submission as independent but orchestrated subsystems.

Part 2: Current Architecture Analysis

Required functional areas:

HS Code Predefinition

Business Profile Auto-Save with Signup

Seller Auto-Fill in Invoice

Editable Seller Data per Invoice

Business Logo/Image Upload

FBR Token Secure Storage

Client Master + One-Click Buyer Selection

Dedicated Draft Page (No Popup on New Invoice)

Analytics Dashboard with Date Filters

Modern, Colorful, Futuristic UI

Full FBR API Integration (Based on Official PDF)

Full Application Testing & Validation

Risk Areas:

Draft popup incorrectly triggered on New Invoice route.

State leakage between draft and creation flows.

Missing FBR API compliance validation.

Potential data mismatch in analytics calculations.

UI inconsistency across modules.

Constraint: FBR API implementation must strictly follow the official PDF documentation to ensure compliance and avoid rejection errors.

Part 3: Implementation Plan
Phase 1 — Master Data & Business Configuration

Create HS code master table (dropdown selection only).

Build Business Settings page.

Store: Business name, NTN / Registration details, Address, Logo/Image upload, FBR Token, Required compliance fields

Auto-create business profile at signup.

Link business profile to authenticated user ID.

Seller data must: Auto-fill in invoice. Remain editable per invoice instance.

Phase 2 — Client & Invoice Smart Workflow

Create Client master table.

Save client details permanently.

Enable one-click buyer auto-fill.

Add invoice status system: Draft, Submitted, Finalized

Phase 3 — Draft Workflow Isolation

Remove draft popup from New Invoice page.

Ensure New Invoice initializes clean state.

Create fully functional Draft Invoices page.

Draft page must include: Edit draft, Delete draft, Convert to final invoice, Search & filter drafts

No cross-route state interference allowed.

Phase 4 — Dashboard & Analytics

Dashboard must include: From–To date selector, This Month Revenue, Total Invoices, Sales Tax Paid, Revenue Excluding Sales Tax, Visual metric cards, Accurate aggregated queries.

All metrics must dynamically update based on selected date range.

Phase 5 — FBR API Integration (Based on Attached PDF)

Upon receiving the FBR API PDF: Implement endpoints exactly as defined. Validate required request schema. Map invoice fields correctly to FBR schema.

Handle: Authentication using stored FBR token, Error responses, IRN generation, Submission status tracking, Retry logic

Log all FBR requests and responses for audit.

FBR integration must: Match official field names, Validate tax calculations before submission, Handle rejection cases gracefully, Prevent modification after successful submission.

Phase 6 — Modern & Futuristic UI Implementation

Modern color palette. Clean card-based layout. Proper spacing and typography hierarchy. Responsive design. Smooth transitions. Visually appealing dashboard. Consistent design language across all pages.

Phase 7 — Full Application Testing & Validation

Mandatory Testing Layers: Functional Testing, FBR API Testing, Integration Testing, UI Testing, Performance Testing, Regression Testing.

Application must run perfectly before release.

Part 4: Implementation Checklist (20 items from HS code master table to fix all identified bugs)

Constraints: Draft page isolated from New Invoice route, FBR API strictly follows official documentation, Seller auto-fill must not overwrite profile, Dashboard calculations match invoice records, Submitted invoices immutable, FBR token securely protected.

Success Criteria: HS codes selectable instantly, Business profile auto-fills 100%, Client auto-fill in one click, No draft popup, Draft page fully functional, Dashboard metrics accurate, FBR submission succeeds with IRN, No UI inconsistencies, Full test pass.

## Response snapshot

Created branch `005-fbr-compliance-platform` and wrote comprehensive specification at `specs/005-fbr-compliance-platform/spec.md` covering:

- **6 prioritized user stories** (P1–P3) across all 7 implementation phases
- **40 functional requirements** (FR-001 through FR-040) grouped by domain: HS Codes, Business Profile, Client Master, Invoice Status, Draft Workflow, Dashboard, FBR API, UI, Testing
- **6 key entities** defined: BusinessProfile, HSCode, Client, Invoice, InvoiceLineItem, FBRAuditLog
- **12 measurable success criteria** (SC-001 through SC-012), all technology-agnostic
- **7 edge cases** documented
- **Explicit constraints**, assumptions, and dependencies identified
- Quality checklist created at `specs/005-fbr-compliance-platform/checklists/requirements.md` — all items pass

No NEEDS CLARIFICATION markers — all gaps resolved using informed assumptions (documented in Assumptions section). FBR API schema details deferred to official PDF per constraint.

## Outcome

- ✅ Impact: Complete specification for all 7 phases of the FBR compliance platform upgrade, ready for planning
- 🧪 Tests: Specification quality checklist — all 16 items pass
- 📁 Files: specs/005-fbr-compliance-platform/spec.md, specs/005-fbr-compliance-platform/checklists/requirements.md
- 🔁 Next prompts: /sp.clarify (optional refinement) or /sp.plan (proceed to architecture planning)
- 🧠 Reflection: Feature description was comprehensive and well-structured across 4 parts; no ambiguity required user clarification. FBR API schema correctly deferred to official documentation.

## Evaluation notes (flywheel)

- Failure modes observed: Script create-new-feature.ps1 partially failed on prompts directory creation (git branch and spec file created successfully; directory created manually)
- Graders run and results (PASS/FAIL): Specification quality checklist — PASS (all 16 items)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run /sp.plan to generate architecture decisions and implementation roadmap
