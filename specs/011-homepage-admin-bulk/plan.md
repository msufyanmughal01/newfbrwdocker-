# Implementation Plan: TaxDigital Platform Overhaul — Homepage, Admin & Bulk Invoice

**Branch**: `011-homepage-admin-bulk` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-homepage-admin-bulk/spec.md`

---

## Summary

Replace the landing page with a premium 7-section marketing page, update the admin panel to support manual password entry with a generate-and-edit workflow, add a 4-step bulk invoice workflow (download template → upload + field validate → verify FBR NTNs → submit), fix the login page to remove the self-registration link, and make the register page redirect to login. Theme is already light-mode by default — no change needed there. All CSS variables are used throughout; no hardcoded colors. Zero new dependencies required.

---

## Technical Context

**Language/Version**: TypeScript 5 + Node.js 20 (Next.js 16 App Router)
**Primary Dependencies**: Next.js 16, React 19, Drizzle ORM, better-auth, xlsx ^0.18.5, next-themes ^0.4.6, Tailwind CSS v4
**Storage**: Neon (serverless PostgreSQL) via Drizzle ORM — no schema migrations needed
**Testing**: Vitest ^4.0.18 (`npm run test`)
**Target Platform**: Web — Next.js App Router, SSR + client components
**Project Type**: Web application (Next.js monorepo with `src/` root)
**Performance Goals**: Standard SSR page loads; NTN verification calls should complete per-NTN sequentially (FBR rate-limit safe)
**Constraints**: No hardcoded colors; no auth route modifications; no schema drops; no post-invoice.ts edits
**Scale/Scope**: Single-tenant SaaS; bulk upload cap 500 rows per batch

---

## Constitution Check

*GATE: Must pass before implementation. Re-checked after Phase 1.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Clarity Above All | ✅ PASS | All new components named by purpose: `ContactForm`, `BulkInvoiceClient`, `AdminDashboardClient` |
| II. Consistency Is Mandatory | ✅ PASS | All new code uses existing CSS variable patterns, `"use client"` where needed, server components by default |
| III. Simplicity Over Complexity | ✅ PASS | No new abstractions; no new dependencies; direct fetch calls; inline styles/Tailwind as existing code uses |
| IV. Purpose-Driven Development | ✅ PASS | Every file change maps to a spec requirement |
| V. Quality Cannot Be Compromised | ✅ PASS | TypeScript strict; all existing tests must pass; tsc zero errors required |
| VI. Transparency of Changes | ✅ PASS | Changes scoped to spec requirements; no silent modifications |
| VII. Scalability of Structure | ✅ PASS | New file `src/components/home/ContactForm.tsx` follows existing component structure |
| VIII. Security Is Not Optional | ✅ PASS | Admin endpoint validates adminKey + min 8 char password; verify-ntns checks session ownership |
| IX. Data Integrity | ✅ PASS | NTN verification enforced server-side in submit route (not just client-side step gating) |
| X. Testability Is a Requirement | ✅ PASS | Vitest suite must pass; no test skipping |

**VIOLATIONS**: None. No Complexity Tracking table needed.

---

## Project Structure

### Documentation (this feature)

```text
specs/011-homepage-admin-bulk/
├── plan.md              ← This file
├── spec.md              ← Feature requirements
├── research.md          ← Phase 0 findings
├── data-model.md        ← Data structures
├── quickstart.md        ← Developer onboarding
├── contracts/
│   └── api.md           ← API contract changes
├── checklists/
│   └── requirements.md  ← Quality checklist
└── tasks.md             ← Phase 2 output (/sp.tasks — not yet created)
```

### Source Code Changes (repository root)

```text
src/
├── app/
│   ├── page.tsx                                    [REWRITE] premium landing page
│   ├── (auth)/
│   │   ├── login/page.tsx                          [MODIFY] remove self-register link
│   │   └── register/page.tsx                       [REWRITE] server redirect to /login
│   ├── admin/
│   │   └── admin-client.tsx                        [REWRITE] password gen + CSS vars
│   └── api/
│       ├── admin/
│       │   └── create-user-secret/route.ts         [REWRITE] accept password from body
│       └── bulk-invoices/
│           ├── upload/route.ts                     [MODIFY] add xlsx/xls parsing
│           ├── submit/route.ts                     [MODIFY] filter ntnVerified===true
│           └── verify-ntns/route.ts                [CREATE] new NTN verification step
└── (dashboard)/
    └── invoices/
        └── bulk/
            └── bulk-client.tsx                     [REWRITE] 4-step workflow

src/components/
└── home/
    └── ContactForm.tsx                             [CREATE] client component island
```

**Structure Decision**: Single Next.js App Router project. No new directories beyond `src/components/home/` (new subdirectory for landing page components).

---

## Complexity Tracking

No violations — no entry needed.

---

## Phase 0: Research Findings Summary

See [research.md](./research.md) for full findings. Key resolved decisions:

1. **Theme**: Already `defaultTheme="light"` — Task 1 requires NO code changes to theme files.
2. **CSS variables**: All required variables exist in `globals.css` (verified: `--bg-subtle`, `--positive-bg`, `--error-bg`, `--shadow` all present).
3. **NTN verify route**: POST `/api/fbr/verify-ntn` with `{ ntnCnic }`, returns `statlStatus: 'active' | 'inactive' | 'unknown'`. Verified = `statlStatus === 'active'`.
4. **Schema**: Table `bulkInvoiceBatches`, column `rows` (not `invoices`). Field names are camelCase (`buyerNTNCNIC`, `buyerBusinessName`).
5. **Template columns**: Must use camelCase field names matching existing upload validator.
6. **Sidebar & invoices page**: Already have Bulk Upload link/button — no changes needed.
7. **Register page**: Has full register form — must be replaced with server-side redirect.
8. **Login page**: Has "Don't have an account? Create one" link — must be removed.
9. **xlsx library**: Already installed (v0.18.5) — import directly in upload route and bulk-client.
10. **Submit route**: Must also filter `r.ntnVerified === true` server-side (security).

---

## Phase 1: Design Decisions

### Task 1 — Theme (NO CHANGE)

`ThemeProvider.tsx` already has `defaultTheme="light"` and `enableSystem={false}`. `layout.tsx` already has `suppressHydrationWarning`. **Zero code changes required.**

---

### Task 2 — Landing Page Architecture

**Pattern**: Server component (`src/app/page.tsx`) with one client island (`src/components/home/ContactForm.tsx`).

**Inline styles approach**: Existing code mixes Tailwind utility classes and `style={{ ... }}` objects. This feature follows the same pattern for complex style properties not expressible in Tailwind (gradients, specific px values from spec, etc.).

**Sections** (in order):
1. `<nav>` sticky navbar — purely JSX, no state, server-renderable
2. `<section>` hero — server JSX with CSS variable styles
3. `<section id="features">` — server JSX, map over features array
4. `<div>` how-it-works — server JSX, full-width bg
5. `<section id="contact">` — imports `<ContactForm />`
6. `<footer>` — server JSX

**ContactForm** (client island):
- States: `{ name, businessName, email, phone, message }` (form fields) + `loading`, `success`
- On submit: `setTimeout(1000)` → set success → reset fields
- "Book a Call" button: `window.open('https://calendly.com', '_blank')`

---

### Task 3 — Admin Password Management

**API route changes** (`create-user-secret/route.ts`):
- Remove `generateTempPassword()` and `generateUserId()` functions
- Accept `password` from request body
- Validate `password.length >= 8`
- Return `{ credentials: { name, email, password } }` (no userId per spec)
- Error handling: wrap `signUpEmail` in try/catch (keep existing error handling)

**Client changes** (`admin-client.tsx`):
- Add state: `password: string`, `showPassword: boolean`
- Update `CreatedCredentials` interface: `password: string` (remove `tempPassword`, `userId`)
- Add `generatePassword()` function (exact logic from spec)
- Password input row: full-width, type toggles show/hide, two buttons on right (eye icon, Generate button)
- `handleCreate`: include `password` in POST body; update credentials display to show `credentials.password`
- **Replace all hardcoded colors with CSS variables** (currently uses `#0a0a0a`, `#111111`, etc.)

**CSS variable mapping** (admin client):
```
"#0a0a0a" → "var(--bg)"
"#111111" → "var(--surface)"
"#222222" → "var(--border)"
"#1a1a1a" → "var(--surface-2)"
"#333"    → "var(--border)"
"#e5e5e5" → "var(--foreground)"
"#f5f5f5" → "var(--foreground)"
"#888"    → "var(--foreground-muted)"
"#ccc"    → "var(--foreground-muted)"
"#666"    → "var(--foreground-subtle)"
```

---

### Task 4 — Bulk Invoice 4-Step Workflow

#### Upload route changes
- Add `xlsx` import: `import * as XLSX from 'xlsx'`
- Add branch: `else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls'))` → parse with `XLSX.read(buffer)`, extract first sheet, `XLSX.utils.sheet_to_json` as `Record<string, unknown>[]`, stringify values
- Field names in template and validator remain camelCase (existing convention)
- Return shape unchanged

#### New verify-ntns route
```
POST /api/bulk-invoices/verify-ntns
1. Authenticate session
2. Load batch by id + userId (ownership check)
3. For each unique buyerNTNCNIC in field-valid rows:
   a. POST /api/fbr/verify-ntn with { ntnCnic: value }
   b. verified = response.statlStatus === 'active'
   c. message = verified ? registrationType : warning ?? "Not registered"
4. Update each row: ntnVerified, ntnMessage, and new status:
   - valid + verified → "ready"
   - valid + not verified → "ntn-failed"
5. Update batch: rows = updated, status = "verified", updatedAt = now
6. Return { success, readyCount, ntnFailedCount, rows }
```

#### Submit route changes (security hardening)
- Change filter from `r.valid` to `r.valid && r.ntnVerified === true`
- This prevents NTN-unverified rows from being submitted even if client bypasses Step 3

#### Bulk client rewrite (4-step wizard)
- **Step state machine**: `step: 1 | 2 | 3 | 4`
- **Step 1**: Download template as xlsx (use `xlsx` library dynamically imported), set step → 2 after download
- **Step 2**: Upload + validate; drag-drop zone; show validation table; set step → 3 on success
- **Step 3**: Verify NTNs; call verify-ntns; show updated table with FBR Status column; set step → 4
- **Step 4**: Show breakdown; confirm dialog; submit; show results
- Template column names (matching upload validator):
  ```
  buyerBusinessName, buyerNTNCNIC, buyerProvince, buyerAddress, buyerRegistrationType,
  invoiceDate, invoiceType, hsCode, productDescription, quantity, uom,
  valueSalesExcludingST, salesTaxApplicable, discount, rate
  ```

---

### Task 5 — Cleanup

**Login page** (`src/app/(auth)/login/page.tsx`):
- Remove the `<p>` element with "Don't have an account? Create one" link to `/register`
- Keep "Forgot password?" link (if in `LoginForm` component, already there or added)
- Keep "Back to home" link

**Register page** (`src/app/(auth)/register/page.tsx`):
- Replace the entire file with a server component that calls `redirect('/login')`
- Import `redirect` from `next/navigation`

---

### Task 6 — Tests

After all changes:
1. `npx tsc --noEmit` — fix all errors
2. `npx eslint src --ext .ts,.tsx --max-warnings 0` — fix all warnings
3. `npx vitest run` — all tests must pass

---

## Risk Analysis

| Risk | Blast Radius | Mitigation |
|------|-------------|------------|
| NTN verify-ntns uses wrong field names from spec | High — all NTN verifications return incorrect results | Verified against actual route; corrected to `buyerNTNCNIC` and `statlStatus === 'active'` |
| Submit route bypassed (no server-side NTN check) | Medium — unverified invoices submitted to FBR | Adding `r.ntnVerified === true` filter to submit route server-side |
| xlsx template column names don't match upload validator | High — all uploads fail field validation | Template uses same camelCase names the validator already checks |

---

## Definition of Done

- [ ] `src/app/page.tsx` renders full 7-section landing page; redirects to `/dashboard` when session exists
- [ ] `src/components/home/ContactForm.tsx` exists as "use client" with success state
- [ ] `src/app/admin/admin-client.tsx` has password generation + show/hide; uses CSS variables only
- [ ] `src/app/api/admin/create-user-secret/route.ts` accepts password from body; validates ≥ 8 chars
- [ ] `src/app/api/bulk-invoices/verify-ntns/route.ts` exists; checks `statlStatus === 'active'`; updates `rows` column
- [ ] `src/app/api/bulk-invoices/upload/route.ts` parses `.xlsx` and `.xls` in addition to `.csv`
- [ ] `src/app/api/bulk-invoices/submit/route.ts` filters `r.valid && r.ntnVerified === true`
- [ ] `src/app/(dashboard)/invoices/bulk/bulk-client.tsx` has 4-step wizard with step indicator
- [ ] `src/app/(auth)/login/page.tsx` has no self-register link
- [ ] `src/app/(auth)/register/page.tsx` redirects to `/login`
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npx eslint src --ext .ts,.tsx --max-warnings 0` → 0 warnings
- [ ] `npx vitest run` → all tests pass
