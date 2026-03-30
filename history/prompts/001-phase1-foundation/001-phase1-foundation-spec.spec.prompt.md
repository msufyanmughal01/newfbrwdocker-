---
id: 001
title: Phase 1 Foundation Specification
stage: spec
date: 2026-02-11
surface: agent
model: claude-opus-4-6
feature: 001-phase1-foundation
branch: 001-phase1-foundation
user: user
command: /sp.specify
labels: ["foundation", "auth", "rbac", "database", "dashboard"]
links:
  spec: specs/001-phase1-foundation/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-phase1-foundation/spec.md
  - specs/001-phase1-foundation/checklists/requirements.md
tests:
  - null
---

## Prompt

PHASE 1 — FOUNDATION
Specification
Objective

Establish a secure, production-ready application baseline including project initialization, authentication, RBAC, database schema, environment configuration, and dashboard scaffolding.

Functional Scope

Project Initialization

Initialize Next.js 15 application with:

TypeScript (strict mode enabled)

App Router

Tailwind CSS 4

Configure ESLint (Next.js recommended rules)

Configure tsconfig.json with path alias (@/*)

Create .env.local.example with required environment variables

Set up project folder structure per architecture guidelines

Configure Vitest + Playwright testing environment

Configure Drizzle ORM + Neon connection

Ensure development server starts without runtime errors

Next.js 15 App Router architecture

Neon PostgreSQL with Drizzle ORM

Better Auth with:

Email/password

Google OAuth

Session persistence

Role-Based Access Control:

owner

operator

accountant

Dashboard layout (protected routes)

Multi-table relational schema

Seed + migration setup

Non-Functional Requirements

Strict TypeScript (no any)

Zero schema drift

Secure session handling (HTTP-only cookies)

All financial columns use decimal

Database operations scoped by orgId

Development server boots under 5 seconds on cold start

Success Criteria
Initialization Validation

npx create-next-app (or equivalent scaffold) completes successfully

Development server starts with npm run dev without errors

ESLint runs without critical violations

Project builds successfully with npm run build

Test runner initializes successfully (npx vitest)

Playwright configuration runs without setup errors

Functional Validation

Users can register, login, logout

OAuth works end-to-end

Role permissions enforced at route and action level

Middleware blocks unauthenticated access

Dashboard renders only for authenticated users

Technical Validation

npx tsc --noEmit passes with 0 errors

npm run db:push successfully provisions schema

All Phase 1 unit + E2E tests pass

Seed data loads successfully

Security Criteria

No API route accessible without auth

Sessions survive page refresh

Unauthorized access returns 401/403 properly

## Response snapshot

Created feature specification for Phase 1 Foundation on branch `001-phase1-foundation`. The spec includes 6 user stories covering: registration/login (P1), session persistence (P1), RBAC (P1), protected dashboard (P2), database schema & data integrity (P2), and environment configuration (P3). Defined 16 functional requirements, 5 key entities (Organization, User, Role, Session, Account), 12 measurable success criteria, 6 edge cases, and 9 documented assumptions. All specification quality checklist items pass — no clarification markers needed.

## Outcome

- ✅ Impact: Feature specification created, branch initialized, quality validated
- 🧪 Tests: No tests at spec stage
- 📁 Files: 2 files created (spec.md, checklists/requirements.md)
- 🔁 Next prompts: /sp.clarify or /sp.plan
- 🧠 Reflection: User provided comprehensive input covering functional scope, NFRs, and success criteria — no clarification needed

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Spec quality checklist — PASS (all items)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
