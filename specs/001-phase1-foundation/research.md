# Research: Phase 1 — Foundation

**Branch**: `001-phase1-foundation` | **Date**: 2026-02-11

## Technology Decisions

### 1. Authentication Library: Better Auth

**Decision**: Use Better Auth with the Drizzle adapter and organization plugin.

**Rationale**:
- Framework-agnostic TypeScript auth library with first-class Next.js App Router support
- Built-in Drizzle ORM adapter (`better-auth/adapters/drizzle` with `provider: "pg"`)
- Organization plugin provides: org creation, invitation system, custom roles, member management
- Email/password auth with configurable password policy (`minPasswordLength`, `sendResetPassword`)
- Google OAuth via `socialProviders.google` with `clientId`/`clientSecret`
- Session management via HTTP-only cookies with `getSessionCookie()` helper for middleware
- Password reset flow built-in via `sendResetPassword` callback
- Generates required database tables automatically (`npx @better-auth/cli generate`)

**Alternatives considered**:
- NextAuth/Auth.js: More popular but lacks built-in organization/RBAC primitives; would need custom implementation
- Clerk/Auth0: SaaS dependency, cost at scale, less control over data
- Lucia Auth: Deprecated in favor of manual session management patterns

### 2. Database ORM: Drizzle ORM + Neon PostgreSQL

**Decision**: Use Drizzle ORM with Neon serverless PostgreSQL driver.

**Rationale**:
- Type-safe schema-as-code with `pgTable` definitions in TypeScript
- `decimal(precision, scale)` column type for financial values (avoids floating point)
- Built-in migration tooling via `drizzle-kit` (generate, migrate, push)
- Neon serverless driver (`@neondatabase/serverless`) for edge-compatible connections
- Relations API for type-safe joins across tables
- Schema introspection and type inference (`$inferInsert`, `$inferSelect`)

**Alternatives considered**:
- Prisma: Heavier runtime, separate schema language (not TypeScript), slower cold starts on serverless
- Kysely: SQL query builder only, no migration tooling built-in
- Raw SQL: No type safety, error-prone schema management

### 3. Framework: Next.js 15 App Router

**Decision**: Use Next.js 15 with App Router architecture.

**Rationale**:
- Server Components by default for auth-gated pages (no client-side token exposure)
- Middleware for route-level auth protection via `middleware.ts`
- Nested layouts for dashboard shell with shared navigation
- Route Handlers (`route.ts`) for API endpoints including Better Auth catch-all
- Server Actions for form submissions (login, register, invite)

**Alternatives considered**:
- Next.js Pages Router: Legacy pattern, less aligned with React Server Components
- Remix: Smaller ecosystem, different data loading patterns
- SvelteKit: Different framework entirely, team expertise assumed for React

### 4. UI Framework: Tailwind CSS 4

**Decision**: Use Tailwind CSS 4 for styling.

**Rationale**:
- Utility-first CSS with zero runtime overhead
- v4 uses CSS-native cascade layers and `@theme` configuration
- Wide ecosystem of component libraries (shadcn/ui compatible)
- Better Auth UI provides pre-built shadcn-styled auth components

**Alternatives considered**:
- CSS Modules: More boilerplate, less utility-class productivity
- Styled Components: Runtime CSS-in-JS, poor Server Component support

### 5. Testing: Vitest + Playwright

**Decision**: Use Vitest for unit/integration tests and Playwright for E2E tests.

**Rationale**:
- Vitest: Native ESM, TypeScript-first, compatible with Vite ecosystem, fast watch mode
- Playwright: Cross-browser E2E testing with auto-waiting, network interception, trace viewer
- Both are first-class choices for Next.js 15 projects

**Alternatives considered**:
- Jest: Slower, requires more configuration for ESM/TypeScript
- Cypress: Slower execution, single-tab limitation, larger bundle

### 6. Email Service: Resend

**Decision**: Use Resend as the transactional email service.

**Rationale**:
- Simple API (single function call), TypeScript SDK
- Developer-friendly with React Email templates support
- Generous free tier (100 emails/day) suitable for development and early production
- Easy integration with Better Auth's `sendResetPassword` and org invitation callbacks

**Alternatives considered**:
- SendGrid: More complex API, heavier SDK
- AWS SES: Requires AWS account setup, more configuration overhead
- Postmark: Good alternative but smaller ecosystem

## Integration Patterns

### Better Auth + Drizzle + Neon

- Better Auth uses `drizzleAdapter(db, { provider: "pg" })` to connect to the Drizzle instance
- Drizzle connects to Neon via `@neondatabase/serverless` pool
- Better Auth generates its own tables (user, session, account, verification) alongside custom schema
- Organization plugin adds organization, member, and invitation tables
- Custom roles (owner, operator, accountant) are defined via access control API

### Better Auth + Next.js Middleware

- `getSessionCookie(request)` from `better-auth/cookies` checks session in middleware
- Middleware redirects unauthenticated users from `/dashboard/*` to `/login`
- Middleware redirects authenticated users from `/login`, `/register` to `/dashboard`
- Role-based checks happen at the Server Component/Action level (not middleware)

### Drizzle Schema + Better Auth Schema

- Better Auth manages its own tables (user, session, account, verification)
- Custom application tables (organization extended fields, invitations) reference Better Auth tables
- All custom tables include `orgId` foreign key for tenant scoping
- Financial columns use `decimal(precision, scale)` type
