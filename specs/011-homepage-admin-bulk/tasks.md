# Tasks: TaxDigital Platform Overhaul — Homepage, Admin & Bulk Invoice

**Input**: Design documents from `/specs/011-homepage-admin-bulk/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅ | quickstart.md ✅

**Tests**: No dedicated test tasks generated — Vitest suite must pass as a quality gate in the final phase.

**Organization**: Tasks grouped by user story (P1 stories first, then P2, then quality gates).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase
- **[Story]**: Which user story from spec.md
- All file paths are absolute relative to `src/` in the project root

---

## Phase 1: Setup (Confirm Prerequisites)

**Purpose**: Verify that confirmed-complete items need no code changes, so implementors don't waste time on them.

- [X] T001 Confirm `src/components/ThemeProvider.tsx` has `defaultTheme="light"` and `enableSystem={false}` (already done per research — read and document as verified, no edit needed)
- [X]T002 Confirm `src/components/dashboard/Sidebar.tsx` contains a `Bulk Upload` nav item linking to `/invoices/bulk` (already done per research — read and document as verified, no edit needed)
- [X]T003 [P] Confirm `src/app/(dashboard)/invoices/page.tsx` header contains a `Bulk Upload` button/link (already done per research — read and document as verified, no edit needed)

**Checkpoint**: Prerequisites confirmed. All user story work can begin.

---

## Phase 2: User Story 1 — Visitor Landing Page (Priority: P1) 🎯 MVP

**Goal**: Replace the basic homepage with a premium 7-section marketing landing page. Authenticated users are redirected to `/dashboard`. Unauthenticated visitors see the full landing page with contact form.

**Independent Test**: Visit `/` without a session → full landing page renders with all 7 sections. Visit `/` with a session → redirected to `/dashboard`. Click "Contact Us" → scrolls to `#contact`. Submit contact form → success message replaces form.

### Implementation for User Story 1

- [X]T004 [US1] Create `src/components/home/ContactForm.tsx` as a `"use client"` component with fields: Full Name (required), Business Name (required), Email (required), Phone (optional, placeholder "+92 300 0000000"), Message (textarea 4 rows). State: `{ name, businessName, email, phone, message, loading, success }`. On submit: preventDefault, set loading, setTimeout 1000ms, set success, reset fields. "Book a Call Instead" button opens `https://calendly.com` in new tab. Success state shows ✅ "Message Sent!" and "We will contact you within 24 hours." All styles use CSS variables only (no hardcoded colors). Input focus style: `borderColor: var(--primary)`, `boxShadow: 0 0 0 3px rgba(99,102,241,0.1)`.

- [X]T005 [US1] Rewrite `src/app/page.tsx` as a server component. Import `auth` from `@/lib/auth`, `headers` from `next/headers`, `redirect` from `next/navigation`, `Link` from `next/link`, and `ContactForm` from `@/components/home/ContactForm`. Session check: `const session = await auth.api.getSession({ headers: await headers() }); if (session) redirect("/dashboard");`. Build all 7 sections as specified:
  1. **Sticky navbar** (position sticky, top 0, zIndex 50, background `var(--surface)`, opacity 0.6, backdropFilter blur(12px), borderBottom `1px solid var(--border)`, height 64px): logo text with gradient `linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)` WebkitBackgroundClip text; nav-right has "Contact Us" anchor `href="#contact"` and "Sign In" Link to `/login`
  2. **Hero** (minHeight 92vh, flex column, alignItems center, justifyContent center, textAlign center, pt 80px pb 80px, position relative, overflow hidden): two absolute orb decorations; announcement pill; H1 "Smarter Invoicing" + gradient span "Built for Pakistan"; subtitle paragraph; CTA row with "Get Started →" Link to `/login` and "Book a Demo Call" anchor `href="#contact"`; stats row with "500+" / "Active Businesses", "99.9%" / "FBR Submission Rate", "< 2s" / "Average Response Time"
  3. **Features section** (id="features", py 96px, maxWidth 1200px, margin auto): eyebrow "FEATURES", H2 "Everything your business needs", subtitle; 3-column CSS grid of 6 feature cards (🧾 FBR Invoice Submission, 👥 Client Management, 📊 Revenue Analytics, 📦 Bulk Upload, 🔒 Secure Platform, ⚡ Built for Speed) each with icon container (background `var(--primary-subtle)`), title, description
  4. **How It Works** (full-width div, background `var(--bg-subtle)`, py 96px): eyebrow "HOW IT WORKS", H2 "Up and running in minutes"; 3 steps in a flex row (Contact the Admin, Receive Your Credentials, Start Invoicing) each with numbered circle (background `var(--primary)`, color white, 56×56px)
  5. **Contact section** (id="contact", py 96px, maxWidth 640px, margin auto, textAlign center): eyebrow "GET ACCESS", H2 "Ready to get started?", subtitle; contact card (background `var(--surface)`, borderRadius 20px, padding 40px, boxShadow `var(--shadow)`) containing `<ContactForm />`
  6. **Footer** (background `var(--surface)`, borderTop `1px solid var(--border)`, py 40px): flex row with logo + tagline on left, Sign In + Contact links on right; below: copyright "© {new Date().getFullYear()} TaxDigital · All rights reserved · Built for Pakistan" (color `var(--foreground-subtle)`)

**Checkpoint**: User Story 1 complete — `/` shows premium landing page; `/dashboard` redirects work; contact form submits and shows success.

---

## Phase 3: User Story 2 — Admin Manual Password Creation (Priority: P1)

**Goal**: Admin can enter or generate a password, see it in a visible/editable field, then create the user. Credentials card shows the exact password used.

**Independent Test**: Visit `/admin?key=<KEY>` → see form with name, email, password fields. Click "Generate Password" → password appears in field. Edit one char. Click "Create Account" → credentials card shows the edited password (not the original generated one).

### Implementation for User Story 2

- [X]T006 [US2] Rewrite `src/app/api/admin/create-user-secret/route.ts`. Remove `generateTempPassword()` and `generateUserId()`. Accept `{ name, email, password, adminKey }` from request body. Validate: adminKey matches `process.env.ADMIN_SECRET_KEY` (401 if not), name and email non-empty (400), `password.length >= 8` (400 "Password must be at least 8 characters"). Call `auth.api.signUpEmail({ body: { name: name.trim(), email: email.toLowerCase().trim(), password } })` inside try/catch (preserve existing catch error handling pattern). Return `{ success: true, credentials: { name: result.user.name, email: result.user.email, password } }` on success.

- [X]T007 [US2] Rewrite `src/app/admin/admin-client.tsx`. Update `CreatedCredentials` interface to `{ name: string; email: string; password: string }` (remove `tempPassword` and `userId`). Add state `password: string` and `showPassword: boolean` (default false). Add `generatePassword()` function using the exact algorithm from spec (upper/lower/digits/special charset, 8 chars, shuffled). Layout: Row 1 has Full Name and Email inputs side by side (grid 2 cols). Row 2 is full-width password field: `<input type={showPassword ? "text" : "password"}>` with two icon buttons on the right — an eye toggle button and a "Generate Password" button. `handleCreate` POST body must include `{ name, email, password, adminKey }`. "Create Account" button disabled when name, email, or password is empty. Credentials card shows `credentials.name`, `credentials.email`, `credentials.password` with CopyButton for each. Warning text: "Give these credentials to the user directly. They can change their password via Forgot Password." Replace ALL hardcoded color values with CSS variables: `--bg`, `--surface`, `--border`, `--surface-2`, `--foreground`, `--foreground-muted`, `--foreground-subtle`, `--primary`.

**Checkpoint**: User Story 2 complete — admin can generate or type a password, create account, and see exact credentials used.

---

## Phase 4: User Story 3 — Bulk Invoice 4-Step Workflow (Priority: P1)

**Goal**: Replace the 2-step bulk upload with a 4-step wizard: (1) download Excel template, (2) upload & field validate, (3) verify buyer NTNs against FBR registry, (4) submit only NTN-verified rows. Step indicator shows progress.

**Independent Test**: Download template → fill 3 rows (2 valid NTNs, 1 invalid) → upload → NTN verify → submit → confirm only 2 rows submitted.

### Implementation for User Story 3

- [X]T008 [US3] Extend `src/app/api/bulk-invoices/upload/route.ts` to parse `.xlsx` and `.xls` files. Add `import * as XLSX from 'xlsx'` at the top. In the file-type branch, add: `else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) { const buffer = await file.arrayBuffer(); const wb = XLSX.read(buffer); const ws = wb.Sheets[wb.SheetNames[0]]; rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws).map(r => Object.fromEntries(Object.entries(r).map(([k,v]) => [k, String(v ?? '')]))); }`. Keep existing CSV branch unchanged. Keep the existing `validateRow` function and field names unchanged (camelCase: `buyerBusinessName`, `buyerNTNCNIC`, etc.).

- [X]T009 [US3] Create `src/app/api/bulk-invoices/verify-ntns/route.ts`. Import `NextRequest`, `NextResponse`, `headers` from `next/headers`, `auth` from `@/lib/auth`, `db` from `@/lib/db`, `bulkInvoiceBatches` from `@/lib/db/schema/bulk-invoices`, `eq` and `and` from `drizzle-orm`. Authenticate session. Load batch by `batchId` + `userId` ownership check. Collect unique `buyerNTNCNIC` values from field-valid rows (where `r.valid === true`). For each unique NTN: POST to `${process.env.BETTER_AUTH_URL}/api/fbr/verify-ntn` with body `{ ntnCnic: ntn }` and forwarded cookie header; check `response.statlStatus === 'active'` to determine verified status; on error catch → `verified: false, message: "Could not verify with FBR"`. Map over all rows: for valid rows set `ntnVerified: result.verified`, `ntnMessage: result.message`, `status: result.verified ? "ready" : "ntn-failed"`; invalid rows unchanged. Update batch: `rows = updatedRows`, `status = "verified"`, `updatedAt = new Date()`. Return `{ success: true, readyCount, ntnFailedCount, rows: updatedRows }`.

- [X] T010 [US3] Modify `src/app/api/bulk-invoices/submit/route.ts`. Change the valid-rows filter from `(batch.rows as BulkRow[]).filter(r => r.valid)` to `(batch.rows as BulkRow[]).filter(r => r.valid && r.ntnVerified === true)`. Add `ntnVerified?: boolean` to the `BulkRow` interface. No other changes to the submission logic.

- [X] T011 [US3] Rewrite `src/app/(dashboard)/invoices/bulk/bulk-client.tsx` as a 4-step wizard. State: `step: 1|2|3|4`, `file: File|null`, `uploading: boolean`, `uploadResult: {batchId, totalRows, validRows, invalidRows, rows}|null`, `verifying: boolean`, `verifyResult: {readyCount, ntnFailedCount, rows}|null`, `submitting: boolean`, `submitResult: {submittedCount, failedCount}|null`, `submitConfirm: boolean`, `batches: RecentBatch[]` (initialized from props).
  - **Step indicator** at top: 4 steps connected by horizontal lines; active step uses `var(--primary)`; completed steps use `var(--positive)` with ✓; future steps use `var(--foreground-subtle)`.
  - **Section 1 (always visible, highlighted when step=1)**: Card with badge "1", title "Download Template". Preview table showing all column headers and one example data row (`buyerBusinessName="Example Trading Co."`, `buyerNTNCNIC="1234567-8"`, `invoiceDate="2025-01-15"`, `hsCode="6109.1000"`, `productDescription="Cotton T-Shirts"`, `quantity=100`, `uom="NOS"`, `valueSalesExcludingST=50000`, `salesTaxApplicable=9000`, `discount=0`, `rate="18%"`, `buyerProvince="Punjab"`, `buyerAddress="Shop 12 Block 5 Karachi"`, `buyerRegistrationType="Registered"`, `invoiceType="Sale Invoice"`). Table style: scrollable horizontally, small font, background `var(--surface-2)`. "Download Template (.xlsx)" button: dynamically import `xlsx`, create workbook with sheet "Invoices", add example row + placeholder row (all "your data here"), set column widths to min 18 wch, write as `taxdigital-bulk-template.xlsx`. After download: set `step` to 2.
  - **Section 2 (highlighted when step=2)**: Card with badge "2", title "Upload Your File". Drag-and-drop zone with `📁` icon, drag state border `var(--primary)`, accepts `.csv,.xlsx,.xls`. Hidden `<input type="file">` triggered on zone click. File pill shows selected filename with X to clear. "Upload and Validate" button (disabled when no file or uploading): POST to `/api/bulk-invoices/upload` as FormData, set `uploadResult`, advance `step` to 3 if `validRows > 0`. Results table with Row, Buyer Name, NTN, HS Code, Status badge, Errors columns. Summary: "X rows passed field validation · Y rows have errors."
  - **Section 3 (only shown after upload, highlighted when step=3)**: Card with badge "3", title "Verify FBR Registration". Summary "X invoices ready for NTN verification". "Verify All NTNs with FBR" button (enabled when `uploadResult.validRows > 0` and not verifying): POST to `/api/bulk-invoices/verify-ntns` with `{ batchId: uploadResult.batchId }`, set `verifyResult`, advance `step` to 4. Loading indicator "Checking NTN registrations with FBR...". After verification: updated table with extra "FBR Status" column (green "Registered" badge / red "Not Registered" badge). Summary: "X invoices ready to submit · Y buyers not registered with FBR (these will be skipped)".
  - **Section 4 (only shown after NTN verification, highlighted when step=4)**: Card with badge "4", title "Submit to FBR". Breakdown: "X invoices will be submitted · Y will be skipped (NTN not registered)". "Submit X Invoices to FBR" button (disabled if readyCount = 0): sets `submitConfirm` true. Confirmation box: ⚠️ "You are about to submit X invoices to FBR. This cannot be undone." with "Confirm Submit" and "Cancel" buttons. On confirm: POST to `/api/bulk-invoices/submit` with `{ batchId: uploadResult.batchId }`, set `submitResult`, append new batch to `batches`. Result card: green for submitted count, red for failed count.
  - **Recent Batches table** at bottom: Filename, Date, Total, Valid, Submitted, Failed, Status. Status badge colors: `done=var(--positive-bg)/var(--positive)`, `partial=var(--warning-bg)/var(--warning)`, `failed=var(--error-bg)/var(--error)`, `verified/submitting=var(--info-bg)/var(--info)`, other=`var(--surface-2)/var(--foreground-muted)`. Empty state if no batches.

**Checkpoint**: User Story 3 complete — 4-step workflow functional with template download, upload, NTN verification, and FBR submission.

---

## Phase 5: User Story 4 — Light Mode Default (Priority: P2)

**Goal**: App renders in light mode with no flash on first load when no theme preference is stored.

**Independent Test**: Clear localStorage, open app in fresh browser → light mode renders immediately, no dark flash.

### Implementation for User Story 4

- [X] T012 [US4] Read `src/components/ThemeProvider.tsx` and `src/app/layout.tsx`. Confirm `defaultTheme="light"` and `enableSystem={false}` and `suppressHydrationWarning` are all present. If confirmed already correct (per research), this task is documentation-only — no file edits needed. If any value is wrong, fix it. Document result: "Theme confirmed light-mode-default — no code change required."

**Checkpoint**: User Story 4 confirmed complete.

---

## Phase 6: User Story 5 — Navigation & Auth Page Cleanup (Priority: P2)

**Goal**: Login page has no self-register link. Register page redirects to login. Sidebar and invoices page already correct (confirmed in setup phase).

**Independent Test**: Visit `/login` → no "Create account" or "Register" link visible. Visit `/register` → redirected to `/login`. Sidebar shows "Bulk Upload" link. Invoices page shows "Bulk Upload" button.

### Implementation for User Story 5

- [X] T013 [P] [US5] Modify `src/app/(auth)/login/page.tsx`. Remove the `<p>` element that contains "Don't have an account?" and the Link to `/register`. Keep the `LoginForm` component, the "Forgot password?" link (if present in LoginForm or page), and the "Back to home" link. No other changes.

- [X] T014 [P] [US5] Rewrite `src/app/(auth)/register/page.tsx` as a server component that redirects to `/login`. Content: `import { redirect } from "next/navigation"; export default function RegisterPage() { redirect("/login"); }`. This replaces the full `RegisterForm` render.

**Checkpoint**: User Story 5 complete — login page has no register link; `/register` redirects to `/login`.

---

## Phase 7: Quality Gates

**Purpose**: Validate all changes compile cleanly, pass linting, and all existing tests pass.

- [X] T015 Run `npx tsc --noEmit` from project root. Read every TypeScript error. Fix the root cause of each error in the affected source file. Re-run until zero errors. Do not use `@ts-ignore` or `any` casts to suppress errors — fix the underlying type issue.

- [X] T016 Run `npx eslint src --ext .ts,.tsx --max-warnings 0` from project root. Fix every lint error and warning. Common issues to check: unused imports, `any` types, missing return types on exported functions, React hook dependency arrays. Re-run until zero warnings.

- [X] T017 Run `npx vitest run` from project root. Read every test failure carefully. Fix the application code or test code to make each test pass — do not skip, disable, or use `expect.assertions(0)`. Re-run after fixes to confirm all pass.

- [X] T018 Re-run `npx tsc --noEmit` one final time after all quality fixes to confirm zero TypeScript errors remain. Report: list of test files, pass count, zero TS errors, zero ESLint warnings.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup/Verify)         → No dependencies
Phase 2 (US1 Landing Page)     → After Phase 1
Phase 3 (US2 Admin Password)   → After Phase 1 (independent of US1)
Phase 4 (US3 Bulk Workflow)    → After Phase 1 (independent of US1/US2)
Phase 5 (US4 Theme)            → After Phase 1 (likely verification only)
Phase 6 (US5 Nav Cleanup)      → After Phase 1 (independent of all others)
Phase 7 (Quality Gates)        → After ALL user story phases complete
```

### User Story Dependencies

- **US1** (T004–T005): Independent. No dependencies on US2–US5.
- **US2** (T006–T007): Independent. No dependencies on US1, US3–US5.
- **US3** (T008–T011): T009 depends on T008 (upload must support xlsx before verify-ntns route tests it). T010 and T011 can start after T009 is created.
- **US4** (T012): Independent verification task.
- **US5** (T013–T014): T013 and T014 are parallel (different files).

### Within Each User Story

- **US1**: T004 (ContactForm) before T005 (page.tsx imports it)
- **US2**: T006 (API) and T007 (client) can run in parallel (different files, client uses API at runtime not import time)
- **US3**: T008 → T009 → T010, T011 (T010 and T011 parallel after T009)
- **US5**: T013 and T014 fully parallel

---

## Parallel Opportunities

```
# Phase 1 verification tasks — all parallel:
T001, T002, T003 (different files, read-only confirmation)

# US2 tasks — parallel (different files):
T006 (API route), T007 (admin client)

# US5 tasks — parallel (different files):
T013 (login page), T014 (register page)

# US1, US2, US3, US4, US5 phases — fully parallel by story (different files):
[US1: T004, T005] ‖ [US2: T006, T007] ‖ [US3: T008→T009→T010,T011] ‖ [US4: T012] ‖ [US5: T013, T014]
```

---

## Implementation Strategy

### MVP First (Landing Page — User Story 1 Only)

1. Complete Phase 1 (verification)
2. Complete Phase 2 (US1: ContactForm + page.tsx rewrite)
3. **STOP AND VALIDATE**: Visit `/` → premium landing page renders; `/dashboard` redirect works; contact form submits
4. Demo-ready homepage

### Incremental Delivery

1. Phase 1 → confirm prerequisites
2. Phase 2 (US1) → premium homepage ← **Demo milestone**
3. Phase 3 (US2) → admin password management
4. Phase 4 (US3) → bulk invoice 4-step workflow ← **Main feature milestone**
5. Phase 5 (US4) → confirm light mode
6. Phase 6 (US5) → cleanup login/register
7. Phase 7 → quality gates pass ← **Delivery milestone**

---

## Notes

- [P] tasks use different files and have no shared state — safe to parallelize
- `buyerNTNCNIC` is the NTN field name throughout (not `BuyerNTN` as in spec sample code)
- NTN verify endpoint is `POST /api/fbr/verify-ntn` with body `{ ntnCnic }`, not a GET
- `statlStatus === 'active'` is the condition for a verified NTN
- Admin credentials response field is `password` (not `tempPassword`)
- Schema table is `bulkInvoiceBatches`, column is `rows` (not `invoices`)
- Theme is already light — T012 is a confirmation task, not a code change
- Sidebar and invoices page already have Bulk Upload link/button — T001–T003 are confirmation tasks
