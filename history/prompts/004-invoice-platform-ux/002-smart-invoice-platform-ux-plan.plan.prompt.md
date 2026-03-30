---
id: 002
title: Smart Invoice Platform UX Plan
stage: plan
date: 2026-02-17
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-invoice-platform-ux
branch: 004-invoice-platform-ux
user: system-inn
command: /sp.plan
labels: ["business-profile", "client-registry", "analytics-dashboard", "draft-workflow", "drizzle", "recharts", "aes-256", "auto-fill"]
links:
  spec: specs/004-invoice-platform-ux/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-invoice-platform-ux/research.md
  - specs/004-invoice-platform-ux/data-model.md
  - specs/004-invoice-platform-ux/contracts/platform-ux-api.md
  - specs/004-invoice-platform-ux/quickstart.md
  - specs/004-invoice-platform-ux/plan.md
tests:
  - none (plan phase)
---

## Prompt

004-invoice-platform-ux

## Response snapshot

Executed `/sp.plan` for feature `004-invoice-platform-ux`. Generated all five planning artifacts:

**research.md** (8 decisions):
- D1: Logo storage → local `public/uploads/logos/` (no cloud dependency)
- D2: FBR token → AES-256-GCM encrypted at rest; masked in UI; `ENCRYPTION_KEY` env var
- D3: Analytics → live SQL aggregation via Drizzle (no materialized views)
- D4: Chart library → Recharts (React-native, SSR-safe, single new dependency)
- D5: Client vs buyer_registry separation → two distinct tables, no merge
- D6: Design system → Tailwind CSS extensions only (no new UI library)
- D7: Draft page → filtered view of existing invoices table (`status = 'draft'`)
- D8: Seller auto-fill → Server Component fetches profile, passes as `defaultValues`

**data-model.md** (2 new tables):
- `business_profiles` — 1:1 with users; fields: business_name, ntn_cnic, province, address, logo_path, fbr_token_encrypted, fbr_token_hint
- `clients` — 1:N with users; soft-delete via `is_deleted`; indexes on (user_id, business_name) and (user_id, is_deleted)

**contracts/platform-ux-api.md** (7 endpoints):
- `GET/PUT /api/settings/business-profile`
- `POST /api/settings/business-profile/logo`
- `GET/POST /api/clients`, `PUT/DELETE /api/clients/[id]`
- `GET /api/dashboard/metrics?from=&to=`

**quickstart.md** — manual test scenarios for all 5 user stories + curl smoke tests

**plan.md** — 6-phase implementation plan:
- Phase 1: Schema + encryption setup (recharts install, Drizzle migration)
- Phase 2: Business Profile (US1) — settings page + invoice auto-fill
- Phase 3: Client Registry (US2) — clients page + ClientSearch component
- Phase 4: Draft Workflow (US3) — drafts page + filter modification
- Phase 5: Analytics Dashboard (US4) — metrics aggregation + Recharts chart
- Phase 6: Modern UI Design System (US5) — glassmorphism applied across all pages

26 new/modified files identified. Single new dependency: `recharts`.

## Outcome

- ✅ Impact: Complete implementation plan ready; all 5 user stories fully designed with file paths, API contracts, and DB schema
- 🧪 Tests: Manual integration scenarios in quickstart.md; no automated tests in plan phase
- 📁 Files: 5 artifacts created under specs/004-invoice-platform-ux/
- 🔁 Next prompts: `/sp.tasks` to generate actionable task list
- 🧠 Reflection: AES-256-GCM chosen over simple AES-CBC for authenticated encryption; recharts is the only new package — all other features use existing stack

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): none (plan phase)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): run /sp.tasks to validate phase decomposition produces clean, independent task increments
