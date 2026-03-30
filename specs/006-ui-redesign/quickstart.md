# Quickstart: Premium UI Redesign Development Guide

**Feature**: `006-ui-redesign` | **Branch**: `006-ui-redesign` | **Date**: 2026-02-21

---

## Prerequisites

- Node.js 18+
- Branch `006-ui-redesign` checked out
- `.env.local` configured with DB connection and auth secrets

---

## Step 1: Install next-themes

```bash
npm install next-themes
```

Verify it's in `package.json` dependencies before proceeding.

---

## Step 2: Start Development Server

```bash
npm run dev
```

Open `http://localhost:3000`. You'll see the current dark-only UI. After implementing changes, use the theme toggle in the header to test both modes.

---

## Step 3: Implementation Order (Critical)

Follow this order exactly. Each step builds on the previous:

### Layer 1: Foundation (do first, blocks everything else)

1. Rewrite `src/app/globals.css` with the new design system
2. Create `src/components/ThemeProvider.tsx`
3. Update `src/app/layout.tsx` (ThemeProvider + DM Sans + suppressHydrationWarning)
4. Create `src/components/ThemeToggle.tsx`

**Verify**: Open app → should still render (dark mode, DM Sans font visible). No console errors.

### Layer 2: Core Shell

5. Rewrite `src/components/dashboard/Sidebar.tsx` (SVG icons, CSS vars, 240px)
6. Rewrite `src/components/dashboard/Header.tsx` (ThemeToggle included, 56px height)
7. Rewrite `src/components/dashboard/MetricCard.tsx` (hover lift, CSS vars)
8. Update `src/app/(auth)/layout.tsx` (CSS vars, theme-aware)

**Verify**: Click ThemeToggle → full interface should switch modes. Sidebar, header, cards all change.

### Layer 3: Auth Components

9. `src/components/auth/LoginForm.tsx`
10. `src/components/auth/RegisterForm.tsx`
11. `src/components/auth/ForgotPasswordForm.tsx`
12. `src/components/auth/ResetPasswordForm.tsx`
13. `src/components/auth/SetupOrganizationForm.tsx`
14. `src/components/auth/SocialLoginButton.tsx`

**Verify**: Visit `/login` in both modes. Inputs should be visible, buttons styled, no white/gray artifacts.

### Layer 4: Invoice Components (highest complexity)

15. `src/components/invoices/InvoiceStatusBadge.tsx` (update semantic colors)
16. `src/components/invoices/LineItemRow.tsx`
17. `src/components/invoices/LineItemsTable.tsx`
18. `src/components/invoices/BuyerSearch.tsx`
19. `src/components/invoices/ClientSearch.tsx`
20. `src/components/invoices/HSCodeSearch.tsx`
21. `src/components/invoices/InvoiceHeader.tsx`
22. `src/components/invoices/InvoiceSummary.tsx`
23. `src/components/invoices/NTNVerifier.tsx`
24. `src/components/invoices/SubmissionStatus.tsx`
25. `src/components/invoices/FBRErrorDisplay.tsx`
26. `src/components/invoices/DraftIndicator.tsx`
27. `src/app/(dashboard)/invoices/invoice-form-client.tsx` (largest file)

### Layer 5: Client & Settings Components

28. `src/components/clients/ClientsTable.tsx`
29. `src/components/clients/ClientFormModal.tsx`
30. `src/components/settings/BusinessProfileForm.tsx`
31. `src/components/settings/HSCodeMasterManager.tsx`

### Layer 6: Dashboard Components

32. `src/components/dashboard/DateRangePicker.tsx`
33. `src/components/dashboard/RevenueTrendChart.tsx`

### Layer 7: All Pages

34. `src/app/(dashboard)/dashboard/page.tsx`
35. `src/app/(dashboard)/invoices/page.tsx`
36. `src/app/(dashboard)/invoices/drafts/page.tsx`
37. `src/app/(dashboard)/invoices/drafts/DraftsClient.tsx`
38. `src/app/(dashboard)/invoices/drafts/DraftDeleteButton.tsx`
39. `src/app/(dashboard)/invoices/[id]/page.tsx`
40. `src/app/(dashboard)/invoices/[id]/print/page.tsx`
41. `src/app/(dashboard)/invoices/new/page.tsx`
42. `src/app/(dashboard)/clients/page.tsx`
43. `src/app/(dashboard)/members/page.tsx` (if it has hardcoded classes)
44. `src/app/(dashboard)/settings/business-profile/page.tsx`
45. `src/app/(dashboard)/settings/hs-codes/page.tsx`
46. `src/app/(dashboard)/settings/settings-client.tsx`
47. `src/app/(auth)/login/page.tsx`
48. `src/app/(auth)/register/page.tsx`
49. `src/app/(auth)/forgot-password/page.tsx`
50. `src/app/(auth)/reset-password/page.tsx`
51. `src/app/(auth)/setup-organization/page.tsx`

---

## Verification Commands

### Check for hardcoded color classes
```bash
grep -rn "bg-white\|text-gray-\|border-gray-\|bg-gray-\|from-slate-\|bg-blue-\|text-blue-" \
  src/components src/app \
  --include="*.tsx"
```
Expected: 0 matches (excluding `fill="..."` SVG attributes).

### TypeScript compilation
```bash
npm run typecheck
```
Expected: exits with 0 errors.

### Build check
```bash
npm run build
```
Expected: successful build, no errors.

---

## Design System Quick Reference

### Copy-paste patterns for common elements:

**Card container**:
```tsx
<div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow)] p-6">
```

**Input field**:
```tsx
<input className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors" />
```

**Primary button**:
```tsx
<button className="rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 font-medium transition-all hover:-translate-y-px hover:shadow-lg">
```

**Ghost button**:
```tsx
<button className="rounded-lg border border-[var(--border)] bg-transparent hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] px-4 py-2 transition-colors">
```

**Section label**:
```tsx
<label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
```

**Page header**:
```tsx
<div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold text-[var(--foreground)]">Page Title</h1>
  <button className="...primary button...">Action</button>
</div>
```

**Table container**:
```tsx
<div className="rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)]">
  <table className="w-full text-sm">
    <thead>
      <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
```

**Status badge**:
```tsx
// Draft
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--surface-3)] text-[var(--foreground-muted)]">
  <span className="w-1.5 h-1.5 rounded-full bg-[var(--foreground-subtle)]" />
  Draft
</span>

// Success (issued/validated)
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--positive-bg)] text-[var(--positive)]">
  <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive)]" />
  Issued
</span>

// Error (failed)
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--error-bg)] text-[var(--error)]">
  <span className="w-1.5 h-1.5 rounded-full bg-[var(--error)]" />
  Failed
</span>
```

---

## Testing Both Modes

1. Open `http://localhost:3000/dashboard` in browser
2. Click the sun/moon icon in the header to toggle modes
3. Visually check every page and component in both modes
4. Open browser DevTools → check for console errors
5. Verify no white boxes or invisible text in either mode

---

## Do Not Touch

These files must NOT be modified:
- Anything in `src/lib/`
- Anything in `src/app/api/`
- `src/lib/db/schema/**`
- Auth configuration files
- `src/middleware.ts`
- All test files
