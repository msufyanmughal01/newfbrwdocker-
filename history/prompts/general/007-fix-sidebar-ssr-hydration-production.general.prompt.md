---
id: 007
title: Fix Sidebar SSR Hydration and Production Collapse
stage: general
date: 2026-04-01
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: M Sufyan Mughal
command: sidebar production Docker collapse investigation and fix
labels: ["ssr", "hydration", "sidebar", "docker", "production", "next.js"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/components/dashboard/DashboardShell.tsx
  - src/components/dashboard/Sidebar.tsx
tests:
  - none
---

## Prompt

You are reviewing a Next.js (App Router) SaaS dashboard project where a sidebar behaves differently in development vs Docker production.

Problem:
- When running with `npm run dev`, the sidebar works correctly.
- When running inside Docker (`npm run build && npm start`), the sidebar is collapsed or behaves incorrectly.

[Full investigation prompt covering: hydration mismatch, sidebar state initialization, mounted state handling, responsive/breakpoint logic, Tailwind production issues, environment variables, code cleanliness]

## Response snapshot

**Root cause identified:** Two bugs in `DashboardShell.tsx` working together:

1. `useState(true)` initializes sidebar open on both server and client (line 13, original).
2. `useEffect` fires *after* paint and calls `setIsSidebarOpen(false)` on viewports < 1024px — with `transition-all duration-200` already active on the `<aside>`, this produces a visible animated collapse on every production page load.

**Why only in Docker/production:**
- Dev mode: React overhead + HMR timing masks the flash; devs test on desktop (≥1024px) where the correction is a no-op.
- Production: bundle loads fast, hydrates fast, `useEffect` fires and the full CSS transition animates the collapse immediately. On tablet viewports the sidebar stays collapsed.
- The `eslint-disable-next-line react-hooks/set-state-in-effect` comment on the original line 45 was suppressing React's own warning about this anti-pattern.

**Fix applied:**

`DashboardShell.tsx`:
- Added `transitionsEnabled` state (starts `false`)
- `useEffect` calls `setIsSidebarOpen(desktopQuery.matches)` to correct state instantly (no animation)
- `requestAnimationFrame(() => setTransitionsEnabled(true))` enables transitions on the next frame, after the correction is committed
- Removed the `eslint-disable` hack; simplified the `handleDesktopChange` callback
- Passed `transitionsEnabled` prop to `<Sidebar>`

`Sidebar.tsx`:
- Added `transitionsEnabled: boolean` to `SidebarProps`
- Desktop `<aside>` conditionally applies `transition-all duration-200 ease-in-out` only when `transitionsEnabled` is true

**Result:** On initial load the sidebar snaps to the correct width for the actual viewport with no animation. All subsequent user-initiated toggles animate normally.

## Outcome

- ✅ Impact: Eliminates the animated sidebar collapse flash in Docker production builds; sidebar now renders at the correct width on all viewports without a visible layout shift
- 🧪 Tests: No automated tests exist for sidebar layout; manual verification required across desktop (≥1024px), tablet (768–1023px), and mobile (<768px)
- 📁 Files: src/components/dashboard/DashboardShell.tsx, src/components/dashboard/Sidebar.tsx
- 🔁 Next prompts: Consider persisting sidebar open/closed preference in a cookie so the server can render the correct state, eliminating the need for client-side correction entirely
- 🧠 Reflection: The `eslint-disable` comment on the original code was the clearest signal that the pattern was wrong — suppressed warnings in effects that set state are almost always a hydration/flash anti-pattern worth investigating

## Evaluation notes (flywheel)

- Failure modes observed: setState inside useEffect without proper initialization; CSS transitions active during initial state correction
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Add a server-readable cookie for sidebar state to eliminate the client-correction round-trip entirely
