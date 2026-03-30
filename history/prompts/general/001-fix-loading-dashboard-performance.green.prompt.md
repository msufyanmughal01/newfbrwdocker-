---
id: 001
title: Fix Dashboard Loading Performance
stage: green
date: 2026-02-22
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 007-sidebar-toggle
user: System Inn
command: manual
labels: ["performance", "loading", "server-components", "streaming", "next.js", "dashboard"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/app/(dashboard)/loading.tsx
  - src/app/(dashboard)/dashboard/page.tsx
  - src/app/(dashboard)/dashboard/DashboardContent.tsx
tests:
  - npm run typecheck (zero errors in src/)
  - npm run lint (zero issues in changed files)
---

## Prompt

fix the loading issue and add loading.tsx

## Response snapshot

Fixed the dashboard loading waterfall and added Next.js streaming support with three file changes:

**1. NEW `src/app/(dashboard)/loading.tsx`**
- Skeleton UI shown immediately on navigation to any dashboard page (Next.js streaming)
- Matches dashboard visual style using CSS variables
- Includes skeleton for page title, 4 metric cards, and chart area
- Covers all pages in the `(dashboard)` route group

**2. MODIFIED `src/app/(dashboard)/dashboard/page.tsx`**
- Moved `getDefaultDates()` helper from DashboardContent to server side
- Added `getDashboardMetrics()` and `getRevenueTrend()` calls using `Promise.all()` server-side
- Passes `initialMetrics`, `initialTrend`, `initialFrom`, `initialTo` as props to DashboardContent
- Eliminates the client-side fetch waterfall on initial page load

**3. MODIFIED `src/app/(dashboard)/dashboard/DashboardContent.tsx`**
- Added `DashboardContentProps` interface with initial data props
- State now initializes from server-loaded props (no blank/loading initial state)
- Added `useRef(true)` flag to skip `useEffect` on mount (data already present)
- `useEffect([from, to])` only fires when user changes the date range
- Imported `DashboardMetrics` and `TrendDataPoint` types from `@/lib/analytics/dashboard-metrics`
- Removed `useState(null)` initial null states replaced with real typed initial data

**Before**: User navigates → blank screen → JS hydrates → useEffect → API call → data renders (2+ round trips)
**After**: User navigates → loading.tsx skeleton → server fetches data → full page streams with data (0 client-side round trips on initial load)

## Outcome

- ✅ Impact: Dashboard initial load no longer has client-side fetch waterfall; loading skeleton shows immediately on navigation
- 🧪 Tests: typecheck (zero errors in src/), lint (zero issues in changed files)
- 📁 Files: loading.tsx (new), page.tsx (modified), DashboardContent.tsx (modified)
- 🔁 Next prompts: Visual verification after login; consider similar pattern for other pages
- 🧠 Reflection: The useRef guard to skip first useEffect render is the key pattern for hybrid server/client data loading. The loading.tsx approach requires zero code changes to individual pages.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): typecheck PASS | lint PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Add unstable_cache() to getDashboardMetrics for repeat visits within same deployment
