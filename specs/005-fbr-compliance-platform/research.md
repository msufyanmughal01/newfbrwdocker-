# Research: FBR Compliance Platform — Phase 0

**Branch**: `005-fbr-compliance-platform` | **Date**: 2026-02-19

---

## Codebase Gap Analysis

### Confirmed Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.x |
| Database | Neon PostgreSQL + Drizzle ORM | drizzle-orm 0.45 |
| Auth | better-auth | 1.4.18 |
| Forms | react-hook-form + zod | 7.x + 4.x |
| Styling | Tailwind CSS | 4.x |
| Charts | recharts | 3.x |
| Testing (unit) | Vitest | 4.x |
| Testing (e2e) | Playwright | 1.x |
| FBR Token Security | AES-256-GCM (Node crypto) | built-in |
| Email | Resend | 6.x |
| Draft Client Store | idb (IndexedDB wrapper) | 8.x |

---

## Decision 1: Draft Storage Architecture

**Problem**: Two draft systems currently coexist:
- **IndexedDB** (client-side via `src/lib/invoices/draft-storage.ts`) — used by `invoice-form-client.tsx` with `listDrafts()` triggering the popup on load
- **Server-side** (`invoices` table with `status = 'draft'`) — used by the Drafts page (`/invoices/drafts`)

The IndexedDB path is the root cause of the draft popup bug on New Invoice: `useEffect` on mount calls `listDrafts()`, finds existing drafts, sets `showDraftRecovery = true`.

**Decision**: Migrate to server-side drafts exclusively. Remove IndexedDB draft recovery from `invoice-form-client.tsx`. Drafts are saved to the `invoices` table via API. The `/invoices/drafts` page remains the single source of truth.

**Rationale**: Server-side drafts are consistent across devices, browser sessions, and after cache clears. IndexedDB is fragile (cleared by browser, not shared between devices), violates Principle IX (data integrity), and causes the popup bug.

**Alternatives Considered**:
- Keep IndexedDB + fix popup: Treating symptom not cause; data integrity compromised.
- Keep both in sync: Unnecessary complexity, violates Principle III (Simplicity).

---

## Decision 2: HS Code Master Table

**Problem**: The existing `GET /api/fbr/reference/hs-codes` searches FBR's reference cache (`fbr_reference_cache` table, populated from FBR API). This is not user-manageable — users cannot add, edit, or pin frequently used HS codes.

**Decision**: Introduce a `hs_code_master` table — a user-scoped pinned/curated list of HS codes. The HS code search first checks user's master list, then falls back to FBR reference cache. The "HS Code Master" management page allows users to add/remove from their pinned list.

**Rationale**: FBR's reference data has thousands of HS codes. Users work with ~5–20 codes regularly. A personal master list enables instant access (SC-002: under 300ms). This is additive — existing FBR reference search remains intact.

**Alternatives Considered**:
- Replace FBR reference with static seeded table: Loses FBR's authoritative data; maintenance burden.
- No master table, just search FBR reference faster: Cannot guarantee sub-300ms without client-side cache; no user control.

---

## Decision 3: Business Profile Auto-Create at Signup

**Problem**: Business profile is created lazily (when user visits the Business Settings page). Spec requires auto-creation at signup.

**Decision**: Hook into better-auth's `afterSignUp` callback (or equivalent) to call `upsertBusinessProfile(userId, {})` server-side immediately after user creation.

**Research finding**: better-auth supports `databaseHooks` in the auth config (`src/lib/auth.ts`). The `user.create.after` hook fires after a user record is created.

**Rationale**: Ensures business profile always exists before any invoice is attempted. Eliminates null-checks in the invoice form. Aligns with FR-004.

---

## Decision 4: Invoice Status Alignment

**Problem**: Current `invoiceStatusEnum` is `draft | validating | validated | submitting | issued | failed`. The spec uses `Draft | Active | Submitted | Finalized`.

**Decision**: Map spec terms to existing DB values without a breaking schema change:

| Spec Term | DB Status | Meaning |
|-----------|-----------|---------|
| Draft | `draft` | Saved but not submitted |
| Active | `validated` | Passed FBR validation, ready to submit |
| Submitted | `issued` | Successfully submitted; IRN received |
| Finalized | `issued` | Same as Submitted for this platform (FBR has no "finalize" step) |
| Failed | `failed` | FBR submission rejected |

The intermediate statuses (`validating`, `submitting`) are internal lifecycle states, not user-facing. The UI shows simplified labels.

**Rationale**: Avoids a destructive migration while aligning user-facing language with spec. Minimizes blast radius (Principle III).

---

## Decision 5: Draft Search & Filter

**Problem**: The Drafts page (`src/app/(dashboard)/invoices/drafts/page.tsx`) lists all drafts but has no search or filter UI.

**Decision**: Convert the Drafts page from a pure server component to a server component shell + client component (`DraftsClient.tsx`) that supports:
- Search by buyer name (client-side filter on loaded data, max 100 records)
- Date filter (passes `from`/`to` query params to server)

For larger datasets, server-side filtering via Drizzle query params. Start with client-side filter (simpler, sufficient for typical draft counts).

---

## Decision 6: Immutability Enforcement for Submitted Invoices

**Problem**: No server-side guard currently prevents edits to `issued` invoices.

**Decision**: In all `PATCH`/`PUT` handlers for `/api/invoices/[id]`, add a guard:
```
if (invoice.status === 'issued' || invoice.status === 'submitting') → 409 Conflict
```
Also apply in the invoice detail page — the edit form renders as read-only when status is `issued`.

---

## Decision 7: UI Modernization Strategy

**Decision**: Introduce a design token system via Tailwind CSS custom config:
- Primary color: Indigo/violet-based gradient (`indigo-600` → `violet-600`)
- Accent: Emerald for positive metrics, Amber for warnings, Red for errors
- Card: White background, `shadow-md`, rounded-2xl, 1px border (`gray-100`)
- Typography: Inter (already default), consistent size scale

Modernization happens incrementally: dashboard first (highest visibility), then invoice form, then settings, then auth pages.

**Rationale**: Tailwind 4 supports CSS custom properties natively. No new dependencies needed.

---

## Decision 8: Convert Draft to Final Invoice Action

**Problem**: Drafts page shows "Resume" (navigates to edit), but no "Convert to Final" shortcut.

**Decision**: Add a "Submit to FBR" button on the draft row that:
1. Navigates user to the draft invoice view (`/invoices/[id]`)
2. Triggers FBR submission directly

Alternatively: a "Mark as Ready" action that changes status from `draft` → `validated`, moving it from Drafts to Active Invoices list without FBR submission (for cases where user wants to finalize data first).

**Decision**: Keep it simple — "Resume" (continue editing) + "Delete". "Submit" happens from within the invoice form/detail view. This avoids confusion about what "Convert to Final" means without FBR submission context.

---

## Decision 9: FBR API Integration Status

**Current state**: FBR API client (`src/lib/fbr/api-client.ts`) exists with:
- Sandbox + production environment switching
- Bearer token from env var
- POST `/di_data/v1/di` submit path
- Validate + post routes exist

**Gap**: The current integration uses `FBR_API_TOKEN` from env, not the per-user `fbrTokenEncrypted` from business profile. This means all users share one FBR token.

**Decision**: Migrate FBR API calls to use the authenticated user's business profile token (decrypt from `businessProfiles.fbrTokenEncrypted`). The env-var token remains as system-level fallback only. FR-007 and FR-027 require per-user token isolation.

---

## Unknowns Resolved

| Unknown | Resolution |
|---------|-----------|
| FBR API PDF schema | Existing `api-client.ts` has the endpoints. Per spec constraint, full schema must await official PDF before Phase 5 changes. Current implementation is the reference baseline. |
| Auto-save debounce strategy | Remove IndexedDB auto-save. Server-side save on explicit user action only (manual "Save Draft" button). No auto-save to server to avoid excessive DB writes. |
| Logo storage path | `logoPath` varchar in `business_profiles` table; files stored as static assets in `/public/uploads/` or via Next.js file handling. Current `/api/settings/business-profile/logo` route exists. |
| Signup hook mechanism | `better-auth` `databaseHooks.user.create.after` callback in `src/lib/auth.ts` |
| Decimal precision for money | Already `decimal(15,2)` in schema — correct per Constitution Principle IX |
