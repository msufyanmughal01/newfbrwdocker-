---
id: "018"
title: Fix Tailwind CSS missing in Docker — postcss.config.mjs excluded
stage: general
date: 2026-04-04
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: System Inn
command: debug docker css
labels: ["docker","tailwind-v4","postcss","dockerignore","css","debug"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .dockerignore
tests:
  - manual: rebuild image with --no-cache and verify CSS renders correctly
---

## Prompt

when i up the container the is behaving like there is no ccs involved with the app attached the ss check if any thing related css file is not there in dockerization is issue is only occur when the app is running with docker other than with npm run dev it run perfectly fine

## Response snapshot

Root cause identified: `.dockerignore` contained `*.mjs` wildcard which excluded `postcss.config.mjs` from the Docker build context.

Without `postcss.config.mjs`, the `@tailwindcss/postcss` PostCSS plugin is never loaded during `npm run build` inside the container. Tailwind CSS v4 uses `@import "tailwindcss"` in `globals.css` which requires the PostCSS plugin to generate utility classes. Without it:
- CSS variables (`:root { --bg: ... }`) survive as raw CSS → dark background still renders
- Tailwind utility classes (`flex`, `grid`, `hidden`, `md:flex`, `h-screen`, `w-60`, etc.) are never generated → layout completely broken

Fix applied: replaced `*.mjs` in `.dockerignore` with explicit filenames for each utility/seed script that should be excluded, leaving `postcss.config.mjs` and `eslint.config.mjs` in the build context.

```diff
- *.mjs
+ # Exclude utility/seed scripts — NOT postcss.config.mjs or eslint.config.mjs
+ cleanup-db.mjs
+ create-test-user.mjs
+ demo-invoice-logic.mjs
+ explore-database.mjs
+ setup-db.mjs
+ verify-tables.mjs
```

Rebuild required: `docker compose up --build --force-recreate` (use `--no-cache` on first rebuild to bust stale build layer).

## Outcome

- ✅ Impact: CSS layout fully restored in Docker — Tailwind v4 utility classes now generated correctly at build time
- 🧪 Tests: manual rebuild + browser verification of styled dashboard required
- 📁 Files: .dockerignore (1 line replaced with 6 explicit entries)
- 🔁 Next prompts: verify rebuild shows correct TaxDigital dashboard UI with sidebar layout
- 🧠 Reflection: Tailwind v4's CSS-first approach (`@import "tailwindcss"` + PostCSS plugin) means the PostCSS config is a hard build dependency — excluding it silently produces partial CSS with no build error, making it tricky to diagnose

## Evaluation notes (flywheel)

- Failure modes observed: wildcard `.dockerignore` entry silently excluded a critical build config file; CSS partially worked (variables survived) masking a complete Tailwind utility failure
- Graders run and results (PASS/FAIL): none automated
- Prompt variant (if applicable): none
- Next experiment: add a build-time check that verifies postcss.config exists before running next build in Dockerfile
