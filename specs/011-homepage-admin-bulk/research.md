# Research: TaxDigital Platform Overhaul — Phase 0 Findings

**Branch**: `011-homepage-admin-bulk` | **Date**: 2026-03-25

---

## Summary of Discoveries

### TASK 1 — Default Theme

**Decision**: Theme is ALREADY set to light mode.

`ThemeProvider.tsx` already has `defaultTheme="light"` and `enableSystem={false}`. The `layout.tsx` already has `suppressHydrationWarning` on the `<html>` element. **No change needed to the theme default.** The only theme-related issue is the admin client using hardcoded dark colors (corrected in Task 3).

---

### TASK 2 — Home Page

**Current state**: `src/app/page.tsx` exists with a basic landing page that has:
- A navbar with "Register" and "Sign In" links (needs "Contact Us" + "Sign In" only)
- A hero section without stats row, "Book a Demo Call" button, or announcement pill
- Features section (no "How It Works", no contact form, no footer with copyright/links)

**Required**: Complete replacement with the specified 7-section premium landing page.

**Architecture decision**: The ContactForm will be a `"use client"` component in `src/components/home/ContactForm.tsx` (a new directory), imported into the server component `page.tsx`. This follows Next.js App Router patterns for mixing server and client components.

**CSS variables available** (verified from `globals.css`):
- Structural: `--bg`, `--bg-subtle`, `--surface`, `--surface-2`, `--surface-3`, `--border`, `--border-strong`
- Text: `--foreground`, `--foreground-muted`, `--foreground-subtle`
- Brand: `--primary`, `--primary-hover`, `--primary-fg`, `--primary-subtle`
- Status: `--positive`, `--positive-bg`, `--warning`, `--warning-bg`, `--error`, `--error-bg`, `--info`, `--info-bg`
- Effects: `--shadow`, `--shadow-sm`, `--shadow-lg`, `--bg-subtle-glass`

**Missing variable**: `--background` (used in current page.tsx) → correct name is `--bg`. Plan uses `--bg` not `--background`.

---

### TASK 3 — Admin Password Management

**Current state**:
- `src/app/api/admin/create-user-secret/route.ts` generates a password server-side and returns `{ credentials: { userId, name, email, tempPassword } }`.
- `src/app/admin/admin-client.tsx` sends `{ name, email, adminKey }` (no password field), displays `credentials.tempPassword`.
- The admin client uses **hardcoded dark mode colors** (e.g., `background: "#0a0a0a"`) — NOT CSS variables.

**Required changes**:
1. **API route**: Accept `password` from request body; skip `generateTempPassword()`; validate `password.length >= 8`; return `{ credentials: { name, email, password } }` (no userId in the spec).
2. **Admin client**: Add `password` state, `showPassword` state; add "Generate Password" button with inline generation logic; rename `credentials.tempPassword` → `credentials.password`; remove hardcoded colors (use CSS variables).

**Interface change**: `CreatedCredentials.tempPassword` → `password` (breaking rename within admin-client.tsx).

---

### TASK 4 — Bulk Invoice 4-Step Workflow

**Critical schema findings**:
- Table: `bulkInvoiceBatches` (plural) — NOT `bulkInvoiceBatch`
- Data column: `rows` (jsonb) — NOT `invoices`
- Row type uses: `buyerBusinessName`, `buyerNTNCNIC`, `buyerProvince`, etc. (snake_case style) — NOT `BuyerNTN`, `BuyerName` etc.

**Critical NTN verify-ntn API findings**:
- Route: `POST /api/fbr/verify-ntn`
- Request body: `{ ntnCnic: string }` (NOT a GET with query params)
- Response shape: `{ ntnCnic, statlStatus: 'active' | 'inactive' | 'unknown', registrationType, cached, checkedAt, warning? }`
- "Verified/registered" = `statlStatus === 'active'`
- The spec's sample `verify-ntns` code uses GET with `?ntn=` — this MUST be corrected to POST `{ ntnCnic }` in the implementation

**Upload route findings**:
- Currently only parses CSV, rejects xlsx with "Only CSV files are supported"
- Field names use camelCase: `buyerNTNCNIC`, `buyerBusinessName`, etc. (NOT `BuyerNTN`, `BuyerName`)
- Needs to be extended to parse `.xlsx` and `.xls` using the `xlsx` package (already installed: v0.18.5)
- Template columns MUST match the existing field names the upload route validates

**Bulk-client.tsx findings**:
- Currently 2-step (upload → submit directly, no NTN verification step)
- Does NOT use the `xlsx` library for template download (uses plain CSV blob)
- Needs complete rewrite as 4-step workflow

**Submit route**: Already exists at `/api/bulk-invoices/submit/route.ts`. It:
- Filters `rows` where `r.valid === true` (needs update to also filter `r.ntnVerified === true` after adding NTN step)
- Returns `{ submittedCount, failedCount, totalProcessed }`

**New verify-ntns route needed**: The spec provides sample code but with WRONG field names. The correct implementation must:
- POST to `/api/fbr/verify-ntn` with `{ ntnCnic: row.buyerNTNCNIC }` (not `BuyerNTN`)
- Check `data.statlStatus === 'active'` for verified status
- Update `rows` column (not `invoices`) in `bulkInvoiceBatches` table

**Template column mismatch**: The spec shows the template with columns `InvoiceNumber, InvoiceDate, BuyerNTN, BuyerName...` but the existing upload route validates `buyerNTNCNIC, buyerBusinessName, invoiceDate, hsCode...`. There are two options:
- Option A: Make the template match existing field names (camelCase)
- Option B: Update the upload route to also accept the new column names

**Decision: Use the existing camelCase column names** that the upload route already validates. The template download will use those names. This avoids breaking the existing upload route.

---

### TASK 5 — Cleanup and Wiring

**Sidebar**: Already has `Bulk Upload` link → `/invoices/bulk` ✓ No change needed.

**Invoices page**: Already has `Bulk Upload` button linking to `/invoices/bulk` ✓ No change needed.

**Login page**: Has `"Don't have an account? Create one"` link to `/register` → MUST BE REMOVED per spec requirement (no self-register link).

**Register page**: Shows a `RegisterForm` component — needs to redirect to `/login`. Must either make the page a server component that redirects, or replace with a `redirect('/login')` call.

---

### TASK 6 — Tests

- Test runner: **Vitest** (`"test": "vitest"` in package.json, `"vitest": "^4.0.18"`)
- No Playwright or Jest configured
- Need to run `npx vitest run` after all changes
- `xlsx` (v0.18.5) and `next-themes` (v0.4.6) already installed — no new dependencies needed

---

## Architecture Decision Points

### ADR-1: Template Column Names (bulk invoice template)
- **Decision**: Use existing camelCase field names (`buyerBusinessName`, `buyerNTNCNIC`, etc.) that the upload route already validates.
- **Rationale**: Avoids updating the upload route's field mapping. Keeps the system consistent. The spec's `InvoiceNumber`, `BuyerNTN` columns would require adding dual-name lookups to the upload validator.
- **Alternatives**: Add Pascal case aliases to upload validator — rejected as unnecessary complexity.

### ADR-2: NTN Verification in verify-ntns route
- **Decision**: Call `POST /api/fbr/verify-ntn` with `{ ntnCnic: row.buyerNTNCNIC }` per-NTN; check `statlStatus === 'active'`.
- **Rationale**: The spec sample code uses GET with query params — incorrect per actual route implementation. Must use POST.
- **Verified against**: `src/app/api/fbr/verify-ntn/route.ts` line 8 (POST handler) and `NTNVerificationResult.statlStatus` values.

### ADR-3: Submit route NTN filter
- **Decision**: Update `submit/route.ts` to filter `rows.filter(r => r.valid && r.ntnVerified === true)` instead of `rows.filter(r => r.valid)`.
- **Rationale**: After adding NTN verification step, submission must only process NTN-verified rows. Without this change, unverified rows could still be submitted if the client calls submit directly.

📋 **Architectural decision detected**: NTN-gated bulk submission — the submit route must enforce NTN verification server-side, not rely only on client-side step gating. Document reasoning and tradeoffs? Run `/sp.adr ntn-gated-bulk-submission`
