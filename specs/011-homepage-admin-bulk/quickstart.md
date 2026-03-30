# Quickstart: TaxDigital Platform Overhaul

**Branch**: `011-homepage-admin-bulk` | **Date**: 2026-03-25

---

## Prerequisites

All dependencies already installed. No `npm install` needed.

- `next-themes` ^0.4.6 — theme provider (already used)
- `xlsx` ^0.18.5 — Excel parsing and generation (already used)
- `vitest` ^4.0.18 — test runner

## Environment Variables Required

```env
ADMIN_SECRET_KEY=<your-admin-key>          # used by admin routes
BETTER_AUTH_URL=http://localhost:3000      # used by verify-ntns internal call
```

## Files to CREATE (new)

```
src/components/home/ContactForm.tsx        # "use client" contact form island
src/app/api/bulk-invoices/verify-ntns/route.ts  # new NTN verification step
```

## Files to REWRITE (complete replacement)

```
src/app/page.tsx                           # premium landing page (keep server component)
src/app/(dashboard)/invoices/bulk/bulk-client.tsx  # 4-step workflow client component
src/app/admin/admin-client.tsx             # password generation + CSS variable styles
src/app/api/admin/create-user-secret/route.ts  # accept password from body
```

## Files to MODIFY (targeted edits)

```
src/app/(auth)/login/page.tsx             # remove "Don't have an account?" link
src/app/(auth)/register/page.tsx          # redirect to /login (server redirect)
src/app/api/bulk-invoices/upload/route.ts  # add xlsx/xls parsing
src/app/api/bulk-invoices/submit/route.ts  # filter by ntnVerified === true
```

## Files CONFIRMED UNCHANGED

```
src/components/ThemeProvider.tsx           # already defaultTheme="light"
src/app/layout.tsx                        # already suppressHydrationWarning
src/components/dashboard/Sidebar.tsx      # Bulk Upload link already present
src/app/(dashboard)/invoices/page.tsx     # Bulk Upload button already present
src/app/api/auth/                         # NEVER TOUCH
src/lib/fbr/post-invoice.ts              # NEVER TOUCH
src/lib/db/schema/ (tables)              # no schema changes needed
```

## Running Tests

```bash
npm run test          # runs vitest
npx vitest run        # one-shot run (no watch)
npx tsc --noEmit      # TypeScript check (zero errors required)
```

## Local Development

```bash
npm run dev           # starts Next.js with Turbopack on :3000
```

## Verification Sequence (after implementation)

1. `npx tsc --noEmit` → 0 errors
2. `npx eslint src --ext .ts,.tsx --max-warnings 0` → 0 warnings
3. `npx vitest run` → all pass
4. Manual: visit `/` → see landing page (not dark mode)
5. Manual: visit `/admin?key=<KEY>` → admin panel with generate-password flow
6. Manual: visit `/invoices/bulk` → 4-step workflow with template download
