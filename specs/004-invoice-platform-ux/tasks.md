# Tasks: Smart Invoice Platform UX Enhancement

**Feature**: 004-invoice-platform-ux
**Input**: `specs/004-invoice-platform-ux/` (plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md)
**Branch**: `004-invoice-platform-ux`
**Generated**: 2026-02-17

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (different files, no blocking dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to (US1–US5)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies and prepare static/config assets before any schema or code work.

- [x] T001 Install recharts dependency via `npm install recharts`
- [x] T002 [P] Create `public/uploads/logos/.gitkeep` so logo upload directory is tracked in git
- [x] T003 [P] Add `ENCRYPTION_KEY` variable to `.env.example` with generation instructions (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, encryption utility, and migration. MUST complete before any user story implementation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Create Drizzle schema for `business_profiles` table in `src/lib/db/schema/business-profiles.ts` — columns: id (uuid PK), user_id (text FK→users.id UNIQUE NOT NULL), business_name (varchar 255), ntn_cnic (varchar 13 NULLABLE), province (varchar 100 NULLABLE), address (text NULLABLE), logo_path (varchar 500 NULLABLE), fbr_token_encrypted (text NULLABLE), fbr_token_hint (varchar 10 NULLABLE), created_at (timestamp NOT NULL default now()), updated_at (timestamp NOT NULL default now())
- [x] T005 [P] Create Drizzle schema for `clients` table in `src/lib/db/schema/clients.ts` — columns: id (uuid PK), user_id (text FK→users.id NOT NULL), business_name (varchar 255 NOT NULL), ntn_cnic (varchar 13 NULLABLE), province (varchar 100 NULLABLE), address (text NULLABLE), registration_type (varchar 50 NULLABLE — 'Registered'|'Unregistered'), notes (text NULLABLE), is_deleted (boolean NOT NULL default false), created_at (timestamp NOT NULL default now()), updated_at (timestamp NOT NULL default now()); add indexes: (user_id, business_name) and (user_id, is_deleted)
- [x] T006 Export new schemas from `src/lib/db/schema/index.ts` — add exports for `businessProfiles` from `./business-profiles` and `clients` from `./clients` (depends on T004, T005)
- [x] T007 [P] Create AES-256-GCM encryption utility in `src/lib/settings/encryption.ts` — export `encrypt(plaintext: string): string` and `decrypt(ciphertext: string): string` using `process.env.ENCRYPTION_KEY` (32-byte hex); use Node.js `crypto` module; throw if `ENCRYPTION_KEY` is not set
- [x] T008 Run Drizzle migration to apply new tables: `npx drizzle-kit generate` then `npx drizzle-kit migrate` (depends on T004, T005, T006)

**Checkpoint**: Schema applied, encryption util ready — user story phases can begin.

---

## Phase 3: User Story 1 — Business Profile Setup & Auto-Fill (Priority: P1) 🎯 MVP

**Goal**: Settings page where users save business info once; new invoice form auto-fills seller fields from saved profile.

**Independent Test**: Navigate to `/settings/business-profile`, fill all fields including FBR token, save. Open `/invoices/new` — verify seller fields are pre-populated. Edit a seller field, submit the invoice — verify master profile is unchanged.

### Implementation

- [x] T009 [US1] Create business profile DB service in `src/lib/settings/business-profile.ts` — export `getBusinessProfile(userId: string)`, `upsertBusinessProfile(userId: string, data: Partial<BusinessProfileInput>)`, `updateLogoPath(userId: string, path: string)` using Drizzle ORM; `upsertBusinessProfile` should call `encrypt(fbrToken)` before storage and set `fbr_token_hint` to last 4 chars of token
- [x] T010 [P] [US1] Create `GET /api/settings/business-profile` route handler in `src/app/api/settings/business-profile/route.ts` — authenticate via `auth.api.getSession`; call `getBusinessProfile(userId)`; return `{ profile }` with `fbrTokenHint` (masked) but never `fbr_token_encrypted`; return 404 if not found
- [x] T011 [P] [US1] Create `PUT /api/settings/business-profile` route handler in same file `src/app/api/settings/business-profile/route.ts` — accept partial body (businessName, ntnCnic, province, address, fbrToken); Zod validation (ntnCnic: 7 or 13 digits if provided; province: valid string); call `upsertBusinessProfile`; return `{ success: true, profile }`
- [x] T012 [US1] Create logo upload route `POST /api/settings/business-profile/logo` in `src/app/api/settings/business-profile/logo/route.ts` — parse multipart form data (`formData()`); validate file type (jpg/png/webp/svg) and size (≤5MB); save to `public/uploads/logos/{userId}-logo.{ext}`; call `updateLogoPath`; return `{ success: true, logoPath }`
- [x] T013 [US1] Create `BusinessProfileForm` client component in `src/components/settings/BusinessProfileForm.tsx` — React Hook Form; fields: Business Name, NTN/CNIC, Province (select from FBR_PROVINCES), Address (textarea), Logo (file input with 5MB/image-only validation and preview), FBR Token (password input that shows masked hint after save); PUT to `/api/settings/business-profile`; POST file to `.../logo`; success toast on save
- [x] T014 [US1] Create Business Profile settings page (Server Component) in `src/app/(dashboard)/settings/business-profile/page.tsx` — fetch `getBusinessProfile(session.user.id)` server-side; pass profile as prop to `<BusinessProfileForm />`; redirect to `/sign-in` if no session; `upsertBusinessProfile(userId, {})` on first load if profile doesn't exist
- [x] T015 [US1] Add "Settings" nav link pointing to `/settings/business-profile` in `src/components/dashboard/Sidebar.tsx` — add after "Invoices" entry; use consistent active-state highlighting
- [x] T016 [US1] Modify `/invoices/new/page.tsx` (Server Component) in `src/app/(dashboard)/invoices/new/page.tsx` to call `getBusinessProfile(session.user.id)` and pass result as `sellerProfile` prop to `<InvoiceFormClient />`
- [x] T017 [US1] Modify `InvoiceFormClient` in `src/app/(dashboard)/invoices/invoice-form-client.tsx` to accept `sellerProfile?: BusinessProfile` prop; use `sellerProfile` fields as `defaultValues` for `sellerBusinessName`, `sellerNtn`, `sellerProvince`, `sellerAddress` in `useForm()`

**Checkpoint**: Business Profile US1 is fully functional — settings page works, new invoice auto-fills from profile.

---

## Phase 4: User Story 2 — Client Registry & One-Click Buyer Auto-Fill (Priority: P1)

**Goal**: Clients page for managing saved clients; buyer search combobox in invoice form auto-fills all buyer fields on selection.

**Independent Test**: Add "Apex Trading Co." via `/clients`. Open `/invoices/new`, type "Apex" in buyer search, select the client — verify all buyer fields populate instantly.

### Implementation

- [x] T018 [US2] Create client service in `src/lib/clients/client-service.ts` — export `listClients(userId: string, q?: string)` (ILIKE search on business_name where is_deleted=false; q requires min 2 chars), `createClient(userId, data)`, `updateClient(userId, id, data)`, `softDeleteClient(userId, id)` (sets is_deleted=true); all functions scope by userId
- [x] T019 [P] [US2] Create `GET /api/clients` route in `src/app/api/clients/route.ts` — authenticate; optional `?q=` param (min 2 chars enforced); call `listClients`; return `{ clients }`
- [x] T020 [P] [US2] Create `POST /api/clients` route in same file `src/app/api/clients/route.ts` — Zod validation (businessName required 1–255 chars, ntnCnic optional 7 or 13 digits, registrationType optional 'Registered'|'Unregistered'); call `createClient`; return 201 `{ success: true, client }`
- [x] T021 [P] [US2] Create `PUT /api/clients/[id]` route in `src/app/api/clients/[id]/route.ts` — same Zod schema (all fields optional); call `updateClient`; 403 if userId mismatch; 404 if not found
- [x] T022 [P] [US2] Create `DELETE /api/clients/[id]` route in same file `src/app/api/clients/[id]/route.ts` — call `softDeleteClient`; 403 if userId mismatch; 404 if not found; return `{ success: true }`
- [x] T023 [US2] Create `ClientFormModal` component in `src/components/clients/ClientFormModal.tsx` — modal/dialog with React Hook Form; fields: Business Name, NTN/CNIC, Province, Address, Registration Type, Notes; used for both add and edit; submit to POST or PUT depending on mode
- [x] T024 [US2] Create `ClientsTable` component in `src/components/clients/ClientsTable.tsx` — displays client list with columns: Business Name, NTN, Province, Registration Type; Edit and Delete (with confirmation) action buttons; calls DELETE endpoint on soft-delete
- [x] T025 [US2] Create Clients page (Server Component) in `src/app/(dashboard)/clients/page.tsx` — fetch active clients server-side; render `<ClientsTable />` with "Add Client" button triggering `<ClientFormModal />`; redirect to `/sign-in` if no session
- [x] T026 [US2] Create `ClientSearch` combobox component in `src/components/invoices/ClientSearch.tsx` — `'use client'`; accepts `form: UseFormReturn`; debounced (300ms) search input that calls `GET /api/clients?q=`; dropdown of results; on select: call `form.setValue` for buyerBusinessName, buyerNtn, buyerProvince, buyerAddress, buyerRegistrationType; clear button to reset
- [x] T027 [US2] Replace manual buyer input fields in `src/components/invoices/InvoiceHeader.tsx` with `<ClientSearch form={form} />` component (similar to existing BuyerSearch for buyer_registry — this is the `clients`-based version that replaces or merges with the existing buyer search)
- [x] T028 [US2] Add "Clients" nav link to `src/components/dashboard/Sidebar.tsx` — insert between Invoices and Settings entries; use `/clients` href

**Checkpoint**: Client Registry US2 is fully functional — clients CRUD works, buyer search auto-fills invoice.

---

## Phase 5: User Story 3 — Draft Invoice Workflow Separation (Priority: P2)

**Goal**: Dedicated Drafts page shows only draft invoices; Invoices list shows only submitted/issued invoices.

**Independent Test**: Save an invoice as draft. Navigate to `/invoices/drafts` — draft appears. Navigate to `/invoices` — draft is absent. Resume draft, submit — it moves to `/invoices` and leaves `/invoices/drafts`.

### Implementation

- [x] T029 [US3] Create Drafts page (Server Component) in `src/app/(dashboard)/invoices/drafts/page.tsx` — query invoices where `status = 'draft'` and `userId = session.user.id` ordered by `updatedAt DESC`; render table with columns: Invoice Number/ID, Date, Buyer, Last Updated; actions: "Resume" (link to `/invoices/new?draft={id}` or `/invoices/{id}/edit`) and "Delete" (hard delete for drafts — they were never submitted to FBR); redirect to `/sign-in` if no session
- [x] T030 [US3] Modify invoices list page in `src/app/(dashboard)/invoices/page.tsx` — update the query filter to exclude `status = 'draft'`; filter to `status IN ('validating', 'validated', 'submitting', 'issued', 'failed')`
- [x] T031 [US3] Add `DELETE /api/invoices/[id]` route (or extend existing route in `src/app/api/invoices/[id]/route.ts`) — allow hard delete only when `status = 'draft'`; return 409 Conflict if invoice is not in draft status; authenticate and scope to userId
- [x] T032 [US3] Add "Drafts" nav link to `src/components/dashboard/Sidebar.tsx` — insert between "Invoices" and "Clients" entries; use `/invoices/drafts` href

**Checkpoint**: Draft workflow US3 is complete — clean separation between drafts and issued invoices.

---

## Phase 6: User Story 4 — Analytics Dashboard with Date Filtering (Priority: P2)

**Goal**: Dashboard shows 4 metric cards (Total Invoices, Total Revenue, Sales Tax, Revenue ex-Tax) and a trend chart, all filtered by a custom date range.

**Independent Test**: Issue 2 invoices on different dates. Set dashboard range to include only 1. Verify totals = that 1 invoice. Expand range to include both. Verify totals update correctly.

### Implementation

- [x] T033 [US4] Create dashboard metrics aggregation service in `src/lib/analytics/dashboard-metrics.ts` — export `getDashboardMetrics(userId: string, from: string, to: string)` using Drizzle `sum`/`count` on `invoices` where `status = 'issued'` and `invoice_date BETWEEN from AND to`; return `{ totalInvoices, totalRevenue, totalSalesTax, revenueExcludingSalesTax }` as decimal strings; export `getRevenueTrend(userId, from, to)` — group by week if range ≤90 days, by month if >90 days; return `Array<{ date: string, invoiceCount: number, revenue: string }>`
- [x] T034 [P] [US4] Create `GET /api/dashboard/metrics` route in `src/app/api/dashboard/metrics/route.ts` — authenticate; require `from` and `to` query params (ISO date strings); validate `from ≤ to` (return 400 otherwise); call `getDashboardMetrics` and `getRevenueTrend`; return `{ metrics, trendData, dateRange }`
- [x] T035 [P] [US4] Create `MetricCard` component in `src/components/dashboard/MetricCard.tsx` — `'use client'`; props: `label: string`, `value: string`, `subLabel?: string`; renders glassmorphism card with label and large value; no data state shows "—"
- [x] T036 [P] [US4] Create `DateRangePicker` component in `src/components/dashboard/DateRangePicker.tsx` — `'use client'`; two `<input type="date">` fields (From, To); default From = first day of current month, default To = today; `onChange(from: string, to: string)` callback fires on both inputs changing; validates from ≤ to before calling onChange
- [x] T037 [US4] Create `RevenueTrendChart` component in `src/components/dashboard/RevenueTrendChart.tsx` — `'use client'`; uses Recharts `BarChart` or `LineChart`; props: `data: Array<{ date, invoiceCount, revenue }>`; renders revenue bars by date; empty state message when data is empty; responsive via Recharts `<ResponsiveContainer />`
- [x] T038 [US4] Modify dashboard page in `src/app/(dashboard)/dashboard/page.tsx` — convert to client component (`'use client'`) or add client sub-component; render `<DateRangePicker>` + 4 `<MetricCard>` instances + `<RevenueTrendChart>`; on date range change, fetch `GET /api/dashboard/metrics?from=&to=` and update state; show loading skeleton during fetch

**Checkpoint**: Analytics Dashboard US4 complete — metrics and chart update on date range change.

---

## Phase 7: User Story 5 — Modern Futuristic UI Design System (Priority: P3)

**Goal**: Apply consistent glassmorphism card style, spacing, typography, and responsive layout across all portal pages.

**Independent Test**: Load each major page at 1440px and 768px viewports. Verify identical card style, spacing, and typography. Verify no horizontal scroll at 768px.

### Implementation

- [x] T039 [P] [US5] Apply glassmorphism card pattern to dashboard page in `src/app/(dashboard)/dashboard/page.tsx` — wrap metric cards and chart in `bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl`; apply `bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen` to page wrapper
- [x] T040 [P] [US5] Apply consistent form card style to settings page in `src/app/(dashboard)/settings/business-profile/page.tsx` and `BusinessProfileForm.tsx` — wrap form in card, use shared input and button classes
- [x] T041 [P] [US5] Apply consistent table card style to invoices list page in `src/app/(dashboard)/invoices/page.tsx` — table wrapped in card, page gradient background
- [x] T042 [P] [US5] Apply consistent table card style to drafts page in `src/app/(dashboard)/invoices/drafts/page.tsx` — same card and table classes as invoices list
- [x] T043 [P] [US5] Apply consistent table card style to clients page in `src/app/(dashboard)/clients/page.tsx` — same card and table classes; "Add Client" button uses primary button style
- [x] T044 [US5] Verify and update responsive breakpoints across all pages — add `sm:` Tailwind prefixes where needed to ensure no horizontal scroll at 768px viewport; update Sidebar mobile behavior if needed

**Checkpoint**: All pages visually consistent; tablet viewport passes.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and documentation.

- [x] T045 [P] Remove any debug `console.log` statements introduced during development across all new files
- [x] T046 [P] Verify `public/uploads/logos/` directory gitignore status — ensure uploaded files are gitignored but `.gitkeep` is tracked; add `public/uploads/logos/*.{jpg,png,webp,svg}` to `.gitignore`
- [x] T047 Run quickstart.md manual validation scenarios for all 5 user stories (US1–US5) and confirm all acceptance scenarios pass
- [x] T048 Mark all completed tasks as [x] in this tasks.md file

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — can start immediately after Foundational
- **Phase 4 (US2)**: Depends on Phase 2 — can start in parallel with US1
- **Phase 5 (US3)**: Depends on Phase 2 — can start in parallel (no dependency on US1/US2)
- **Phase 6 (US4)**: Depends on Phase 2 — reads existing `invoices` table; parallel with other stories
- **Phase 7 (US5)**: Depends on Phases 3–6 — apply after all functional pages exist
- **Phase 8 (Polish)**: Depends on all phases complete

### User Story Dependencies

- **US1 (Business Profile)**: No dependency on other stories — start after Phase 2
- **US2 (Client Registry)**: No dependency on US1 — start after Phase 2
- **US3 (Draft Workflow)**: No dependency on US1/US2 — start after Phase 2 (reads existing invoice status)
- **US4 (Analytics)**: No dependency on US1/US2/US3 — start after Phase 2 (reads existing issued invoices)
- **US5 (Design System)**: Depends on US1–US4 pages existing before applying visual layer

### Within Each User Story

- Schema/DB service → API routes → UI components → page integration
- Core service before API route; API route before UI component
- All tasks marked [P] within the same story phase can run in parallel

### Parallel Opportunities

- T002 and T003 (Setup) can run in parallel
- T004 and T005 (schema files) can run in parallel; T006 depends on both
- T007 can run in parallel with T004/T005
- T010, T011 (US1 API routes) can run in parallel after T009
- US1, US2, US3, US4 phases can run in parallel after Phase 2 completes
- All [P]-marked tasks within US5 can run in parallel
- T045, T046 (Polish) can run in parallel

---

## Parallel Example: US1 — Business Profile

```
# After T009 (service complete), launch in parallel:
Task T010: GET /api/settings/business-profile route
Task T011: PUT /api/settings/business-profile route
Task T012: POST logo upload route
# Then sequentially:
Task T013: BusinessProfileForm component (needs to know API shape)
Task T014: Settings page (needs component)
Task T015: Modify /invoices/new/page.tsx
Task T016: Modify InvoiceFormClient defaultValues
```

---

## Implementation Strategy

### MVP Scope (US1 + US2 — eliminate repetitive entry)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T008)
3. Complete Phase 3: US1 Business Profile (T009–T017)
4. Complete Phase 4: US2 Client Registry (T018–T028)
5. **STOP and VALIDATE**: Run quickstart.md Scenarios A–D for US1 and US2
6. Deploy/demo — sellers auto-fill, buyers auto-fill → core value delivered

### Incremental Delivery

1. Phase 1–2 → Foundation ready
2. Phase 3 (US1) → Auto-fill for seller — demo-able
3. Phase 4 (US2) → Auto-fill for buyer — demo-able
4. Phase 5 (US3) → Draft separation — clean workflow
5. Phase 6 (US4) → Analytics dashboard — business visibility
6. Phase 7 (US5) → Design polish — professional UX

---

## Summary

| Metric | Count |
|--------|-------|
| Total tasks | 48 |
| Phase 1 (Setup) | 3 |
| Phase 2 (Foundational) | 5 |
| Phase 3 (US1) | 9 |
| Phase 4 (US2) | 11 |
| Phase 5 (US3) | 4 |
| Phase 6 (US4) | 6 |
| Phase 7 (US5) | 6 |
| Phase 8 (Polish) | 4 |
| Parallelizable [P] tasks | 24 |
| New files | ~26 |

## Notes

- [P] tasks = different files, no incomplete blocking dependencies
- Each user story is independently testable at its checkpoint
- MVP = Phase 1 + 2 + 3 (US1) + 4 (US2) — covers the two highest-value stories
- No automated test tasks included (not requested in spec)
- Commit after each phase checkpoint for clean history
