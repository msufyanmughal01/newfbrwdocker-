---
id: "008"
title: Docker UI Collapse Root Cause Analysis
stage: general
date: 2026-04-01
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: architext
command: /sp.analyze
labels: ["docker","next.js","css-variables","hydration","production","debugging"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/app/globals.css
  - src/components/dashboard/DashboardShell.tsx
  - src/components/dashboard/Sidebar.tsx
  - docker-compose.yml
  - src/components/ThemeProvider.tsx
  - src/app/layout.tsx
tests:
  - none
---

## Prompt

You are a senior Next.js + Docker + architecture expert.

Analyze my entire codebase to identify why the UI collapses when running inside Docker (`npm run build && npm start`) but works perfectly in development (`npm run dev`).

Objectives: Root Cause Identification, Client vs Server Component Audit, Hydration & Rendering Issues, CSS/Tailwind Audit, Docker-Specific Issues, Next.js Configuration Issues.

## Response snapshot

**Primary Root Cause:** All CSS custom properties (`--bg`, `--foreground`, `--primary`, etc.) are exclusively defined inside `.light {}` and `.dark {}` CSS class selectors in `globals.css` — with zero fallback at `:root`. On the server-rendered HTML, `<html>` has no theme class applied. On first paint in production, every CSS variable resolves to empty/undefined, making the layout invisible/transparent until JavaScript hydrates and `next-themes` applies `class="light"` to `<html>`. In dev, hydration is near-instant on localhost so this is imperceptible. In Docker production, JS bundle parse + hydration takes 200-800ms — enough to see a blank/collapsed render.

**Secondary Root Cause:** `BETTER_AUTH_URL=http://localhost` in `docker-compose.yml` breaks auth redirects for external users.

**Sidebar jump:** `DashboardShell` defaults `isSidebarOpen = true` then corrects via `useEffect`, causing a visible layout shift on mobile viewports.

**Primary Fix:** Add `:root` fallback variables in `globals.css` matching the light theme defaults — eliminates blank-screen-until-hydration. **All `"use client"` directives are correctly applied** — no component boundary misclassification found.

## Outcome

- ✅ Impact: Root cause of Docker UI collapse identified — CSS variable scoping gap between SSR and client hydration
- 🧪 Tests: none run (read-only analysis)
- 📁 Files: Analysis only — no files modified
- 🔁 Next prompts: Apply fixes to globals.css (add :root fallback), fix docker-compose.yml BETTER_AUTH_URL, optionally fix DashboardShell sidebar default
- 🧠 Reflection: The `suppressHydrationWarning` on `<html>` was masking the root cause — it prevents the React warning that would have flagged the theme class mismatch. Classic case of a "fix" hiding the symptom instead of the cause.

## Evaluation notes (flywheel)

- Failure modes observed: Blank/transparent UI on first paint in production builds, imperceptible in dev mode
- Graders run and results (PASS/FAIL): N/A — analysis task
- Prompt variant (if applicable): sp.analyze with custom Next.js/Docker context
- Next experiment (smallest change to try): Add :root vars to globals.css, rebuild Docker image, confirm UI renders correctly on first paint
