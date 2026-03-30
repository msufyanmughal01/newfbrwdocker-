---
id: 001
title: TaxDigital Platform 9-Task Implementation
stage: green
date: 2026-03-20
surface: agent
model: claude-sonnet-4-6
feature: taxdigital-platform
branch: main
user: system
command: implement taxdigital-platform 9 tasks
labels: ["auth","landing-page","admin","bulk-upload","client-export","ntn-validation","deployment","docker"]
links:
  spec: specs/010-taxdigital-platform/
  ticket: null
  adr: null
  pr: null
files:
  - src/lib/auth.ts
  - src/lib/auth-edge.ts
  - src/components/auth/SocialLoginButton.tsx
  - src/app/(auth)/login/page.tsx
  - src/components/auth/LoginForm.tsx
  - src/app/(auth)/register/page.tsx
  - src/app/page.tsx
  - src/app/admin/page.tsx
  - src/app/admin/admin-client.tsx
  - src/app/api/admin/create-user-secret/route.ts
  - src/app/api/admin/delete-user-secret/route.ts
  - src/app/(dashboard)/members/page.tsx
  - src/components/dashboard/RoleGate.tsx
  - src/app/api/clients/export/route.ts
  - src/components/clients/ClientExportButton.tsx
  - src/app/(dashboard)/clients/page.tsx
  - src/components/invoices/ClientValidationBadge.tsx
  - src/app/(dashboard)/invoices/invoice-form-client.tsx
  - src/lib/db/schema/bulk-invoices.ts
  - src/lib/db/schema/index.ts
  - src/app/api/bulk-invoices/upload/route.ts
  - src/app/api/bulk-invoices/submit/route.ts
  - src/app/(dashboard)/invoices/bulk/page.tsx
  - src/app/(dashboard)/invoices/bulk/bulk-client.tsx
  - src/components/dashboard/Sidebar.tsx
  - src/app/(dashboard)/invoices/page.tsx
  - Dockerfile
  - docker-compose.yml
  - .dockerignore
  - .env.production.example
  - nginx.conf
  - .github/workflows/deploy.yml
  - src/app/api/health/route.ts
  - scripts/backup.sh
  - next.config.ts
tests:
  - none (manual testing required for FBR submission flow)
---

## Prompt

Implement a large multi-task feature for the TaxDigital Next.js SaaS app. 9 tasks total:
1. Remove Google Auth
2. Public Landing Home Page
3. Secret Admin Dashboard
4. Remove Organization UI
5. Client Export (CSV)
6. NTN Validation Badge
7. Bulk Invoice Upload (schema, upload API, submit API, UI)
8. Deployment Files (Dockerfile, docker-compose, nginx, GitHub Actions, health endpoint, backup script)
9. Final Cleanup (standalone output, xlsx install, TS check, drizzle generate)

## Response snapshot

All 9 tasks implemented:

- TASK 1: Removed socialProviders.google from auth.ts and auth-edge.ts. SocialLoginButton replaced with null stub. Login page rebuilt without Google button or register link. Register page redirects to /login.

- TASK 2: Landing page with server-side session redirect, sticky nav, hero, 6-feature grid, footer using CSS variables.

- TASK 3: Secret /admin?key=... page with 404 fallback. Admin client with user create/delete. Two API routes (create-user-secret, delete-user-secret) protected by ADMIN_SECRET_KEY env var. ADMIN_SECRET_KEY added to .env.local.

- TASK 4: Members page replaced with redirect to /dashboard. RoleGate.tsx replaced with passthrough component. Sidebar already had no org/member links.

- TASK 5: GET /api/clients/export returns CSV of active clients. ClientExportButton dropdown added to clients page header.

- TASK 6: ClientValidationBadge component with idle/loading/valid/invalid/error states calling /api/fbr/verify-ntn. Added below InvoiceHeader in invoice-form-client.tsx.

- TASK 7: bulkInvoiceBatches schema created. Upload route parses CSV, validates rows, saves batch. Submit route calls /api/invoices then /api/fbr/submit for each valid row. Bulk page and client UI with 4 sections. Sidebar and invoices page updated with Bulk Upload links.

- TASK 8: Dockerfile (3-stage), docker-compose.yml with nginx service, .dockerignore, .env.production.example, nginx.conf with SSL/rate-limiting/security headers, GitHub Actions deploy workflow, /api/health endpoint, scripts/backup.sh.

- TASK 9: next.config.ts output=standalone added. xlsx installed. GOOGLE auth removed from auth-edge.ts. TypeScript check passes (no source errors). drizzle-kit generate requires TTY — must be run manually.

## Outcome

- Impact: All 9 tasks complete. App is now a closed-registration platform with admin-only user creation, a public landing page, bulk invoice upload capability, and full Docker deployment infrastructure.
- Tests: TypeScript check passes with no source errors (skipLibCheck handles .next generated types).
- Files: 35 files created or modified.
- Next prompts: Run `npm run db:generate` in terminal to generate migration for bulk_invoice_batches table. Run `npx drizzle-kit push` to apply to Neon. Set ADMIN_SECRET_KEY in production env.
- Reflection: auth-edge.ts also had Google socialProviders block — caught and removed. Members-client.tsx still exists but is unreachable (no imports). Can be deleted if desired.

## Evaluation notes (flywheel)

- Failure modes observed: drizzle-kit generate requires TTY — cannot run headlessly
- Graders run and results (PASS/FAIL): tsc --noEmit (PASS with skipLibCheck)
- Prompt variant (if applicable): null
- Next experiment: Add xlsx-based template download for bulk upload to enable Excel format support
