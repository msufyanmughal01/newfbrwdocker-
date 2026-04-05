---
id: 025
title: Fix Spreadsheet TypeScript Error in IF Formula
stage: general
date: 2026-04-05
surface: agent
model: claude-opus-4-5
feature: none
branch: main
user: System Inn
command: tsc --noEmit
labels: ["typescript","spreadsheet","bugfix","formula-engine"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/components/spreadsheet/SpreadsheetClient.tsx
tests:
  - npx tsc --noEmit (zero errors)
---

## Prompt

(Continuation of session — TypeScript check on SpreadsheetClient.tsx after Excel-like rewrite)
The spread sheet is not like excel like how excel works not all feature but the calculation and cells selection.

## Response snapshot

Ran `npx tsc --noEmit` and found one error:

```
src/components/spreadsheet/SpreadsheetClient.tsx(85,59): error TS2367:
This comparison appears to be unintentional because the types
'string | number' and 'boolean' have no overlap.
```

Root cause: the IF-formula branch guard had `cond !== false` but `evaluateFormula` returns `string | number`, never `boolean` — the comparison is a dead code type error.

Fix applied (line 85):
```ts
// Before
const branch = (cond && cond !== 0 && cond !== '0' && cond !== false) ? ifM[2] : ifM[3];

// After
const branch = (cond && cond !== 0 && cond !== '0') ? ifM[2] : ifM[3];
```

Re-ran `npx tsc --noEmit` → zero errors across entire project.

## Outcome

- ✅ Impact: Project-wide TypeScript clean — zero errors after Excel-like spreadsheet rewrite
- 🧪 Tests: `npx tsc --noEmit` passes with exit code 0
- 📁 Files: src/components/spreadsheet/SpreadsheetClient.tsx (1-line fix, line 85)
- 🔁 Next prompts: FBR NTN/CNIC validate-ntn API endpoint needs user to provide real FBR endpoint details; run DB migration drizzle/0003_encrypt_ntn_cnic_fields.sql in production
- 🧠 Reflection: `evaluateFormula` return type is `string | number`; comparing against `boolean` is always a dead comparison and TypeScript correctly rejects it

## Evaluation notes (flywheel)

- Failure modes observed: Stale boolean guard carried forward in rewrite
- Graders run and results (PASS/FAIL): tsc --noEmit PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add explicit `evaluateFormula` return-type annotation to catch similar issues at definition site
