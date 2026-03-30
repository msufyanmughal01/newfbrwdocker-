# Implementation Plan: Phase 1 — Foundation

**Branch**: `001-phase1-foundation` | **Date**: 2026-02-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-phase1-foundation/spec.md`

## Summary

Establish the FBR Digital Invoicing Portal baseline: a Next.js 15 App Router application with TypeScript strict mode, Tailwind CSS 4, Drizzle ORM connected to Neon PostgreSQL, Better Auth for authentication (email/password + Google OAuth) with session persistence via HTTP-only cookies, organization plugin for multi-tenant RBAC (owner/operator/accountant), email-based invitation system, password reset flow via Resend, and a protected dashboard layout shell. Testing via Vitest (unit) and Playwright (E2E).

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, `noEmit`, path aliases `@/*`)
**Runtime**: Node.js 20+ LTS
**Framework**: Next.js 15 (App Router, Server Components, Server Actions, Middleware)
**Primary Dependencies**:
- `better-auth` — Authentication, session management, organization/RBAC plugin
- `drizzle-orm` + `drizzle-kit` — ORM, schema management, migrations
- `@neondatabase/serverless` — Neon PostgreSQL driver
- `tailwindcss` v4 — Utility-first CSS
- `resend` — Transactional email delivery
**Storage**: Neon PostgreSQL (serverless)
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Web (Node.js server, modern browsers)
**Project Type**: Web application (single Next.js project)
**Performance Goals**: Dev server cold start < 5 seconds; page loads < 2 seconds
**Constraints**: Strict TypeScript (no `any`), zero schema drift, all financial columns `decimal`, all queries scoped by `orgId`
**Scale/Scope**: Single-tenant per user in Phase 1; multi-org deferred

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Clarity Above All | PASS | All file/function names follow descriptive conventions; schema-as-code in TypeScript |
| II. Consistency Is Mandatory | PASS | Single pattern for auth (Better Auth), single ORM (Drizzle), single styling approach (Tailwind) |
| III. Simplicity Over Complexity | PASS | Using Better Auth plugins instead of custom auth; Drizzle schema-as-code instead of raw SQL |
| IV. Purpose-Driven Development | PASS | Every dependency maps to a spec requirement (FR-001 through FR-021) |
| V. Quality Cannot Be Compromised | PASS | Vitest + Playwright testing; TypeScript strict mode; ESLint |
| VI. Transparency of Changes | PASS | Drizzle migrations tracked in version control; env template documents all config |
| VII. Scalability of Structure | PASS | Feature-based route groups; schema modules; layout nesting |
| VIII. Security Is Not Optional | PASS | Better Auth handles session security; middleware guards routes; server-side role checks |
| IX. Data Integrity Above Convenience | PASS | `decimal` for financial columns; server-side validation; orgId scoping |
| X. Testability Is a Requirement | PASS | Auth logic testable via Vitest mocks; E2E flows via Playwright |

No violations. Gate PASSES.

## Project Structure

### Documentation (this feature)

```text
specs/001-phase1-foundation/
├── plan.md              # This file
├── research.md          # Phase 0 output - technology decisions
├── data-model.md        # Phase 1 output - entity schemas
├── quickstart.md        # Phase 1 output - developer setup guide
├── contracts/
│   └── api-contracts.md # Phase 1 output - API endpoint contracts
└── tasks.md             # Phase 2 output (created by /sp.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx           # Login form (email/password + Google OAuth)
│   │   ├── register/
│   │   │   └── page.tsx           # Registration form
│   │   ├── forgot-password/
│   │   │   └── page.tsx           # Forgot password form
│   │   ├── reset-password/
│   │   │   └── page.tsx           # Reset password form (with token)
│   │   └── layout.tsx             # Auth pages layout (centered, no nav)
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Dashboard home page
│   │   ├── settings/
│   │   │   └── page.tsx           # Organization settings (owner only)
│   │   ├── members/
│   │   │   └── page.tsx           # Member management + invitations (owner only)
│   │   └── layout.tsx             # Dashboard layout (sidebar nav, header)
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...all]/
│   │   │       └── route.ts       # Better Auth catch-all handler
│   │   └── organization/
│   │       └── profile/
│   │           └── route.ts       # Organization profile CRUD
│   ├── layout.tsx                 # Root layout (html, body, providers)
│   └── page.tsx                   # Landing/redirect page
├── components/
│   ├── ui/                        # Reusable UI components (shadcn-style)
│   ├── auth/                      # Auth-specific components (forms, buttons)
│   └── dashboard/                 # Dashboard-specific components (nav, sidebar)
├── lib/
│   ├── auth.ts                    # Better Auth server instance configuration
│   ├── auth-client.ts             # Better Auth client instance
│   ├── auth-permissions.ts        # Access control definitions (roles, permissions)
│   ├── db/
│   │   ├── index.ts               # Drizzle instance + Neon connection
│   │   ├── schema/
│   │   │   ├── index.ts           # Schema barrel export
│   │   │   └── organization-profile.ts  # Custom organization profile table
│   │   └── seed.ts                # Database seed script
│   ├── email.ts                   # Resend email service wrapper
│   └── utils.ts                   # Shared utility functions
├── middleware.ts                   # Next.js middleware (auth redirect logic)
└── types/
    └── index.ts                   # Shared TypeScript type definitions

tests/
├── unit/
│   ├── lib/
│   │   └── auth-permissions.test.ts
│   └── components/
├── integration/
│   └── api/
│       └── organization-profile.test.ts
└── e2e/
    ├── auth.spec.ts               # Registration, login, logout, OAuth flows
    ├── session.spec.ts            # Session persistence tests
    ├── rbac.spec.ts               # Role-based access control tests
    └── dashboard.spec.ts          # Dashboard protection tests
```

**Structure Decision**: Single Next.js project using App Router with route groups. `(auth)` group for unauthenticated pages, `(dashboard)` group for protected pages. This aligns with Constitution Principle VII (Scalability of Structure) — adding new features means adding new route directories, not modifying existing ones.

## Architecture Decisions

### 1. Route Groups for Auth vs Dashboard

Use Next.js route groups `(auth)` and `(dashboard)` to separate authentication pages from protected pages. Each group has its own layout:
- `(auth)/layout.tsx`: Centered card layout, no navigation
- `(dashboard)/layout.tsx`: Full dashboard layout with sidebar navigation and header

This keeps layouts independent and avoids conditional rendering logic.

### 2. Better Auth Organization Plugin for RBAC

Use Better Auth's built-in organization plugin rather than custom RBAC tables. The plugin provides:
- Organization CRUD
- Member management with role assignment
- Invitation system with email delivery hooks
- Access control API for defining custom roles

Custom roles (owner, operator, accountant) are defined via Better Auth's access control API with specific permission sets.

### 3. Middleware for Route Protection Only

Next.js middleware handles only route-level redirects (authenticated/unauthenticated). Role-based authorization is enforced at the Server Component and Server Action level, not in middleware. This keeps middleware fast and avoids the complexity of role resolution in the edge runtime.

### 4. Drizzle Schema Alongside Better Auth Tables

Better Auth generates its own tables (user, session, account, verification, organization, member, invitation). Application-specific tables (organizationProfile) are defined in Drizzle schema files and reference Better Auth tables via foreign keys. Both are managed by `drizzle-kit push`.

### 5. Resend for Transactional Email

Better Auth provides callback hooks for sending emails (`sendResetPassword` for password reset, `sendInvitationEmail` for org invitations). These callbacks invoke Resend's API to deliver emails. Email templates use simple HTML — React Email templates are optional.

## Post-Design Constitution Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Clarity | PASS | File structure is self-documenting; schema-as-code |
| II. Consistency | PASS | Single auth library, single ORM, single CSS framework |
| III. Simplicity | PASS | Using Better Auth plugins avoids custom auth code; no unnecessary abstractions |
| IV. Purpose-Driven | PASS | Every file maps to a spec requirement |
| V. Quality | PASS | TypeScript strict, Vitest + Playwright, ESLint |
| VI. Transparency | PASS | Drizzle migrations in VCS; env template; constitution check |
| VII. Scalability | PASS | Route groups allow parallel feature development |
| VIII. Security | PASS | HTTP-only cookies, middleware guards, server-side role checks, no client-side secrets |
| IX. Data Integrity | PASS | `decimal` for financials, orgId scoping, server-side validation |
| X. Testability | PASS | Separated concerns allow unit testing; E2E covers full flows |

No violations. Post-design gate PASSES.

## Complexity Tracking

No constitution violations to justify. Architecture uses standard patterns with no additional complexity layers.
