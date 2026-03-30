# Tasks: Phase 1 — Foundation

**Input**: Design documents from `/specs/001-phase1-foundation/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-contracts.md, research.md, quickstart.md

**Tests**: E2E tests included per SC-011 (All Phase 1 unit + E2E tests pass). Unit tests included for permissions logic.

**Organization**: Tasks grouped by user story. US2 (Session Persistence) and US5 (Database Schema) are incorporated into the Foundational phase since all other stories depend on them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize Next.js 15 project with all dependencies and configuration

- [x] T001 Initialize Next.js 15 project with TypeScript strict mode, App Router, and Tailwind CSS 4 using `npx create-next-app@latest`
- [x] T002 Install core dependencies: `better-auth`, `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `resend`
- [x] T003 Install dev dependencies: `vitest`, `@playwright/test`, `tsx`
- [x] T004 [P] Configure `tsconfig.json` with strict mode enabled and path alias `@/*` mapping to `./src/*`
- [x] T005 [P] Configure `drizzle.config.ts` at project root with Neon PostgreSQL connection and schema path `./src/lib/db/schema/*`
- [x] T006 [P] Configure Vitest in `vitest.config.ts` with path aliases and test directory `tests/`
- [x] T007 [P] Configure Playwright in `playwright.config.ts` with base URL `http://localhost:3000` and test directory `tests/e2e/`
- [x] T008 Create `.env.local.example` with all required environment variables: `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`
- [x] T009 Add npm scripts to `package.json`: `db:push`, `db:generate`, `db:migrate`, `db:seed`, `db:studio`, `typecheck`, `test`, `test:e2e`
- [x] T010 Create project directory structure: `src/lib/db/schema/`, `src/components/ui/`, `src/components/auth/`, `src/components/dashboard/`, `src/types/`, `tests/unit/`, `tests/integration/`, `tests/e2e/`

**Checkpoint**: Project initializes, `npm run dev` starts without errors, `npm run build` compiles

---

## Phase 2: Foundational (Database + Auth + Middleware)

**Purpose**: Core infrastructure that MUST be complete before ANY user story UI can be implemented. Incorporates US2 (Session Persistence) and US5 (Database Schema) at the infrastructure level.

**CRITICAL**: No user story UI work can begin until this phase is complete

- [x] T011 Create Drizzle + Neon database connection instance in `src/lib/db/index.ts` using `@neondatabase/serverless` Pool and `drizzle-orm/neon-serverless`
- [x] T012 Create custom `organizationProfile` table schema in `src/lib/db/schema/organization-profile.ts` with fields: id, organizationId (FK), taxIdentifier, phone, address, city, status, timestamps per data-model.md
- [x] T013 Create schema barrel export in `src/lib/db/schema/index.ts` re-exporting all schema modules
- [x] T014 Define access control permissions (owner, operator, accountant roles) in `src/lib/auth-permissions.ts` using Better Auth access control API
- [x] T015 Create Resend email service wrapper in `src/lib/email.ts` with functions for sending password reset and invitation emails
- [x] T016 Configure Better Auth server instance in `src/lib/auth.ts` with: Drizzle adapter (provider "pg"), email/password (minPasswordLength 8, sendResetPassword callback), Google OAuth social provider, organization plugin with custom roles from `auth-permissions.ts`, sendInvitationEmail callback using Resend
- [x] T017 Create Better Auth client instance in `src/lib/auth-client.ts` with organization plugin client
- [x] T018 Create Better Auth catch-all route handler in `src/app/api/auth/[...all]/route.ts` exporting GET and POST handlers
- [x] T019 Implement Next.js middleware in `src/middleware.ts` using `getSessionCookie` from `better-auth/cookies` to redirect: unauthenticated users from `/dashboard/*` to `/login`, authenticated users from `/login`, `/register` to `/dashboard`
- [ ] T020 Push database schema with `npm run db:push` to provision all Better Auth tables + custom tables in Neon
- [x] T021 Create database seed script in `src/lib/db/seed.ts` that creates: 2 demo organizations, 3 users (one owner, one operator, one accountant), member assignments, and organization profiles
- [x] T022 Create shared TypeScript type definitions in `src/types/index.ts` for role types, session types, and organization profile types

**Checkpoint**: Database provisioned, Better Auth endpoints respond, middleware redirects work, seed data loads via `npm run db:seed`

---

## Phase 3: User Story 1 — New User Registration & Login (Priority: P1) MVP

**Goal**: Users can register (email/password), log in, log out, sign in with Google, and reset forgotten passwords. Registration auto-creates an organization with the user as owner.

**Independent Test**: Navigate to `/register`, create account, verify redirect to `/dashboard`, log out, log back in via `/login`. Test Google OAuth flow. Test forgot/reset password flow.

### Implementation for User Story 1

- [x] T023 [P] [US1] Create auth layout in `src/app/(auth)/layout.tsx` with centered card design, no navigation, responsive container
- [x] T024 [P] [US1] Create reusable auth form components in `src/components/auth/`: `LoginForm.tsx`, `RegisterForm.tsx`, `SocialLoginButton.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`
- [x] T025 [US1] Implement registration page in `src/app/(auth)/register/page.tsx` using `RegisterForm` component with Better Auth `signUp.email` client call, auto-create organization via `afterSignUp` hook or server action
- [x] T026 [US1] Implement login page in `src/app/(auth)/login/page.tsx` using `LoginForm` component with Better Auth `signIn.email` and `signIn.social` (Google) client calls, link to forgot password
- [x] T027 [US1] Implement forgot password page in `src/app/(auth)/forgot-password/page.tsx` using `ForgotPasswordForm` component with Better Auth `forgetPassword` client call
- [x] T028 [US1] Implement reset password page in `src/app/(auth)/reset-password/page.tsx` using `ResetPasswordForm` component that reads token from URL and calls Better Auth `resetPassword`
- [x] T029 [US1] Create root layout in `src/app/layout.tsx` with HTML structure, Tailwind globals, and metadata
- [x] T030 [US1] Create landing page in `src/app/page.tsx` that redirects authenticated users to `/dashboard` and unauthenticated users to `/login`

**Checkpoint**: Full registration → login → logout → password reset flow works end-to-end. Google OAuth redirects correctly.

---

## Phase 4: User Story 3 — Role-Based Access Control (Priority: P1)

**Goal**: Three roles (owner, operator, accountant) with enforced permissions. Owners can invite users. Unauthorized access returns 401/403.

**Independent Test**: Create users with different roles via seed data or invitation, verify each role can only access permitted routes/actions, verify 403 on restricted actions.

**Depends on**: Phase 2 (auth-permissions.ts), Phase 3 (registration flow for creating owner users)

### Implementation for User Story 3

- [x] T031 [P] [US3] Create role guard utility function in `src/lib/utils.ts` that resolves current user's role from session → member table and returns role or throws 401/403
- [x] T032 [P] [US3] Create organization profile API route handler in `src/app/api/organization/profile/route.ts` with GET (any authenticated member) and PUT (owner only) per contracts
- [x] T033 [US3] Create members management page in `src/app/(dashboard)/members/page.tsx` with: member list display, invite form (email + role selector), owner-only access guard
- [x] T034 [US3] Create organization settings page in `src/app/(dashboard)/settings/page.tsx` with: org profile form (taxIdentifier, phone, address, city), owner-only access guard
- [x] T035 [US3] Add role-based conditional rendering helper in `src/components/dashboard/RoleGate.tsx` that shows/hides children based on user's role

**Checkpoint**: Owner can invite members, operator/accountant see restricted views, unauthorized actions return 403

---

## Phase 5: User Story 4 — Protected Dashboard Access (Priority: P2)

**Goal**: Authenticated users land on a dashboard layout with role-appropriate navigation. Unauthenticated access redirects to login.

**Independent Test**: Log in, verify dashboard renders with sidebar navigation. Verify owner sees all nav items. Verify unauthenticated access redirects to `/login`.

**Depends on**: Phase 2 (middleware), Phase 3 (login flow)

### Implementation for User Story 4

- [x] T036 [P] [US4] Create dashboard sidebar navigation component in `src/components/dashboard/Sidebar.tsx` with role-aware menu items: Dashboard (all roles), Members (owner), Settings (owner)
- [x] T037 [P] [US4] Create dashboard header component in `src/components/dashboard/Header.tsx` with user name display, org name, and logout button
- [x] T038 [US4] Create dashboard layout in `src/app/(dashboard)/layout.tsx` that wraps children with Sidebar + Header, fetches session server-side, passes user/role data to navigation components
- [x] T039 [US4] Implement dashboard home page in `src/app/(dashboard)/dashboard/page.tsx` with welcome message, user role display, and organization name

**Checkpoint**: Dashboard renders with full layout for authenticated users, redirects for unauthenticated, navigation reflects user role

---

## Phase 6: User Story 6 — Environment Configuration & Dev Setup (Priority: P3)

**Goal**: Developer can clone, configure, and run the project from scratch following the quickstart guide.

**Independent Test**: Follow quickstart.md steps from clean clone: copy env, install, run dev, run build, run tests.

### Implementation for User Story 6

- [x] T040 [US6] Validate `.env.local.example` contains all required variables with descriptive comments, verify no secrets are committed
- [x] T041 [US6] Verify `npm run build` completes with zero errors (run `next build`)
- [x] T042 [US6] Verify `npm run typecheck` passes with zero errors (run `tsc --noEmit`)
- [ ] T043 [US6] Verify `npm run db:push` provisions schema successfully against a clean Neon database
- [ ] T044 [US6] Verify `npm run db:seed` loads seed data without errors

**Checkpoint**: Fresh clone → setup → dev server → build → tests all pass without errors

---

## Phase 7: Testing

**Purpose**: E2E and unit tests per SC-011

- [x] T045 [P] Write E2E test for registration and login flows in `tests/e2e/auth.spec.ts`: register with email/password, duplicate email error, login with valid/invalid credentials, logout, Google OAuth redirect
- [x] T046 [P] Write E2E test for session persistence in `tests/e2e/session.spec.ts`: login, refresh page, verify still authenticated, verify expired session redirects
- [x] T047 [P] Write E2E test for RBAC in `tests/e2e/rbac.spec.ts`: owner accesses all sections, operator denied owner features (403), unauthenticated access returns 401/redirect
- [x] T048 [P] Write E2E test for dashboard protection in `tests/e2e/dashboard.spec.ts`: authenticated user sees dashboard, unauthenticated redirected to login, role-appropriate nav items
- [x] T049 [P] Write unit test for auth permissions in `tests/unit/lib/auth-permissions.test.ts`: verify role definitions, permission checks for each role (owner/operator/accountant)
- [x] T050 Write integration test for organization profile API in `tests/integration/api/organization-profile.test.ts`: GET returns profile, PUT updates (owner), PUT rejected (non-owner)

**Checkpoint**: All tests pass — `npx vitest` and `npx playwright test` complete successfully

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories

- [x] T051 Run full type check `npm run typecheck` — resolve any remaining TypeScript strict mode errors
- [x] T052 Run ESLint `npm run lint` — fix all violations
- [ ] T053 Verify tenant isolation: query as org A user, confirm org B data is not returned
- [ ] T054 Verify password reset email sends correctly via Resend in development
- [ ] T055 Verify invitation email sends correctly via Resend in development
- [ ] T056 Run quickstart.md validation end-to-end from clean environment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 Registration & Login (Phase 3)**: Depends on Phase 2
- **US3 RBAC (Phase 4)**: Depends on Phase 2 + Phase 3 (needs registration flow for owner user creation)
- **US4 Dashboard (Phase 5)**: Depends on Phase 2 + Phase 3 (needs login flow for authenticated access)
- **US6 Dev Setup (Phase 6)**: Depends on Phases 1–5 (validates entire stack)
- **Testing (Phase 7)**: Depends on Phases 3–5 (tests all implemented features)
- **Polish (Phase 8)**: Depends on all prior phases

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories
- **US3 (P1)**: Depends on US1 (needs registered owner to test invitation/permissions)
- **US4 (P2)**: Can start after Foundational — no dependency on US3, but benefits from US1 for testing
- **US6 (P3)**: Validation phase — depends on all implementation being complete

### Within Each User Story

- Layout/components before pages
- Server-side config before client-side pages
- Core flow before edge cases

### Parallel Opportunities

**Phase 1 (Setup)**:
- T004, T005, T006, T007 can run in parallel (different config files)

**Phase 2 (Foundational)**:
- T012, T013 can run together (schema files)
- T014, T015 can run together (independent lib files)

**Phase 3 (US1)**:
- T023, T024 can run in parallel (layout + components)

**Phase 4 (US3)**:
- T031, T032 can run in parallel (utility + API route)

**Phase 5 (US4)**:
- T036, T037 can run in parallel (sidebar + header components)

**Phase 7 (Testing)**:
- T045, T046, T047, T048, T049 can ALL run in parallel (independent test files)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch schema tasks in parallel:
Task: "Create organizationProfile schema in src/lib/db/schema/organization-profile.ts"
Task: "Create schema barrel export in src/lib/db/schema/index.ts"

# Launch independent lib files in parallel:
Task: "Define access control permissions in src/lib/auth-permissions.ts"
Task: "Create Resend email wrapper in src/lib/email.ts"
```

## Parallel Example: Phase 7 (Testing)

```bash
# Launch ALL E2E test files in parallel:
Task: "Write E2E auth tests in tests/e2e/auth.spec.ts"
Task: "Write E2E session tests in tests/e2e/session.spec.ts"
Task: "Write E2E RBAC tests in tests/e2e/rbac.spec.ts"
Task: "Write E2E dashboard tests in tests/e2e/dashboard.spec.ts"
Task: "Write unit permissions tests in tests/unit/lib/auth-permissions.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Registration & Login)
4. **STOP and VALIDATE**: Register, login, logout, Google OAuth, password reset all work
5. Deploy/demo if ready — users can create accounts and authenticate

### Incremental Delivery

1. Setup + Foundational → Database and auth infrastructure ready
2. Add US1 → Registration & login works → Deploy (MVP!)
3. Add US3 → Roles enforced, invitations work → Deploy
4. Add US4 → Dashboard layout polished → Deploy
5. Add US6 → Dev setup validated → Deploy
6. Add Tests → Full test coverage → Deploy (Production-ready)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Registration & Login)
   - Developer B: US4 (Dashboard Layout — can scaffold with mock auth)
3. After US1 completes:
   - Developer A: US3 (RBAC + Invitations)
   - Developer B: Continues US4 integration
4. Testing phase: All test files in parallel

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 (Session Persistence) and US5 (Database Schema) are embedded in Phase 2 (Foundational) since they are prerequisites for all other stories
- Better Auth manages its own tables — do NOT manually create user/session/account/organization/member/invitation tables
- Only `organizationProfile` is a custom Drizzle schema table
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
