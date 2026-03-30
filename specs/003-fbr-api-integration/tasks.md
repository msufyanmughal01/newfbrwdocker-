# Tasks: FBR API Integration & End-to-End Invoice Submission

**Input**: Design documents from `/specs/003-fbr-api-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/fbr-integration-api.md, quickstart.md

**Tests**: NOT requested in feature specification — tasks focus on implementation only

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Include exact file paths in every task description

---

## Phase 1: Setup (Dependencies)

**Purpose**: Install new dependencies needed for this feature.

- [x] T001 Install QR code library: `npm install react-qr-code`
- [x] T002 [P] Install qrcode types: `npm install qrcode @types/qrcode`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Database Schema

- [x] T003 Create Drizzle schema for `fbr_submissions` table (invoiceId FK, status enum, validateRequest/Response JSONB, postRequest/Response JSONB, fbrInvoiceNumber, fbrErrorCodes JSONB, environment enum, scenarioId, attemptedAt, issuedAt) in `src/lib/db/schema/fbr.ts`
- [x] T004 Create Drizzle schema for `fbr_reference_cache` table (dataType enum, cacheKey unique, payload JSONB, fetchedAt, expiresAt, etag) in `src/lib/db/schema/fbr.ts`
- [x] T005 Create Drizzle schema for `buyer_registry` table (organizationId, ntnCnic, businessName, province, address, registrationType, statlStatus, statlStatusCode, statlCheckedAt, lastUsedAt, useCount) with composite unique index on (organizationId, ntnCnic) in `src/lib/db/schema/fbr.ts`
- [x] T006 Extend existing `invoices` table schema to add columns: `fbrInvoiceNumber`, `fbrSubmissionId`, `invoiceStatus` enum (draft/validating/validated/submitting/issued/failed), `issuedAt` in `src/lib/db/schema/invoices.ts`
- [x] T007 Export fbr schema from main schema index in `src/lib/db/schema/index.ts`
- [x] T008 Generate database migration: `npm run db:generate`
- [x] T009 Apply database migration to Neon: `npm run db:push`

### FBR Library Foundation

- [x] T010 [P] Create FBR API client in `src/lib/fbr/api-client.ts` — HTTP fetch wrapper that reads `FBR_API_TOKEN` from `process.env`, reads `FBR_ENV` to select sandbox vs production base URLs, sets `Authorization: Bearer {token}` header, enforces 30-second timeout for submit/validate and 10-second timeout for reference APIs, and throws typed `FBRApiError` on non-200 responses
- [x] T011 [P] Create FBR error code catalog in `src/lib/fbr/error-codes.ts` — TypeScript `Record<string, FBRErrorEntry>` with all Sales error codes (0001–0113, 0300, 0401, 0402) and Purchase error codes (0156–0177), each entry having: `code`, `userMessage` (plain English), `fieldPath` (e.g. `'items[n].hsCode'`), `severity` (`'error'` | `'warning'`)
- [x] T012 [P] Create FBR scenario config in `src/lib/fbr/scenarios.ts` — array of all 28 sandbox scenarios (SN001–SN028) with: `id`, `description`, `saleType`, `requiredFields`, `taxVariant` property for display in sandbox mode dropdown
- [x] T013 [P] Create invoice status state machine in `src/lib/fbr/status-machine.ts` — TypeScript union type `InvoiceStatus` (draft/validating/validated/submitting/issued/failed), `ALLOWED_TRANSITIONS` map defining valid next states from each status, and `transitionStatus(current, next)` function that throws if transition is invalid
- [x] T014 [P] Create PostgreSQL reference data cache utilities in `src/lib/fbr/reference/cache.ts` — functions `getCached(cacheKey)` returning payload if `expiresAt > NOW()`, `setCached(cacheKey, dataType, payload, ttlHours)` doing upsert on `fbr_reference_cache`, and `invalidateCache(dataType)` for manual refresh; uses existing Drizzle DB instance

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — FBR Invoice Submission (P1) 🎯 MVP

**Goal**: Enable users to submit a completed invoice to FBR and receive an official FBR invoice number. Covers the full validate → post → store → display flow.

**Independent Test**:
1. Navigate to `/dashboard/invoices/new`, fill all fields, select Scenario SN001 (sandbox)
2. Click "Validate & Submit"
3. Observe status progress: Validating → Validated → Submitting → Issued
4. Verify FBR invoice number (22 digits) displayed on success
5. Verify invoice status in DB changed to `issued`
6. Verify `fbr_submissions` record created with all fields

### FBR Core Service Layer

- [x] T015 [P] [US1] Create FBR Validate API caller in `src/lib/fbr/validate.ts` — function `validateWithFBR(payload, scenarioId?)` that calls `/di_data/v1/di/validateinvoicedata` (or `_sb` in sandbox), returns typed `FBRValidationResult` with `valid: boolean`, `errors: FBRErrorItem[]` (each with itemSNo, errorCode, friendlyMessage from error-codes.ts, fieldPath)
- [x] T016 [P] [US1] Create FBR Post API caller in `src/lib/fbr/post-invoice.ts` — function `postToFBR(payload, scenarioId?)` that calls `/di_data/v1/di/postinvoicedata` (or `_sb`), returns typed `FBRPostResult` with `invoiceNumber`, `dated`, `validationResponse`

### API Routes

- [x] T017 [US1] Create `POST /api/fbr/validate` route in `src/app/api/fbr/validate/route.ts` — authenticates session, reads `invoiceData` + optional `scenarioId` from body, maps to FBR payload via existing `mapToFBRFormat()`, calls `validateWithFBR()`, returns `{valid, errors}` with friendly messages
- [x] T018 [US1] Create `POST /api/fbr/submit` route in `src/app/api/fbr/submit/route.ts` — authenticates session, reads `invoiceId` + optional `scenarioId`, loads invoice from DB, creates `fbr_submissions` record with status `validating`, calls validate API, updates submission status, if valid calls post API, stores `fbrInvoiceNumber` and updates invoice status to `issued` in a DB transaction, handles all failure paths with status `failed`

### UI Components

- [x] T019 [P] [US1] Create `SubmissionStatus` component in `src/components/invoices/SubmissionStatus.tsx` — shows animated step-by-step progress: Validating (spinner) → Validated (checkmark) → Submitting (spinner) → Issued (green success) or Failed (red error); accepts `status: InvoiceStatus` prop and `fbrInvoiceNumber?: string`
- [x] T020 [P] [US1] Create `FBRErrorDisplay` component in `src/components/invoices/FBRErrorDisplay.tsx` — displays list of FBR validation errors grouped by: header-level errors (highlight form field) and item-level errors (show item number + highlight row); accepts `errors: FBRErrorItem[]` prop

### Form Integration

- [x] T021 [US1] Extend `invoice-form-client.tsx` to replace existing `/api/invoices` submit with two-step flow: (1) call `POST /api/fbr/validate` showing `SubmissionStatus` validating state, (2) if valid call `POST /api/fbr/submit`, (3) display `SubmissionStatus` with final state and FBR invoice number on success or `FBRErrorDisplay` on failure
- [x] T022 [US1] Add sandbox Scenario ID selector dropdown to `invoice-form-client.tsx` — visible only when `FBR_ENV=sandbox`, populated from `scenarios.ts` config, `scenarioId` passed to both validate and submit API calls

**Checkpoint**: User Story 1 complete — users can submit invoices to FBR and receive invoice numbers

---

## Phase 4: User Story 2 — QR Code + Print Layout (P1)

**Goal**: Print-optimized invoice page with FBR QR code (1.0×1.0 inch) and FBR Digital Invoicing logo.

**Independent Test**:
1. Navigate to `/dashboard/invoices/{id}` for an issued invoice
2. Click "Print Invoice" — print page opens
3. Verify QR code visible (scannable, encodes FBR invoice number)
4. Verify FBR logo visible
5. Open browser print dialog — verify no navigation/buttons appear in preview

### Components

- [x] T023 [P] [US2] Create `QRCode` component in `src/components/invoices/QRCode.tsx` — wraps `react-qr-code` SVG component with `size={96}` (= 1.0 inch at 96 DPI), `level="M"`, and a CSS `@media print` style forcing `width: 1in; height: 1in`; accepts `value: string` (FBR invoice number)
- [x] T024 [P] [US2] Add FBR logo image to `public/fbr-logo.png` — download/save the FBR Digital Invoicing System logo as a static asset (use a placeholder PNG if official logo unavailable, label it clearly)
- [x] T025 [US2] Create `InvoicePrint` component in `src/components/invoices/InvoicePrint.tsx` — print-optimized layout containing: seller/buyer info block, all line items table (HS code, description, qty, UOM, value, tax, total), subtotals section (subtotal, sales tax, extra tax, further tax, grand total), FBR invoice number prominently, `QRCode` component, FBR logo image; NO buttons or navigation elements

### Pages

- [x] T026 [US2] Create invoice detail page `src/app/(dashboard)/invoices/[id]/page.tsx` — server component that fetches invoice by ID (auth check: must be user's invoice), renders invoice summary, "Print Invoice" button linking to print route, invoice status badge
- [x] T027 [US2] Create print page `src/app/(dashboard)/invoices/[id]/print/page.tsx` — server component that fetches invoice, renders `InvoicePrint` component; add `src/app/(dashboard)/invoices/[id]/print/print.css` with `@media print { nav, header, button { display: none !important; } body { margin: 0; } }`

### Navigation

- [x] T028 [US2] Update invoice form success handler in `invoice-form-client.tsx` — after successful FBR submission, redirect to `/dashboard/invoices/{id}` detail page (instead of current `alert()`)

**Checkpoint**: User Story 2 complete — issued invoices can be printed with QR code and FBR logo

---

## Phase 5: User Story 3 — HS Code Search + UOM Auto-populate (P2)

**Goal**: Searchable HS code dropdown that auto-populates UOM from FBR live data.

**Independent Test**:
1. Open new invoice form, focus HS Code field on any line item
2. Type "0101" — dropdown appears with matching HS codes and descriptions within 1 second
3. Select a code — UOM field auto-fills with FBR-approved unit
4. Type an invalid/unknown code — "No matching HS codes found" shown

### Reference Data Service

- [x] T029 [P] [US3] Create HS code reference service in `src/lib/fbr/reference/hs-codes.ts` — function `searchHSCodes(query: string)` that checks `fbr_reference_cache` for `cache_key='hs_codes'` (24h TTL), on cache miss fetches from `https://gw.fbr.gov.pk/pdi/v1/itemdesccode`, stores in cache, then filters payload by `query` string (case-insensitive match on code or description), returns top 20 results
- [x] T030 [P] [US3] Create HS→UOM service in `src/lib/fbr/reference/hs-uom.ts` — function `getUOMForHSCode(hsCode: string)` that checks cache for `cache_key='hs_uom:{hsCode}'` (24h TTL), on miss fetches `https://gw.fbr.gov.pk/pdi/v2/HS_UOM?hs_code={hsCode}&annexure_id=3`, stores result, returns first UOM description string

### API Routes

- [x] T031 [P] [US3] Create `GET /api/fbr/reference/hs-codes` route in `src/app/api/fbr/reference/hs-codes/route.ts` — authenticates session, reads `q` query param (min 3 chars, else 400), calls `searchHSCodes(q)`, returns `{results, total, cached: boolean}`
- [x] T032 [P] [US3] Create `GET /api/fbr/reference/hs-uom` route in `src/app/api/fbr/reference/hs-uom/route.ts` — authenticates session, reads `hs_code` query param, calls `getUOMForHSCode()`, returns UOM description or 404 if not found

### UI Component

- [x] T033 [US3] Create `HSCodeSearch` component in `src/components/invoices/HSCodeSearch.tsx` — controlled input with debounced search (300ms via `use-debounce`), shows dropdown of results with code + description, on selection calls `GET /api/fbr/reference/hs-uom` and updates the UOM field via `form.setValue()`, shows loading spinner and "No results" empty state; replaces plain text input in `LineItemRow.tsx`
- [x] T034 [US3] Replace HS Code plain input in `src/components/invoices/LineItemRow.tsx` with `HSCodeSearch` component — pass `form`, `index`, and `onUOMChange` callback prop

**Checkpoint**: User Story 3 complete — live HS code search with auto-UOM works in line items

---

## Phase 6: User Story 4 — Buyer NTN Verification (P2)

**Goal**: Real-time STATL NTN verification with 24-hour DB cache, auto-sets registration type.

**Independent Test**:
1. Enter a valid NTN in buyer NTN field, tab away
2. Verify green "Active" badge appears within 5 seconds
3. Enter an inactive NTN — verify warning badge appears
4. Re-enter the same NTN — verify instant response (from cache, no FBR call)
5. Enter CNIC for unregistered buyer — verify STATL check is skipped

### Service Layer

- [x] T035 [P] [US4] Create STATL/NTN verification service in `src/lib/fbr/reference/statl.ts` — function `verifyNTN(ntnCnic: string, organizationId: string)` that: (1) checks `buyer_registry` for existing `statlCheckedAt` within 24h → return cached result, (2) skips STATL for CNIC values (13 digits), (3) calls `POST https://gw.fbr.gov.pk/dist/v1/statl` with `{regno, date}`, (4) calls `POST https://gw.fbr.gov.pk/dist/v1/Get_Reg_Type` with `{Registration_No}`, (5) upserts result into `buyer_registry`, (6) returns `{statlStatus, registrationType, cached: boolean}` with 5-second timeout and graceful degradation on failure

### API Route

- [x] T036 [US4] Create `POST /api/fbr/verify-ntn` route in `src/app/api/fbr/verify-ntn/route.ts` — authenticates session, reads `ntnCnic` from body, calls `verifyNTN()` with session org ID, returns `{ntnCnic, statlStatus, registrationType, cached, warning?}`, handles STATL timeout with non-blocking 504 response containing warning message

### UI Component

- [x] T037 [US4] Create `NTNVerifier` component in `src/components/invoices/NTNVerifier.tsx` — inline status badge that shows: idle (nothing), verifying (spinner), active (green checkmark + "Active"), inactive (yellow warning + "Inactive — verify before submitting"), unknown/timeout (gray "Could not verify"); triggered on `onBlur` of NTN field with 500ms debounce; on success auto-sets `buyerRegistrationType` field via `form.setValue()`
- [x] T038 [US4] Integrate `NTNVerifier` into `src/components/invoices/InvoiceHeader.tsx` — add below buyer NTN/CNIC input field, pass `form` and `organizationId` props

**Checkpoint**: User Story 4 complete — buyer NTN verified in real-time with smart caching

---

## Phase 7: User Story 5 — Buyer Registry Autocomplete (P3)

**Goal**: Autocomplete buyer fields from previously used buyers registry.

**Independent Test**:
1. Submit one invoice with buyer "ABC Enterprises" — buyer saved to registry
2. Create new invoice, type "ABC" in buyer business name field
3. Verify autocomplete suggestion appears
4. Select it — all buyer fields auto-fill (NTN, province, address, registration type)

### API Route

- [x] T039 [P] [US5] Create `GET /api/buyers` route in `src/app/api/buyers/route.ts` — authenticates session, reads `q` query param (min 2 chars), queries `buyer_registry` WHERE `organizationId = session.orgId AND businessName ILIKE '%{q}%'` ORDER BY `useCount DESC` LIMIT 10, returns `{buyers: BuyerRegistryEntry[]}`

### Registry Updates

- [x] T040 [US5] Add buyer registry save logic to `POST /api/fbr/submit` route in `src/app/api/fbr/submit/route.ts` — after successful FBR issuance, upsert buyer details into `buyer_registry` (increment `useCount`, update `lastUsedAt`) within the same DB transaction

### UI Component

- [x] T041 [US5] Create `BuyerSearch` component in `src/components/invoices/BuyerSearch.tsx` — text input with debounced search (300ms), dropdown of matching buyers (shows businessName + NTN), on selection calls `form.setValue()` for all buyer fields (ntnCnic, businessName, province, address, registrationType); shows empty state if no matches
- [x] T042 [US5] Replace buyer business name plain input in `src/components/invoices/InvoiceHeader.tsx` with `BuyerSearch` component

**Checkpoint**: User Story 5 complete — buyers autocomplete from registry

---

## Phase 8: User Story 6 — FBR Validation Error Display (P2)

**Goal**: Clear, per-field FBR error messages with form field highlighting when FBR rejects validation.

**Independent Test**:
1. Submit invoice missing HS code on line item 1
2. FBR returns error code 0044
3. Verify: (a) line item 1 row highlighted red, (b) error shows "HS Code is required" (not raw code "0044"), (c) error banner at top of form lists all issues

### Reference Data Pre-population

- [x] T043 [P] [US6] Create provinces reference service in `src/lib/fbr/reference/provinces.ts` — function `getProvinces()` that checks cache (7-day TTL, key `'provinces'`), on miss fetches `https://gw.fbr.gov.pk/pdi/v1/provinces`, stores and returns `{stateProvinceCode, stateProvinceDesc}[]`
- [x] T044 [P] [US6] Create UOM reference service in `src/lib/fbr/reference/uom.ts` — function `getAllUOMs()` checking cache (24h TTL, key `'uom'`), fetches `https://gw.fbr.gov.pk/pdi/v1/uom` on miss, returns `{uoM_ID, description}[]`
- [x] T045 [P] [US6] Create `GET /api/fbr/reference/provinces` route in `src/app/api/fbr/reference/provinces/route.ts` — returns cached provinces list
- [x] T046 [P] [US6] Create `GET /api/fbr/reference/uom` route in `src/app/api/fbr/reference/uom/route.ts` — returns cached UOM list

### Error Enhancement

- [x] T047 [US6] Enhance `FBRErrorDisplay` component in `src/components/invoices/FBRErrorDisplay.tsx` — add `onFieldHighlight?: (fieldPath: string) => void` callback prop; when user clicks an error item, the form scrolls to and highlights the referenced field; group errors by "Invoice Header" and "Line Items (by item number)"
- [x] T048 [US6] Wire `FBRErrorDisplay` field highlighting to form in `invoice-form-client.tsx` — implement `handleFieldHighlight(fieldPath)` that uses `form.setFocus()` on the matching field path; pass as `onFieldHighlight` prop

**Checkpoint**: User Story 6 complete — FBR errors display with plain English + field highlighting

---

## Phase 9: Reference Data Population (Cross-Cutting)

**Purpose**: Populate all reference data caches on startup and wire live data to form dropdowns.

- [x] T049 [P] Create tax rates reference service in `src/lib/fbr/reference/tax-rates.ts` — function `getTaxRates(transTypeId: number, provinceCode: number, date: string)` with cache key `'tax_rates:{transTypeId}:{provinceCode}:{date}'` (1h TTL), fetches `/pdi/v2/SaleTypeToRate`, returns `{ratE_ID, ratE_DESC, ratE_VALUE}[]`
- [x] T050 [P] Create `GET /api/fbr/reference/tax-rates` route in `src/app/api/fbr/reference/tax-rates/route.ts` — reads `transTypeId`, `province`, `date` query params, calls `getTaxRates()`, returns tax rate list
- [x] T051 [P] Replace static province dropdown data in `src/components/invoices/InvoiceHeader.tsx` — fetch from `GET /api/fbr/reference/provinces` on component mount (with `useEffect`), fall back to existing `FBR_PROVINCES` static array if API unavailable
- [x] T052 [P] Replace static UOM dropdown in `src/components/invoices/LineItemRow.tsx` — fetch from `GET /api/fbr/reference/uom` once (cached in parent component state), fall back to `FBR_UOM_OPTIONS` if unavailable
- [x] T053 Replace static tax rate dropdown in `src/components/invoices/LineItemRow.tsx` — fetch from `GET /api/fbr/reference/tax-rates` when seller province changes, fall back to `FBR_TAX_RATES` static data if unavailable

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple user stories.

- [x] T054 [P] Add `.env.example` file in repository root documenting all required env vars: `FBR_API_TOKEN`, `FBR_ENV`, `DATABASE_URL`, `BETTER_AUTH_SECRET` with placeholder values and comments explaining each
- [x] T055 [P] Add invoice list page `src/app/(dashboard)/invoices/page.tsx` — table showing all user's invoices with columns: date, buyer name, FBR invoice number (or status badge), grand total, actions (View, Print if issued)
- [x] T056 [P] Add "Back to Invoices" navigation link in invoice detail page `src/app/(dashboard)/invoices/[id]/page.tsx`
- [x] T057 Add invoice status badge component `src/components/invoices/InvoiceStatusBadge.tsx` — colored chip: gray=draft, blue=validating/validated/submitting, green=issued, red=failed
- [x] T058 [P] Add sidebar navigation link to "Invoices" in `src/components/dashboard/Sidebar.tsx`
- [x] T059 [P] Remove all `console.log` debug statements from Phase 2-9 implementation files (keep `console.error` for error logging)
- [x] T060 [P] Add `FBR_API_TOKEN` guard to `src/lib/fbr/api-client.ts` — if env var is missing, throw descriptive error: "FBR_API_TOKEN not configured. Set this in .env.local. Get token from PRAL."
- [x] T061 [P] Add loading states to `HSCodeSearch` and `BuyerSearch` components — disable input during fetch, show spinner in dropdown
- [x] T062 [P] Add error boundaries around FBR components (SubmissionStatus, FBRErrorDisplay) to prevent full page crash if component errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires Phase 1 — BLOCKS all user stories
- **US1 Submission (Phase 3)**: Requires Phase 2 — BLOCKS nothing (MVP deliverable)
- **US2 QR Print (Phase 4)**: Requires Phase 3 (needs FBR invoice number) — delivers Phase 3 value
- **US3 HS Search (Phase 5)**: Requires Phase 2 only — can run in parallel with Phase 3
- **US4 NTN Verify (Phase 6)**: Requires Phase 2 only — can run in parallel with Phase 3/5
- **US5 Buyer Registry (Phase 7)**: Requires Phase 3 (saves buyers after FBR submission)
- **US6 Error Display (Phase 8)**: Requires Phase 3 (needs FBR errors to display)
- **Ref Data (Phase 9)**: Requires Phase 2 — replaces static data, can parallel with US phases
- **Polish (Phase 10)**: Requires all desired stories complete

### User Story Dependencies

```
Phase 2 (Foundation)
  ├── Phase 3 (US1: Submit) ──→ Phase 4 (US2: QR Print)
  │                         └→ Phase 7 (US5: Buyer Registry)
  │                         └→ Phase 8 (US6: Error Display)
  ├── Phase 5 (US3: HS Search)   [parallel with Phase 3]
  ├── Phase 6 (US4: NTN Verify)  [parallel with Phase 3]
  └── Phase 9 (Ref Data)         [parallel with all]
```

### Within-Phase Parallel Opportunities

**Phase 2 (Foundation)**:
```
Parallel group A — DB schema tasks (same file, run sequentially): T003 → T004 → T005 → T006 → T007 → T008 → T009
Parallel group B — library files (different files): T010, T011, T012, T013, T014 [all parallel]
```

**Phase 3 (US1 Submission)**:
```
Parallel: T015, T016 (different lib files)
Parallel: T019, T020 (different components)
Sequential: T017 (depends on T015), T018 (depends on T016)
Sequential: T021, T022 (same form file)
```

**Phase 4 (US2 QR Print)**:
```
Parallel: T023, T024 (different files)
Sequential: T025 (depends on T023, T024) → T026 → T027 → T028
```

**Phase 5 (US3 HS Search)**:
```
Parallel: T029, T030 (different lib files)
Parallel: T031, T032 (different routes)
Sequential: T033 (depends on T029, T030, T031, T032) → T034
```

**Phase 9 (Ref Data)**:
```
Parallel: T049, T050, T051, T052, T053 (different files)
```

---

## Implementation Strategy

### MVP First (Phases 1–4 Only)

1. Phase 1+2: Foundation → DB schema + FBR library ready
2. Phase 3: US1 Submission → Full FBR validate+post flow working
3. Phase 4: US2 QR Print → Issued invoices printable with QR
4. **STOP AND VALIDATE**:
   - Test with FBR Sandbox scenario SN001 (standard rate, registered buyer)
   - Verify FBR invoice number received and stored
   - Verify QR code scannable on print page
   - Verify error messages show for invalid submissions
5. Deploy MVP if ready — users can submit and print FBR invoices ✅

### Incremental Delivery

1. **Foundation** (Phases 1–2) → Infrastructure ready
2. **MVP** (Phases 3–4) → Submit to FBR + print QR invoice ✅
3. **Enhanced Data** (Phases 5–6) → HS search + NTN verify ✅
4. **User Experience** (Phases 7–8) → Buyer registry + error display ✅
5. **Live Reference Data** (Phase 9) → Replace all static dropdowns ✅
6. **Production Ready** (Phase 10) → Polish + list page ✅

---

## Notes

- [P] tasks = different files, no shared dependencies — run in parallel
- [Story] label maps to user story (US1–US6) for traceability
- All FBR API calls are server-side only — `FBR_API_TOKEN` never in client code
- Issued invoices are immutable after status = `issued` (Constitution Principle IX)
- Static fallback data exists for all reference APIs — feature degrades gracefully if FBR reference APIs are down
- Commit strategy: commit after each phase or logical parallel group
