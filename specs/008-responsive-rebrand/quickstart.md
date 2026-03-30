# Quickstart: Responsive Design & TaxDigital Rebrand

**Feature**: `008-responsive-rebrand`
**Date**: 2026-02-26

## Prerequisites

- Node.js 18+ and npm installed
- Project dependencies installed: `npm install`
- Development server can start: `npm run dev`

## Running the Dev Server

```bash
npm run dev
# → App runs at http://localhost:3000
```

## How to Test Responsive Behaviour

### Browser DevTools (recommended)

1. Open Chrome/Firefox DevTools (`F12`)
2. Click the device toolbar icon (`Ctrl+Shift+M` / `Cmd+Shift+M`)
3. Test at these breakpoints:

| Device | Width | Expected behaviour |
|--------|-------|--------------------|
| iPhone SE | 375px | Sidebar hidden; hamburger in header; no horizontal scroll |
| iPhone 14 Pro | 393px | Same as above |
| iPad Mini | 768px | Sidebar shown in icon-only collapsed mode |
| iPad Pro | 1024px | Full sidebar available |
| Desktop | 1280px+ | Sidebar expand/collapse as before |

### Key Flows to Verify

**Mobile (375px)**:
1. Load `/login` → app name reads "TaxDigital"; no horizontal scroll
2. Log in → dashboard loads; sidebar hidden; hamburger visible in header top-left
3. Tap hamburger → sidebar drawer slides in from left with dark backdrop
4. Tap a nav item (e.g. "Invoices") → drawer closes; navigation works
5. Tap backdrop → drawer closes
6. Visit `/invoices` → table scrolls horizontally within its container; page does not scroll sideways
7. Visit `/invoices/new` → form is fully usable; all fields accessible

**Tablet (768px)**:
1. Sidebar renders in icon-only mode by default
2. New Invoice form shows all fields without horizontal overflow

**Brand check (any viewport)**:
1. Browser tab → reads "TaxDigital" on all pages
2. Login page logo → "TaxDigital"
3. Dashboard header → "TaxDigital"
4. Sidebar (when open) → badge "TD", label "TaxDigital"
5. Invoice print page → FBR compliance labels unchanged

## Running Type Checks

```bash
npx tsc --noEmit
```

## Running Tests

```bash
# Unit tests
npm run test:unit

# E2E tests (requires dev server running)
npm run test:e2e
```

## Files Changed in This Feature

### Brand rename (text changes only):
- `src/app/layout.tsx`
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(dashboard)/clients/page.tsx`
- `src/app/(dashboard)/invoices/drafts/page.tsx`
- `src/app/(dashboard)/invoices/new/page.tsx`
- `src/app/(dashboard)/invoices/page.tsx`
- `src/app/(dashboard)/invoices/[id]/page.tsx`
- `src/app/(dashboard)/invoices/[id]/print/page.tsx`
- `src/app/(dashboard)/settings/business-profile/page.tsx`
- `src/app/(dashboard)/settings/hs-codes/page.tsx`
- `src/components/dashboard/Header.tsx`
- `src/components/dashboard/Sidebar.tsx`
- `src/lib/email.ts`

### Responsive layout changes:
- `src/components/dashboard/DashboardShell.tsx` — mobile drawer state + backdrop
- `src/components/dashboard/Sidebar.tsx` — mobile overlay rendering
- `src/components/dashboard/Header.tsx` — hamburger button (mobile only)
- `src/app/(dashboard)/invoices/page.tsx` — table overflow wrapper
- `src/app/(dashboard)/invoices/drafts/page.tsx` — table overflow wrapper
- `src/app/(dashboard)/clients/page.tsx` — table overflow wrapper
- `src/app/(dashboard)/invoices/invoice-form-client.tsx` — responsive layout adjustments
- `src/app/(dashboard)/invoices/[id]/page.tsx` — responsive layout adjustments
