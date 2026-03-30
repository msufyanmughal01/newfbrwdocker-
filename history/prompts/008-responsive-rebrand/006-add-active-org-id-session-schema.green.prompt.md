---
id: 006
title: Add activeOrganizationId to Session Schema
stage: green
date: 2026-02-26
surface: agent
model: claude-sonnet-4-6
feature: 008-responsive-rebrand
branch: 008-responsive-rebrand
user: System Inn
command: chat
labels: ["schema","better-auth","organization-plugin","drizzle","session"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/lib/db/schema/auth.ts
tests:
  - none run
---

## Prompt

fix the session schema and add activeOrganizationId

## Response snapshot

Added `activeOrganizationId: text("active_organization_id")` to the `session` table in `src/lib/db/schema/auth.ts`. Required by the Better Auth `organization` plugin to track the user's active organization in the session. User instructed to run `npx drizzle-kit push` to apply the column to the Neon database.

## Outcome

- ✅ Impact: Fixes `INTERNAL_SERVER_ERROR: Failed query` on session lookup in middleware
- 🧪 Tests: none run
- 📁 Files: src/lib/db/schema/auth.ts (1 line added)
- 🔁 Next prompts: Run `npx drizzle-kit push` and verify error is resolved
- 🧠 Reflection: Better Auth organization plugin silently requires this column; must be manually added when using a hand-crafted Drizzle schema

## Evaluation notes (flywheel)

- Failure modes observed: Schema out of sync with Better Auth plugin requirements
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Run drizzle-kit push and restart dev server
