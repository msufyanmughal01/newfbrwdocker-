# Implementation Plan: FBR Digital Invoicing Platform — Full Compliance Upgrade

**Branch**: `005-fbr-compliance-platform` | **Date**: 2026-02-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/005-fbr-compliance-platform/spec.md`

---

## Summary

Upgrade the existing Next.js 16 FBR invoicing platform across 7 concern areas: fix the IndexedDB-based draft popup bug by migrating to server-side-only drafts; add HS code master table for user-pinned codes; hook business profile auto-creation into the signup flow; add draft search/filter and convert functionality; enforce server-side immutability on issued invoices; migrate FBR token resolution to per-user business profile; and modernize the UI with a consistent design system. All changes are additive to the existing Drizzle/Neon/Next.js/better-auth stack.

---

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16.1.6 (App Router), Drizzle ORM 0.45, better-auth 1.4.18, react-hook-form 7.x, zod 4.x, recharts 3.x, Tailwind CSS 4.x
**Storage**: Neon PostgreSQL (serverless, via `@neondatabase/serverless`) + IndexedDB (client-side, being phased out for drafts)
**Testing**: Vitest 4.x (unit), Playwright 1.x (e2e)
**Target Platform**: Web (Next.js SSR/RSC, Neon serverless edge-compatible)
**Project Type**: Web application (Next.js monorepo — frontend + API routes in one)
**Performance Goals**: HS code dropdown response < 300ms; dashboard metrics < 500ms; FBR submission < 30s with retry
**Constraints**: FBR token must never appear in logs or client code; issued invoices immutable; financial calculations server-side only; all user data scoped by userId
**Scale/Scope**: Single-tenant per user (no org-level multi-tenancy for this upgrade); hundreds to thousands of invoices per user

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Clarity | ✅ PASS | All new files follow existing naming conventions; intent is clear |
| II. Consistency | ✅ PASS | New HS master API follows same pattern as existing `/api/clients` and `/api/settings` routes |
| III. Simplicity | ✅ PASS | Draft fix is a deletion (remove IndexedDB useEffect); HS master is one new table + two routes |
| IV. Purpose-Driven | ✅ PASS | Every change traces to a FR in spec.md |
| V. Quality | ✅ PASS | No phase complete until Vitest + Playwright pass |
| VI. Transparency | ✅ PASS | Commit per logical change; PHR per prompt |
| VII. Scalability | ✅ PASS | Adding files, not modifying unrelated ones; structure follows existing patterns |
| VIII. Security | ✅ PASS | FBR token encrypted at rest; never logged; per-user scoping enforced |
| IX. Data Integrity | ✅ PASS | Immutability guard on issued invoices; decimal(15,2) for all money; server-side calculations only |
| X. Testability | ✅ PASS | Each change is independently testable; no tight coupling introduced |

**Constraint violations**: None. No complexity tracking required.

---

## Project Structure

### Documentation (this feature)

```text
specs/005-fbr-compliance-platform/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output — gap analysis and decisions
├── data-model.md        # Phase 1 output — entity definitions and migration plan
├── quickstart.md        # Phase 1 output — developer setup guide
├── contracts/
│   └── api-contracts.md # Phase 1 output — REST API contracts
└── tasks.md             # Phase 2 output (/sp.tasks command — NOT created by /sp.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx               [existing]
│   │   └── register/page.tsx            [existing]
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx                 [existing]
│   │   │   └── DashboardContent.tsx     [existing — verify metrics filter for issued only]
│   │   ├── invoices/
│   │   │   ├── invoice-form-client.tsx  [MODIFY — remove IndexedDB draft recovery useEffect]
│   │   │   ├── new/page.tsx             [existing — no change needed after form fix]
│   │   │   ├── drafts/
│   │   │   │   ├── page.tsx             [MODIFY — add search/filter UI]
│   │   │   │   ├── DraftsClient.tsx     [NEW — client component for search/filter]
│   │   │   │   └── DraftDeleteButton.tsx [existing]
│   │   │   └── [id]/page.tsx            [MODIFY — read-only mode for issued status]
│   │   └── settings/
│   │       ├── business-profile/page.tsx [existing]
│   │       └── hs-codes/
│   │           └── page.tsx             [NEW — HS Code Master management page]
│   └── api/
│       ├── hs-codes/
│       │   └── master/
│       │       ├── route.ts             [NEW — GET list, POST pin]
│       │       └── [id]/route.ts        [NEW — DELETE unpin]
│       ├── invoices/
│       │   └── [id]/route.ts            [MODIFY — add immutability guard]
│       └── settings/
│           └── business-profile/route.ts [existing — no change]
├── components/
│   ├── invoices/
│   │   └── HSCodeSearch.tsx             [MODIFY — query master list first, fallback to FBR ref]
│   ├── settings/
│   │   └── HSCodeMasterManager.tsx      [NEW — add/remove pinned HS codes]
│   └── ui/                              [NEW — shared design tokens and cards]
│       ├── Card.tsx
│       ├── MetricCard.tsx               [supersedes dashboard/MetricCard.tsx]
│       └── StatusBadge.tsx
├── lib/
│   ├── auth.ts                          [MODIFY — add user.create.after hook for business profile]
│   ├── db/
│   │   └── schema/
│   │       ├── hs-code-master.ts        [NEW — hs_code_master table + types]
│   │       └── index.ts                 [MODIFY — export new schema]
│   ├── fbr/
│   │   └── api-client.ts                [MODIFY — accept userId, resolve token from business profile]
│   └── hs-codes/
│       └── master-service.ts            [NEW — CRUD for hs_code_master]

tests/
├── unit/
│   ├── draft-fix.test.ts                [NEW — verify no auto-recovery on form mount]
│   ├── hs-master.test.ts                [NEW — HS master CRUD]
│   ├── immutability.test.ts             [NEW — issued invoice mutation guard]
│   └── fbr-token-resolution.test.ts    [NEW — per-user token decryption]
└── e2e/
    ├── draft-workflow.spec.ts           [NEW — no popup, save draft, draft page CRUD]
    ├── hs-code-master.spec.ts           [NEW — pin/unpin, search autocomplete]
    ├── business-profile.spec.ts         [NEW — signup → auto-create profile]
    └── dashboard.spec.ts               [existing, extend — date range filter]
```

**Structure Decision**: Web application (Next.js App Router). Frontend and API routes colocated in `src/app/`. Service layer in `src/lib/`. Tests in `tests/unit/` (Vitest) and `tests/` root for e2e (Playwright). This matches the existing structure precisely — no new directories at the root level.

---

## Implementation Phases

### Phase 1 — Critical Bug Fix: Draft Popup (Priority: Immediate)

**Target**: FR-015, FR-019. Resolves the most visible user-facing bug.

**Root cause**: `invoice-form-client.tsx` lines 104–122 call `listDrafts(organizationId)` on mount and set `showDraftRecovery = true` whenever IndexedDB has any drafts. Since IndexedDB persists across sessions, new invoice creation always triggers the popup.

**Fix**: Remove the `useEffect` that calls `listDrafts` on mount. Remove `showDraftRecovery`, `availableDrafts`, `handleRestoreDraft`, `handleDiscardDrafts` state and handlers from `InvoiceFormClient`. Remove IndexedDB auto-save `debouncedSaveDraft`. Keep the manual "Save Draft" handler but wire it to POST `/api/invoices` with `status: 'draft'` instead of IndexedDB.

**Files modified**:
- `src/app/(dashboard)/invoices/invoice-form-client.tsx` — remove lines 84–182 (draft recovery block)

**Test**: Open `/invoices/new` — no popup. Existing draft data in IndexedDB does not appear.

---

### Phase 2 — Business Profile Auto-Create at Signup

**Target**: FR-004. Ensures profile always exists before invoice creation.

**Implementation**: In `src/lib/auth.ts`, add `databaseHooks`:
```typescript
databaseHooks: {
  user: {
    create: {
      after: async (user) => {
        await upsertBusinessProfile(user.id, {});
      },
    },
  },
},
```

**Files modified**:
- `src/lib/auth.ts` — add databaseHooks block

**Test**: Register new user → navigate to `/invoices/new` → seller fields should attempt to load (profile exists, fields blank).

---

### Phase 3 — HS Code Master Table

**Target**: FR-001, FR-002, FR-003, SC-002.

**Steps**:
1. Create `src/lib/db/schema/hs-code-master.ts` with Drizzle table definition
2. Export from `src/lib/db/schema/index.ts`
3. Run `npm run db:push` (or `db:generate` + `db:migrate`)
4. Create `src/lib/hs-codes/master-service.ts` with CRUD functions
5. Create `src/app/api/hs-codes/master/route.ts` (GET list, POST pin)
6. Create `src/app/api/hs-codes/master/[id]/route.ts` (DELETE unpin)
7. Create `src/app/(dashboard)/settings/hs-codes/page.tsx` (management UI)
8. Create `src/components/settings/HSCodeMasterManager.tsx`
9. Modify `src/components/invoices/HSCodeSearch.tsx` — query master list first (instant, no min-char limit), then fall back to FBR reference API search (min 3 chars)

**Files created**: 5 new files
**Files modified**: 2 existing files

**Test**: Pin 5 HS codes → open invoice → type in HS code field → pinned codes appear immediately; FBR API results appear below.

---

### Phase 4 — Draft Page: Search, Filter, Convert

**Target**: FR-017, FR-018.

**Steps**:
1. Convert `src/app/(dashboard)/invoices/drafts/page.tsx` from pure server component to server shell + `DraftsClient.tsx`
2. Pass drafts + search params from server → client
3. Implement client-side filter by buyer name (string match) and date range (compare `invoiceDate`)
4. Add "Search" input and "From/To date" inputs above the draft table
5. Add "Convert to Final" button → navigates to `/invoices/[id]` with a `ready=true` param that pre-selects submit action

**Files created**: `DraftsClient.tsx`
**Files modified**: `drafts/page.tsx`

**Test**: Create 3 drafts with different buyers → search by partial name → only matching drafts visible.

---

### Phase 5 — Invoice Immutability Guard

**Target**: FR-014, FR-033, SC-008.

**Steps**:
1. In `src/app/api/invoices/[id]/route.ts`, add guard in PATCH/PUT handler:
   ```typescript
   if (['issued', 'submitting'].includes(invoice.status)) {
     return NextResponse.json({ error: 'Invoice is immutable', code: 'INVOICE_IMMUTABLE' }, { status: 409 });
   }
   ```
2. In the invoice detail page (`src/app/(dashboard)/invoices/[id]/page.tsx`), render form as read-only when `status === 'issued'`

**Files modified**: 2 existing files

**Test**: Submit an invoice to FBR (sandbox) → attempt to edit it → API returns 409; form shows read-only view.

---

### Phase 6 — FBR Per-User Token Resolution

**Target**: FR-007, FR-027.

**Steps**:
1. Update `src/lib/fbr/api-client.ts` to accept optional `userId` parameter
2. When `userId` is provided, fetch `businessProfiles.fbrTokenEncrypted` and decrypt
3. Fall back to `process.env.FBR_API_TOKEN` if no user token stored
4. Update `src/app/api/fbr/submit/route.ts` and `src/app/api/fbr/validate/route.ts` to pass `userId` from session to the FBR client

**Files modified**: 3 existing files

**Test**: Set user FBR token in Business Settings → submit invoice → verify submission uses user token (not env var).

---

### Phase 7 — UI Modernization

**Target**: FR-034, FR-035, FR-036.

**Approach**: Apply Tailwind 4 custom properties for design tokens. Update global CSS in `src/app/globals.css`. Refactor page layouts in order: dashboard → invoice form → drafts page → settings → auth pages.

**Design tokens**:
- Background: `#f8fafc` (slate-50)
- Card: white, `rounded-2xl`, `shadow-sm`, `border border-slate-100`
- Primary: `indigo-600` for CTAs
- Positive metric: `emerald-500`
- Warning: `amber-500`
- Error: `red-500`
- Text primary: `slate-900`
- Text secondary: `slate-500`
- Transition: `transition-all duration-200`

**Files modified**: `globals.css` + page/component files per route

---

### Phase 8 — Full Testing Suite

**Target**: FR-037, FR-038, FR-039, FR-040.

**Unit tests** (Vitest):
- `draft-fix.test.ts` — mount form, verify no auto-recovery triggered
- `hs-master.test.ts` — CRUD service functions with mocked DB
- `immutability.test.ts` — API handler rejects edits on issued invoices
- `fbr-token-resolution.test.ts` — decrypt user token, fallback to env var

**E2E tests** (Playwright):
- `draft-workflow.spec.ts` — new invoice (no popup), save draft, drafts page CRUD, search
- `hs-code-master.spec.ts` — pin HS codes, see in dropdown, unpin
- `business-profile.spec.ts` — register → profile auto-created → invoice auto-fills
- `dashboard.spec.ts` (extend) — date range filter changes metrics accurately

**Coverage target**: 80% on new unit logic per constitution.

---

## Risk Analysis

| Risk | Blast Radius | Mitigation |
|------|-------------|-----------|
| Removing IndexedDB draft recovery breaks users with existing drafts | Medium — users lose browser-local draft data | Show one-time banner on `/invoices/new` advising to check Drafts page; existing server-side drafts (in `invoices` table) remain intact |
| Per-user FBR token migration breaks existing sandbox usage | Low — only affects FBR submission path | Fall back to `FBR_API_TOKEN` env var when user has no stored token; behavior is backwards-compatible |
| `hs_code_master` migration fails on Neon | Low | `db:push` is idempotent; test in dev before prod; rollback by dropping table (no data loss — new table) |

---

## Non-Goals (Out of Scope)

- No FBR API schema changes (await official PDF — existing implementation is the reference)
- No multi-organization (org-level) architecture changes
- No email notification for FBR submission results
- No offline capability / PWA features
- No admin panel for global HS code management (per-user master only)
- No changes to the auth flow beyond the signup hook

---

## Definition of Done

- [ ] Zero TypeScript errors (`npm run typecheck`)
- [ ] All Vitest tests pass with ≥ 80% coverage on new code
- [ ] All Playwright e2e scenarios pass
- [ ] No draft popup on `/invoices/new` (verified manually)
- [ ] Business profile auto-created for new user (verified via DB)
- [ ] HS code master CRUD works end-to-end
- [ ] Draft search/filter functional on Drafts page
- [ ] Issued invoices reject edits (verified via API + UI)
- [ ] FBR submission uses per-user token (verified in sandbox)
- [ ] All pages pass design review for consistency
- [ ] No console errors on any page load
- [ ] All 40 FRs from spec.md traceable to implemented code or test case

---

## Complexity Tracking

No constitution violations. No complexity justification required.
