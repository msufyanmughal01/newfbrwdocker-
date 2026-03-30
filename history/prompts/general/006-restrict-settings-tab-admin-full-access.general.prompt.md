---
id: 006
title: Restrict Settings Tab and Give Admin Full User Settings Access
stage: general
date: 2026-03-30
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: System Inn
command: inline chat
labels: ["settings","admin","access-control","logo-upload"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/components/dashboard/Sidebar.tsx
  - src/components/settings/BusinessProfileForm.tsx
  - src/app/admin/admin-client.tsx
  - src/app/admin/page.tsx
  - src/app/api/admin/upload-user-logo/route.ts
tests:
  - none
---

## Prompt

the user setting should be from admin and the setting tab can only change the logo and there address  the setting tab and give all the access to the admin tab like all the setting of user like address and fbr token and name of user bussiness name and all

## Response snapshot

Implemented access control split between settings tab (users) and admin panel:

1. **Sidebar** — Settings link changed from `/settings/business-profile` to `/settings`
2. **BusinessProfileForm** — Stripped to logo + address only (removed business name, NTN/CNIC, province, FBR token fields)
3. **Admin EditUserPanel** — Added logo upload section with preview; logo fetched in admin page query
4. **New API** — `POST /api/admin/upload-user-logo` for admin logo uploads (adminKey + userId + file via FormData)

## Outcome

- ✅ Impact: Regular users can only update logo and address; admin has full access to all user fields
- 🧪 Tests: none run
- 📁 Files: 5 files modified/created
- 🔁 Next prompts: test admin logo upload, verify settings page restricted correctly
- 🧠 Reflection: Clean separation of concerns — user-facing settings minimal, admin panel comprehensive

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): add role-based middleware to block direct navigation to /settings/business-profile
