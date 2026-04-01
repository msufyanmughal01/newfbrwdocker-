---
id: "009"
title: ADR CSS Variable SSR Scoping
stage: general
date: 2026-04-01
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: architext
command: /sp.adr css-variable-ssr-scoping
labels: ["adr","css-variables","ssr","next-themes","docker","architecture"]
links:
  spec: null
  ticket: null
  adr: history/adr/003-css-variable-ssr-scoping.md
  pr: null
files:
  - history/adr/003-css-variable-ssr-scoping.md
tests:
  - none
---

## Prompt

/sp.adr css-variable-ssr-scoping

Document the architecturally significant decision about CSS custom property scoping strategy for SSR compatibility, identified during the Docker UI collapse root cause analysis (PHR 008).

## Response snapshot

Created ADR-003: "CSS Custom Property Scoping Strategy for SSR Compatibility" at `history/adr/003-css-variable-ssr-scoping.md`.

Decision: Adopt `:root` as the canonical light-theme token scope; use `.dark` as an override layer only. Remove the `.light` class entirely. This ensures first-paint correctness in SSR/production without JavaScript, eliminating the Docker UI collapse caused by undefined CSS variables before `next-themes` hydrates.

Four alternatives evaluated and rejected: blocking `<script>` injection, `prefers-color-scheme` media query, cookie-based SSR theme resolution, and `next-themes` SSR props.

## Outcome

- ✅ Impact: ADR-003 created documenting the CSS variable scoping decision and its rationale for the team
- 🧪 Tests: none
- 📁 Files: history/adr/003-css-variable-ssr-scoping.md created
- 🔁 Next prompts: Apply the fix — edit globals.css to add :root fallback variables; rebuild Docker image to verify
- 🧠 Reflection: Significance test passed on all three criteria (cross-cutting impact, multiple viable alternatives, long-term architectural consequence). Clean ADR — decision is reversible if cookie-based SSR theme becomes a priority later.

## Evaluation notes (flywheel)

- Failure modes observed: none — ADR creation was straightforward; no create-adr.sh script present so agent-native path used
- Graders run and results (PASS/FAIL): Significance checklist PASS (impact ✅, alternatives ✅, scope ✅)
- Prompt variant (if applicable): /sp.adr with explicit decision title from previous analysis
- Next experiment (smallest change to try): Apply the :root fix in globals.css and confirm Docker build renders correctly on first paint
