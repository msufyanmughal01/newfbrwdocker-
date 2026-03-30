---
id: "008"
title: Bug Fixes + Dark Glassmorphism UI Modernization
stage: green
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: 005-fbr-compliance-platform
branch: 005-fbr-compliance-platform
user: System Inn
command: Implement the following plan (Bug Fixes + Dark Glassmorphism UI Modernization)
labels: ["bug-fix","ui","dark-theme","glassmorphism","cache","fbr","security"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/lib/fbr/reference/tax-rates.ts
  - src/lib/fbr/api-client.ts
  - src/lib/fbr/reference/hs-codes.ts
  - src/app/api/fbr/reference/hs-codes/route.ts
  - src/app/globals.css
  - src/app/(auth)/layout.tsx
  - src/app/(dashboard)/layout.tsx
  - src/components/dashboard/Sidebar.tsx
  - src/components/dashboard/Header.tsx
  - src/components/dashboard/MetricCard.tsx
  - src/app/(dashboard)/dashboard/DashboardContent.tsx
  - src/app/(dashboard)/invoices/drafts/DraftsClient.tsx
  - src/app/(dashboard)/members/members-client.tsx
tests:
  - null
---

## Prompt

Implement the following plan:

# Plan: Bug Fixes + Dark Glassmorphism UI Modernization

Three bugs + full UI modernization to dark glassmorphism style.

Bug 1 — Tax rate cache key lacks userId/env — cross-user cache poisoning.
Bug 2 — HS code FBR search doesn't pass userId through the chain — silently uses shared token.
Bug 3 — Dark mode CSS tokens incomplete — resolved by Phase 2 full redesign.

Phase 2: Dark glassmorphism UI with background #0f0f1a, glass cards (rgba(255,255,255,0.05) + backdrop-blur), accents electric indigo #6366f1 + cyan #06b6d4, crisp white text. Always-on dark (no toggle).

## Response snapshot

Implemented all 3 bug fixes and full dark glassmorphism UI across 13 files:

**Bug Fix 1** — `tax-rates.ts:18`: Cache key now includes `userId`: `fbr:tax-rates:${cacheDate}:${userId ?? 'default'}` — prevents cross-user cache poisoning.

**Bug Fix 2** — Three-file chain fix:
- `api-client.ts`: `fbrGetHSCodes(userId?: string)` now passes userId to `fbrGet`
- `hs-codes.ts`: `searchHSCodes(query, userId?)` uses per-user cache key `hs_codes:${userId ?? 'default'}` and passes userId to `fbrGetHSCodes`
- `hs-codes/route.ts`: Passes `session.user.id` to `searchHSCodes`

**UI Phase 2** — Dark glassmorphism applied:
- `globals.css`: Complete redesign — dark palette tokens, glass surface system (surface-1/2/3), indigo+cyan accents, always-on dark body with radial gradient orbs, glassmorphic `.card` utility with `backdrop-filter: blur(16px)`
- `Sidebar.tsx`: Glass sidebar with `rgba(15,15,26,0.8)` + backdrop-blur, emoji nav icons, gradient logo, indigo glow on active items
- `Header.tsx`: Glass header, gradient avatar initials, ghost logout button
- `(auth)/layout.tsx`: Glassmorphic centered card with ambient glow orbs, gradient logo text
- `(dashboard)/layout.tsx`: Main area changed from `bg-gray-50` to `bg-transparent`
- `MetricCard.tsx`: Glass card with colored top-border accent per metric, dark text tokens
- `DashboardContent.tsx`: Date filter as glass surface, metric cards with accent colors, chart in glass container
- `DraftsClient.tsx`: Glass filter bar, glass table with surface-2 header, per-row hover states, glass inputs
- `members-client.tsx`: Glass invite card, glass member table, primary token replaces blue-600

No TypeScript errors introduced. Pre-existing Tailwind warnings in invoice-form-client.tsx (untouched).

## Outcome

- ✅ Impact: Cross-user cache poisoning in tax rates and HS codes resolved; full dark glassmorphism UI applied across all major dashboard pages
- 🧪 Tests: No new tests added (UI changes); bug fixes are verifiable via server logs and DB cache key inspection
- 📁 Files: 13 files modified across bug fixes and UI modernization
- 🔁 Next prompts: Run `npm run dev` to verify visual output; consider adding auth page form field glass styles; verify RevenueTrendChart renders with dark theme
- 🧠 Reflection: Used inline styles for glassmorphism properties (backdrop-filter) since Tailwind CSS classes may not cover all vendor-prefixed properties; CSS variables kept as legacy aliases for backward compatibility

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): none run
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): apply glass input styles to invoice-form-client.tsx and other remaining forms
