---
name: Fix logout/invoice errors and modernize invoice form
description: Diagnosed logout bug (wrong redirect), fixed FBR submit bugs (useCount, failed state), modernized invoice creation form UI
type: general
stage: general
date: 2026-04-04
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
labels: ["bugfix", "ui", "invoice", "auth", "fbr"]
---

## Prompt

check the smalls errors that why i be logout and the what the error while submit the invoice ? and change to modren the form of invoice creation

## Response

### Bugs Found & Fixed

**1. Logout bug — wrong redirect in `new/page.tsx`**
- `redirect('/sign-in')` → `redirect('/login')`
- `/sign-in` does not exist; unauthenticated users hitting `/invoices/new` were redirected to a 404, which appeared as a logout

**2. `useCount: db.$count(buyerRegistry)` bug in `fbr/submit/route.ts`**
- `db.$count()` returns a Drizzle SQL expression, not a number
- Fixed: `sql\`${buyerRegistry.useCount} + 1\``
- Also added `sql` to drizzle-orm imports

**3. Failed status transition error in `fbr/submit/route.ts`**
- `failed → validating` is not an allowed transition in the status machine
- Fixed: if invoice status is `failed`, reset to `draft` first before transitioning to `validating`

**4. `alert()` in `LineItemsTable.tsx`**
- Replaced `alert('At least one line item is required')` with inline toast-style error badge

### Form Modernization

**`invoice-form-client.tsx`**
- Two-column layout: form on left, sticky sidebar (summary + actions) on right at xl breakpoint
- Numbered section badges (1, 2) in card headers with `rounded-2xl` cards
- Removed emoji buttons, clean text labels
- Error alerts use icon badges with proper color tokens
- Actions card in sticky sidebar: primary Submit, grid of Save Draft / Clear

**`InvoiceHeader.tsx`**
- Extracted `SectionHeader`, `FieldLabel`, `FieldError`, `FieldHint` helper components
- Consistent `inputNormal` / `inputError` class strings (no repetition)
- Section dividers with color accent bar + uppercase label
- Font mono on NTN/CNIC and reference number fields
- Radio buttons use `accent-[var(--primary)]`

## Files Modified

 - src/app/(dashboard)/invoices/new/page.tsx
 - src/app/api/fbr/submit/route.ts
 - src/app/(dashboard)/invoices/invoice-form-client.tsx
 - src/components/invoices/InvoiceHeader.tsx
 - src/components/invoices/LineItemsTable.tsx
