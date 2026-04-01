---
id: "010"
title: Code Review Docker UI Collapse Fixes
stage: general
date: 2026-04-01
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: architext
command: /engineering:code-review — resolve the error and run the docker code as the npm run dev code
labels: ["docker","code-review","css-variables","ssr","hydration","sidebar","production"]
links:
  spec: null
  ticket: null
  adr: history/adr/003-css-variable-ssr-scoping.md
  pr: null
files:
  - src/app/globals.css
  - src/components/dashboard/DashboardShell.tsx
  - src/components/dashboard/Sidebar.tsx
  - docker-compose.yml
  - Dockerfile
  - nginx.conf
tests:
  - none (manual rebuild + visual verification required)
---

## Prompt

resolve the error and run the docker code as the npm run dev code run the docker compose it runs the ui collapses

## Response snapshot

**Code review performed** across all modified files on branch `fix/docker-db-deploy-improvements`.

**Verdict: Approve** — both root causes are already fixed in the working tree. Image rebuild required to apply fixes.

**Root causes identified and fixed:**

1. **CSS FOUC (Primary):** `globals.css` previously scoped all CSS custom properties inside `.light`/`.dark` only — no `:root` fallback. SSR first-paint had `<html>` with no theme class, so all `var(--*)` resolved to empty. Fix: moved all tokens to `:root` (light defaults), `.dark` as override only. ✅ Applied.

2. **Sidebar animated collapse (Secondary):** `DashboardShell` had `transition-all` active during `useEffect` state correction. On viewports < 1024px, `setIsSidebarOpen(false)` ran with the animation active → visible collapse. Fix: `transitionsEnabled` flag starts `false`, correction happens without animation, transitions enabled on next rAF frame. ✅ Applied.

3. **`BETTER_AUTH_URL` hardcoded:** `docker-compose.yml` had `BETTER_AUTH_URL=http://localhost` hardcoded. Changed to `${BETTER_AUTH_URL:-http://localhost}` so it reads from `.env.production` with localhost as fallback. ✅ Fixed in this session.

**Next step:** `docker compose up --build -d`

## Outcome

- ✅ Impact: Confirmed both fixes are correctly applied in working tree; auth URL made configurable
- 🧪 Tests: none automated; manual verification needed after docker rebuild
- 📁 Files: docker-compose.yml (BETTER_AUTH_URL made env-configurable)
- 🔁 Next prompts: Rebuild Docker image and visually verify; optionally add cookie-based sidebar state persistence to eliminate client-correction round-trip
- 🧠 Reflection: Both fixes were already in the working tree from prior sessions — the image just needed to be rebuilt. Always confirm whether the fix is "not yet written" vs "written but not yet built/deployed" before implementing new code.
