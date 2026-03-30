---
id: 006
title: Cross-Artifact Consistency Analysis
stage: misc
date: 2026-02-22
surface: agent
model: claude-sonnet-4-6
feature: 007-sidebar-toggle
branch: main
user: System Inn
command: /sp.analyze
labels: ["analyze","consistency","quality","constitution","testing"]
links:
  spec: specs/007-sidebar-toggle/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/007-sidebar-toggle/spec.md
  - specs/007-sidebar-toggle/plan.md
  - specs/007-sidebar-toggle/tasks.md
  - .specify/memory/constitution.md
tests:
  - none
---

## Prompt

/sp.analyze

## Response snapshot

Read-only cross-artifact consistency analysis of `007-sidebar-toggle` (spec.md, plan.md, tasks.md) against the project constitution. Feature is fully implemented (all 17 tasks marked [x]).

**Findings summary:**
- **CRITICAL (1)**: No test tasks generated. Constitution Principle X and "Do NOT skip writing tests" constraint are directly violated. tasks.md cites "not requested in spec" as rationale — which cannot override the constitution.
- **HIGH (2)**: (I1) Spec Assumptions section contradicts User Story 2 and T009 — says Business Profile stays in main nav but implementation (correctly) moved it to pinned bottom. (I2) plan.md:L156 contains unresolved editorial self-correction prose violating Principle I (Clarity).
- **MEDIUM (3)**: (U1) SC-001 animation timing not verified in any task. (U2) FR-006 state persistence relies on implicit App Router behavior — undocumented. (A1) plan.md phases (3) don't map to tasks.md phases (6).
- **LOW (2)**: (D1) FR-009 and US3-AC1 near-duplicate — acceptable. (A2) tasks.md framing implies tests are spec-controlled, not constitution-controlled.

**Coverage**: 10/10 FRs have task coverage (100%). 4/5 SCs have task coverage (80%). 0% test coverage.

## Outcome

- ✅ Impact: Identified 1 critical, 2 high, 3 medium, 2 low quality and consistency issues across artifacts for the already-implemented feature
- 🧪 Tests: None run (read-only analysis)
- 📁 Files: Read-only — no files modified
- 🔁 Next prompts: Add test tasks (Vitest + Playwright); fix spec.md Assumptions (I1); clean plan.md L156 (I2)
- 🧠 Reflection: Feature was correctly implemented per user stories but tasks generation violated constitution by skipping tests with incorrect authority delegation to spec. Constitution always overrides spec for mandatory quality gates.

## Evaluation notes (flywheel)

- Failure modes observed: PowerShell execution policy blocked prerequisite script — fell back to agent-native artifact discovery via Glob
- Graders run and results (PASS/FAIL): N/A (analysis-only)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add constitution check in tasks template that explicitly blocks "no tests" decisions regardless of spec request
