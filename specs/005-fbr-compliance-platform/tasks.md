# Tasks: FBR Digital Invoicing Platform — Full Compliance Upgrade

**Input**: Design documents from `specs/005-fbr-compliance-platform/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Tech Stack**: TypeScript 5.x · Next.js 16.1.6 App Router · Drizzle ORM 0.45 · Neon PostgreSQL · better-auth 1.4.18 · react-hook-form 7.x · zod 4.x · Tailwind CSS 4.x · Vitest 4.x · Playwright 1.x

**User Stories**:
- US1 (P1): Business Profile Auto-Fill → FR-004 to FR-009
- US2 (P1): HS Code & Client Master Data → FR-001 to FR-003, FR-010 to FR-012
- US3 (P2): Draft Workflow Isolation → FR-013 to FR-019
- US4 (P2): Dashboard Analytics → FR-020 to FR-023
- US5 (P3): FBR Submission & IRN → FR-024 to FR-033
- US6 (P3): Modern Futuristic UI → FR-034 to FR-036

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies on each other)
- **[Story]**: User story this task belongs to (US1–US6)
- Exact file paths included in every description

---

## Phase 1: Setup (DB Schema)

**Purpose**: Create the one new database entity required before any user story work can begin.

- [X] T001 Create Drizzle schema for `hs_code_master` table in `src/lib/db/schema/hs-code-master.ts` (id uuid PK, user_id FK, hs_code varchar(20), description text, uom varchar(100), is_active boolean default true, sort_order int, created_at/updated_at timestamptz; unique index on user_id+hs_code)
- [X] T002 Export `hsCodes`, `hsCodesToRelations` from `src/lib/db/schema/index.ts` alongside existing exports
- [X] T003 Run `npm run db:push` to apply `hs_code_master` table to Neon PostgreSQL and verify table exists

**Checkpoint**: `hs_code_master` table exists in DB. `npm run typecheck` produces zero errors.

---

## Phase 2: Foundational (Service Layer)

**Purpose**: Create the HS codes service that US2 and US1 both depend on. Must be complete before user story phases begin.

**⚠️ CRITICAL**: US2 cannot be implemented without this service.

- [X] T004 [P] Create `src/lib/hs-codes/master-service.ts` with functions: `listUserHSCodes(userId)`, `pinHSCode(userId, code, description, uom?)`, `unpinHSCode(userId, id)`, `hsCodeExists(userId, code)` — all scoped by userId, using Drizzle ORM against `hsCodes` table
- [X] T005 [P] Create `src/lib/invoices/draft-api.ts` helper that wraps `POST /api/invoices` with `status: 'draft'` payload — to be used by the invoice form's Save Draft button (replaces IndexedDB calls)

**Checkpoint**: TypeScript compiles. Service functions return typed results.

---

## Phase 3: User Story 1 — Business Profile Auto-Fill (Priority: P1) 🎯 MVP

**Goal**: New users get a blank business profile auto-created on signup. Every new invoice pre-fills seller fields from that profile. FBR API calls use the user's own stored token (decrypted from business profile), not a shared env var.

**Independent Test**: Register new user → DB contains `business_profiles` row for user → open New Invoice → seller fields pre-populated → edit seller on invoice → profile record unchanged → add FBR token in Business Settings → submit invoice → FBR uses that token.

### Implementation for User Story 1

- [X] T006 [US1] Add `databaseHooks.user.create.after` callback to `src/lib/auth.ts` that calls `upsertBusinessProfile(user.id, {})` immediately after a new user is created (import `upsertBusinessProfile` from `src/lib/settings/business-profile.ts`)
- [X] T007 [P] [US1] Update `src/lib/fbr/api-client.ts`: add optional `userId?: string` parameter to the `FBRApiClient` class or request functions; when `userId` provided, fetch and decrypt `businessProfiles.fbrTokenEncrypted` using `decrypt()` from `src/lib/settings/encryption.ts`; fall back to `process.env.FBR_API_TOKEN` when userId not provided or user has no stored token
- [X] T008 [P] [US1] Update `src/app/api/fbr/submit/route.ts` to extract `session.user.id` and pass it to the FBR API client call, replacing the current env-var-only token path
- [X] T009 [P] [US1] Update `src/app/api/fbr/validate/route.ts` to extract `session.user.id` and pass it to the FBR API client call
- [X] T010 [US1] Add `FBR_TOKEN_MISSING` error guard in `src/app/api/fbr/submit/route.ts`: when neither user token nor env var is available, return `400` with `{ error: 'FBR token not configured', code: 'FBR_TOKEN_MISSING', message: 'Add your FBR token in Business Settings.' }`
- [X] T011 [US1] Verify `src/app/(dashboard)/settings/business-profile/page.tsx` displays `fbrTokenHint` and a "token set" indicator when hint is non-null; confirm form submit calls `PUT /api/settings/business-profile` with new `fbrToken` plain value (encryption happens server-side in existing `upsertBusinessProfile`)

**Checkpoint**: New user registration → profile row auto-created in DB. New invoice → seller fields pre-filled. FBR submit → uses user's business profile token. Zero TypeScript errors.

---

## Phase 4: User Story 2 — HS Code & Client Master Data (Priority: P1)

**Goal**: Users can pin frequently used HS codes to a personal master list for instant access. The invoice HS code field searches the master list first (all results, no minimum chars), then falls back to FBR reference API (3-char minimum). Client selection from master fills all buyer fields in one click.

**Independent Test**: Open HS Code settings → pin 3 HS codes → open New Invoice → click HS code field → pinned codes appear instantly with no typing → search for partial code → pinned + FBR results shown → select client from master → all buyer fields populated in one action.

### Implementation for User Story 2

- [X] T012 [P] [US2] Create `src/app/api/hs-codes/master/route.ts` with: `GET` handler (returns `listUserHSCodes(session.user.id)`); `POST` handler (validates `{ hsCode, description, uom? }` with zod, calls `pinHSCode()`, returns 201; returns 409 if duplicate via `hsCodeExists()`)
- [X] T013 [P] [US2] Create `src/app/api/hs-codes/master/[id]/route.ts` with: `DELETE` handler (calls `unpinHSCode(session.user.id, params.id)`, returns 200; returns 404 if not found or belongs to another user)
- [X] T014 [US2] Create `src/components/settings/HSCodeMasterManager.tsx` client component: lists pinned HS codes in a table (code, description, uom, delete button); includes a form to add a new code (search FBR reference via existing `/api/fbr/reference/hs-codes?q=` endpoint, select result, click Pin); calls `POST /api/hs-codes/master` on pin and `DELETE /api/hs-codes/master/[id]` on delete
- [X] T015 [US2] Create `src/app/(dashboard)/settings/hs-codes/page.tsx` server component: authenticates session, renders heading + `<HSCodeMasterManager />` inside a card layout
- [X] T016 [US2] Update `src/components/invoices/HSCodeSearch.tsx` to query master list first: on field focus (no minimum chars), fetch `GET /api/hs-codes/master` and display pinned codes; on typing (3+ chars), additionally fetch `GET /api/fbr/reference/hs-codes?q=` and show FBR results below a "Master Codes" section divider; pinned results shown with a star indicator
- [X] T017 [US2] Add "HS Codes" link to settings navigation in `src/components/dashboard/Sidebar.tsx` pointing to `/settings/hs-codes`

**Checkpoint**: HS Code settings page fully functional. Pinned codes appear instantly in invoice HS dropdown. Client master selection auto-fills buyer (already implemented — verify working).

---

## Phase 5: User Story 3 — Draft Workflow Isolation (Priority: P2)

**Goal**: New Invoice page loads with zero draft popup. Drafts save to server via API. Drafts page is the single source of truth with search, filter, delete, and convert-to-final actions.

**Independent Test**: Open `/invoices/new` → no popup → fill partial data → click Save Draft → API call to POST `/api/invoices` with `status: 'draft'` → navigate to `/invoices/drafts` → draft appears with buyer name, date, total → search by buyer → filter works → click Edit → draft opens with data intact → click Delete → draft removed → convert draft to Final → status becomes `validated` → draft disappears from list.

### Implementation for User Story 3

- [X] T018 [US3] Remove draft recovery block from `src/app/(dashboard)/invoices/invoice-form-client.tsx`: delete the `useEffect` at lines 103–122 (the `loadDraftsOnMount` function that calls `listDrafts` and sets `showDraftRecovery`); delete `showDraftRecovery`, `availableDrafts` state; delete `handleRestoreDraft`, `handleDiscardDrafts` handlers; delete associated JSX rendering the recovery dialog
- [X] T019 [US3] Remove IndexedDB imports from `src/app/(dashboard)/invoices/invoice-form-client.tsx`: remove `import { saveDraft, deleteDraft, listDrafts } from '@/lib/invoices/draft-storage'`; remove `debouncedSaveDraft` auto-save callback and its `useEffect`; retain the `organizationId` constant only if still used elsewhere in the file (otherwise remove)
- [X] T020 [US3] Implement server-side Save Draft in `src/app/(dashboard)/invoices/invoice-form-client.tsx`: the existing `handleSaveDraft` function must POST to `/api/invoices` with `{ ...formData, status: 'draft' }` when `draftId` is null (creates new draft, sets `draftId` in state to returned ID); or PATCH `/api/invoices/{draftId}` when `draftId` exists (updates existing draft); set `lastSaved` timestamp on success
- [X] T021 [US3] Create `src/app/(dashboard)/invoices/drafts/DraftsClient.tsx` client component: accepts `initialDrafts: Invoice[]` prop; renders search input (filters by `buyerBusinessName` contains search term); renders date range filter (From/To inputs that filter by `invoiceDate`); renders draft table matching current Drafts page HTML structure; for each draft row shows: Resume link, Delete button (existing `DraftDeleteButton`), and new "Mark as Final" button (PATCH `/api/invoices/[id]` with `status: 'validated'`) that refreshes list on success
- [X] T022 [US3] Update `src/app/(dashboard)/invoices/drafts/page.tsx` to be a server shell: pass fetched `draftInvoices` as `initialDrafts` prop to `<DraftsClient initialDrafts={draftInvoices} />`; remove all direct JSX table rendering from the server component (DraftsClient owns rendering)
- [X] T023 [US3] Verify `src/app/api/invoices/[id]/route.ts` supports PATCH with `status: 'validated'` — the Mark as Final action; confirm handler reads current invoice status and allows draft → validated transition; reject validated → draft downgrade

**Checkpoint**: Navigate `/invoices/new` → zero popup. Save Draft → draft appears in `/invoices/drafts`. Search and filter work client-side. Delete removes. Mark as Final moves invoice out of draft list.

---

## Phase 6: User Story 4 — Dashboard Analytics (Priority: P2)

**Goal**: Dashboard metrics accurately reflect only issued invoices within the selected date range. From > To guard prevents invalid ranges. All four metric cards dynamically update on date change.

**Independent Test**: Create 3 invoices on different dates (one draft, one failed, one issued). Set dashboard date range to cover all. Issued invoice metrics match expected values. Draft and failed invoices do not appear in totals. Change date range to exclude issued invoice — totals return to zero.

### Implementation for User Story 4

- [X] T024 [US4] Review `src/app/api/dashboard/metrics/route.ts`: confirm the SQL query filters by `status = 'issued'` only; if query currently includes draft/failed/submitting statuses, update the `where` clause to add `eq(invoices.status, 'issued')` condition; also add `between(invoices.invoiceDate, from, to)` if date filtering is not already applied
- [X] T025 [US4] Add From > To guard in `src/app/(dashboard)/dashboard/DashboardContent.tsx`: in `handleDateChange(newFrom, newTo)`, if `newFrom > newTo` swap the values before setting state (or show inline validation message and reject the change)
- [X] T026 [P] [US4] Verify `src/components/dashboard/MetricCard.tsx` renders a loading skeleton while `loading === true`; add skeleton state if missing (prevents metric cards from flashing stale data on date range change)
- [X] T027 [US4] Run manual validation against database: create a test script or verify via Drizzle Studio that the dashboard API response for a known date range matches `SELECT SUM(grand_total), SUM(total_tax), COUNT(*) FROM invoices WHERE status='issued' AND invoice_date BETWEEN from AND to` — document result confirms 0% variance (SC-006)

**Checkpoint**: Dashboard shows only issued invoice totals. Date range filter updates all cards. Empty range shows zeros. From > To is handled gracefully.

---

## Phase 7: User Story 5 — FBR Submission & Immutability (Priority: P3)

**Goal**: Issued invoices are immutable server-side and read-only in the UI. FBR retry logic is confirmed functional. Missing FBR token shows clear user guidance.

**Independent Test**: Submit invoice to FBR sandbox → IRN returned and stored → attempt PATCH on invoice → 409 INVOICE_IMMUTABLE returned → invoice detail page shows read-only view → check `fbr_submissions` table → full request/response payload logged.

### Implementation for User Story 5

- [X] T028 [US5] Add immutability guard in `src/app/api/invoices/[id]/route.ts` PATCH handler: after fetching the invoice by ID+userId, check `if (['issued', 'submitting'].includes(invoice.status)) return NextResponse.json({ error: 'Invoice is immutable', code: 'INVOICE_IMMUTABLE', status: invoice.status }, { status: 409 })`
- [X] T029 [US5] Add read-only mode to `src/app/(dashboard)/invoices/[id]/page.tsx`: if `invoice.status === 'issued'`, pass a `readOnly={true}` prop to the invoice form/view component; in the form component, disable all inputs and hide Save/Submit buttons when `readOnly` is true; show an "IRN: [fbrInvoiceNumber]" banner and "Submitted [issuedAt]" status indicator
- [X] T030 [US5] Verify FBR retry logic in `src/lib/fbr/api-client.ts`: confirm that on network timeout or 5xx response, the client retries at least once with exponential backoff; if no retry logic exists, add a simple `retryWithBackoff(fn, maxRetries=2)` wrapper around the fetch call
- [X] T031 [US5] Add `FBR_TOKEN_MISSING` user-facing error display in `src/components/invoices/FBRErrorDisplay.tsx` (or equivalent): when error code is `FBR_TOKEN_MISSING`, render a specific message "No FBR token configured — go to Settings → Business Profile to add your token" with a direct link to `/settings/business-profile`
- [X] T032 [US5] Verify `src/app/api/fbr/submit/route.ts` writes a complete `fbrSubmissions` record: after each submission attempt (success or failure), confirm `postRequest`, `postResponse`, `status`, `attemptedAt`, and `issuedAt` (on success) are all written to the `fbr_submissions` table; check `src/lib/fbr/post-invoice.ts` for the write logic

**Checkpoint**: PATCH on issued invoice → 409. Invoice detail → read-only for issued status. IRN displayed. FBR audit log record complete.

---

## Phase 8: User Story 6 — Modern Futuristic UI (Priority: P3)

**Goal**: All pages share a consistent modern design system with card-based layout, Indigo/Violet primary color, responsive at 375px and 1440px, smooth transitions.

**Independent Test**: Navigate all pages at 1440px desktop — consistent card-based layout with identical spacing, border radius, shadow. Resize to 375px — no horizontal overflow. Click navigation links — smooth transition. Compare metric cards, form cards, table cards — same visual language.

### Implementation for User Story 6

- [X] T033 [US6] Define global design tokens in `src/app/globals.css`: add CSS custom properties for `--color-primary: #4f46e5` (indigo-600), `--color-primary-hover: #4338ca`, `--color-accent-positive: #10b981` (emerald-500), `--color-accent-warning: #f59e0b` (amber-500), `--color-accent-error: #ef4444`, `--color-bg: #f8fafc`, `--color-card: #ffffff`, `--color-border: #e2e8f0`, `--radius-card: 1rem`, `--shadow-card: 0 1px 3px rgba(0,0,0,0.08)`; add `.card` utility class applying card styles
- [X] T034 [P] [US6] Update Dashboard layout in `src/app/(dashboard)/dashboard/DashboardContent.tsx`: apply `.card` class to metric cards wrapper; apply `text-[--color-primary]` to section headings; ensure metric cards use `--color-accent-positive` for revenue, `--color-accent-warning` for tax; add `transition-all duration-200` to interactive elements
- [X] T035 [P] [US6] Update Sidebar in `src/components/dashboard/Sidebar.tsx`: apply `bg-[--color-primary]` background; update nav item active state to `bg-white/20`; apply consistent `text-sm font-medium` to all nav labels; ensure mobile responsiveness with `md:block hidden` pattern where needed
- [X] T036 [P] [US6] Update Invoice form in `src/app/(dashboard)/invoices/invoice-form-client.tsx`: wrap major sections (Seller Info, Buyer Info, Line Items, Summary) in `.card` divs with section headings `text-lg font-semibold text-slate-900`; apply `rounded-2xl` to the outer form container; ensure field labels use `text-sm font-medium text-slate-700`
- [X] T037 [P] [US6] Update Drafts page in `src/app/(dashboard)/invoices/drafts/DraftsClient.tsx`: wrap table in `.card`; add `transition-colors duration-150` to table row hover state; apply consistent button styles — primary action uses `bg-[--color-primary] text-white rounded-lg px-4 py-2 text-sm font-medium`; destructive action uses `text-red-600 hover:bg-red-50`
- [X] T038 [P] [US6] Update Settings pages — `src/app/(dashboard)/settings/business-profile/page.tsx` and `src/app/(dashboard)/settings/hs-codes/page.tsx`: wrap form/content in `.card`; add page heading with `text-2xl font-bold text-slate-900` and subtitle with `text-sm text-slate-500`
- [X] T039 [P] [US6] Update auth pages — `src/app/(auth)/login/page.tsx` and `src/app/(auth)/register/page.tsx`: apply `.card` to the login/register form container; center vertically with `min-h-screen flex items-center justify-center bg-[--color-bg]`; add `text-[--color-primary] font-bold text-2xl` to app name/logo

**Checkpoint**: All pages share card-based layout. Primary color consistent. Mobile at 375px: no horizontal overflow. Desktop at 1440px: clean card grid. Navigation transitions smooth.

---

## Phase 9: Polish & Cross-Cutting Testing

**Purpose**: Full test suite pass, typecheck clean, lint clean, regression confirmation.

- [X] T040 [P] Write Vitest unit test for draft popup fix in `tests/unit/draft-fix.test.ts`: mock `listDrafts`; render `InvoiceFormClient`; assert that `listDrafts` is never called on mount; assert `showDraftRecovery` state does not exist or is never set to true
- [X] T041 [P] Write Vitest unit test for immutability guard in `tests/unit/immutability.test.ts`: mock Drizzle DB returning an invoice with `status: 'issued'`; call the PATCH handler; assert response status is 409; assert body contains `code: 'INVOICE_IMMUTABLE'`
- [X] T042 [P] Write Vitest unit test for FBR token resolution in `tests/unit/fbr-token-resolution.test.ts`: mock `businessProfiles` DB returning `fbrTokenEncrypted`; mock `decrypt()` returning a plain token; call `FBRApiClient` with `userId`; assert that the decrypted token (not the env var) is used in the Authorization header
- [X] T043 [P] Write Vitest unit test for HS master service in `tests/unit/hs-master.test.ts`: mock Drizzle DB; test `pinHSCode()` inserts correctly; test `unpinHSCode()` deletes by userId+id; test `listUserHSCodes()` returns only active records for given userId
- [X] T044 Write Playwright e2e test for draft workflow in `tests/e2e/draft-workflow.spec.ts`: login → go to /invoices/new → assert no modal/popup → fill partial form → click Save Draft → go to /invoices/drafts → assert draft appears → search by buyer → assert filter works → delete draft → assert removed
- [X] T045 [P] Write Playwright e2e test for HS code master in `tests/e2e/hs-code-master.spec.ts`: login → go to /settings/hs-codes → add HS code → assert appears in list → go to /invoices/new → click HS code field → assert pinned code appears without typing → delete pinned code → assert removed from list
- [X] T046 [P] Write Playwright e2e test for business profile in `tests/e2e/business-profile.spec.ts`: register new user → verify profile exists (navigate to /settings/business-profile and assert form loads without error) → fill profile → open /invoices/new → assert seller NTN/name pre-populated
- [X] T047 Run `npm run typecheck` and resolve all TypeScript errors across modified files
- [X] T048 Run `npm test` and fix all failing Vitest unit tests until full suite passes
- [X] T049 Run `npm run test:e2e` (with dev server running) and fix all failing Playwright tests until full suite passes
- [X] T050 Run `npm run lint` and fix all ESLint warnings/errors in new and modified files

**Checkpoint**: Zero TypeScript errors. All Vitest tests pass. All Playwright tests pass. All lint errors resolved. Definition of done met.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001–T003 must complete before T004–T005)
- **US1 (Phase 3)**: Depends on Phase 2 — can start after T003 (DB ready) since it touches auth.ts and FBR client, no HS master dependency
- **US2 (Phase 4)**: Depends on Phase 2 (T004 service layer required) — can start after T004–T005
- **US3 (Phase 5)**: Depends on Phase 2 — independent of US1 and US2
- **US4 (Phase 6)**: Depends on Phase 2 — independent of US1/US2/US3
- **US5 (Phase 7)**: Depends on Phase 3 (US1) — FBR token resolution (T007–T009) must complete before immutability testing
- **US6 (Phase 8)**: Depends on all preceding phases being logically stable — can start in parallel after Phase 5
- **Polish (Phase 9)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no story dependencies
- **US2 (P1)**: After Phase 2 (specifically T004) — no story dependencies
- **US3 (P2)**: After Phase 2 — no story dependencies
- **US4 (P2)**: After Phase 2 — no story dependencies
- **US5 (P3)**: After US1 completes (FBR token infrastructure from T007–T009)
- **US6 (P3)**: After US3 completes (form components are stable before UI changes)

### Within Each User Story

- Service/API tasks before component tasks
- Schema/DB before service before API before UI
- Parallel [P] tasks can run simultaneously

### Parallel Opportunities

- T004 and T005 in Phase 2 can run in parallel
- T007, T008, T009 (FBR client + routes) in US1 can run in parallel
- T012 and T013 (HS master GET/POST and DELETE routes) in US2 can run in parallel
- T018 and T019 in US3 can run in parallel (both remove from same file — coordinate)
- T026 in US4 can run in parallel with T024 and T025
- T028 and T030 in US5 can run in parallel (different files)
- T034–T039 in US6 are all parallel (different files)
- T040–T043 in Phase 9 are all parallel (different test files)
- T045 and T046 in Phase 9 are parallel (different e2e test files)

---

## Parallel Example: User Story 2

```
# Run in parallel (different files, no dependencies):
T012: Create src/app/api/hs-codes/master/route.ts
T013: Create src/app/api/hs-codes/master/[id]/route.ts

# After T012+T013 complete, run in parallel:
T014: Create src/components/settings/HSCodeMasterManager.tsx
T016: Update src/components/invoices/HSCodeSearch.tsx
T017: Update src/components/dashboard/Sidebar.tsx

# After T014 completes:
T015: Create src/app/(dashboard)/settings/hs-codes/page.tsx
```

---

## Implementation Strategy

### MVP (US1 + US2 Only — P1 Stories)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T005)
3. Complete Phase 3: US1 (T006–T011)
4. Complete Phase 4: US2 (T012–T017)
5. **STOP and VALIDATE**: Business profile auto-creates, seller auto-fills, HS codes pin and appear in dropdown, client selection works
6. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → business profile + FBR token → **demo: auto-fill works**
3. US2 → HS master + client → **demo: master data selection works**
4. US3 → draft workflow fixed → **demo: no popup, draft CRUD works**
5. US4 → dashboard accuracy → **demo: metrics correct**
6. US5 → FBR compliance → **demo: submission immutable, IRN stored**
7. US6 → UI modernization → **demo: production-grade look**
8. Phase 9 → all tests pass → **release**

### Single Developer Sequence

```
Phase 1 → Phase 2 → US1 → US2 → US3 → US4 → US5 → US6 → Phase 9
```

---

## Notes

- **[P]** = different files, no cross-dependencies, safe to parallelize
- **[US?]** = maps task to user story for traceability to spec.md acceptance scenarios
- T018/T019 both modify `invoice-form-client.tsx` — coordinate if parallel; safest to sequence T018 then T019
- No tests are interleaved with implementation phases (per spec: tests not explicitly requested in TDD mode). Test phase is Phase 9.
- Commit after each logical group (per-phase or per-story). Push after each story checkpoint.
- Total tasks: **50** across 9 phases
- ADRs documented: ADR-001 (draft storage), ADR-002 (FBR token)
