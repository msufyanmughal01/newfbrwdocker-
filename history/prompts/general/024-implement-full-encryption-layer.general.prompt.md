---
id: "024"
title: Implement full encryption layer — transit + at-rest
stage: general
date: 2026-04-05
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: System Inn
command: implement / continue
labels: ["encryption","security","at-rest","transit","ecdh","aes-256-gcm","migration"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/lib/crypto/symmetric.ts (created — AES-256-GCM at-rest utility)
  - src/lib/crypto/transit-server.ts (created — ECDH P-256 server decrypt)
  - src/lib/crypto/transit-client.ts (created — ECDH P-256 client encrypt)
  - src/lib/crypto/with-decryption.ts (created — HOC; updated type for Next.js 15 Promise params)
  - src/app/api/crypto/pubkey/route.ts (created — exposes server public JWK)
  - src/lib/auth.ts (edited — AES-256-GCM password storage with plain-text legacy fallback)
  - src/app/api/admin/user-password/route.ts (edited — decrypt before returning)
  - src/app/api/admin/reset-user-password/route.ts (edited — encrypt before saving)
  - src/lib/db/schema/business-profiles.ts (edited — varchar(13) → text for ntnCnic, cnic)
  - src/lib/db/schema/clients.ts (edited — varchar(13) → text for ntnCnic)
  - src/lib/db/schema/invoices.ts (edited — varchar(13) → text for sellerNTNCNIC, buyerNTNCNIC)
  - drizzle/0003_encrypt_ntn_cnic_fields.sql (created — ALTER TABLE migration)
  - src/lib/clients/client-service.ts (edited — encryptData on write, decryptData on read)
  - src/lib/settings/business-profile.ts (edited — encryptData ntnCnic/cnic on write, decryptProfile on read)
  - src/app/api/invoices/route.ts (edited — withDecryption POST, encryptData NTN fields, decryptData in GET)
  - src/app/api/clients/route.ts (edited — withDecryption POST)
  - src/app/api/clients/[id]/route.ts (edited — inline decrypt on PUT)
  - src/app/api/settings/business-profile/route.ts (edited — withDecryption PUT)
  - src/app/api/fbr/submit/route.ts (edited — withDecryption POST)
  - src/app/api/admin/update-user-profile/route.ts (edited — encryptData ntnCnic, cnic)
  - src/app/(dashboard)/invoices/invoice-form-client.tsx (edited — encryptedPost for invoice + fbr/submit)
  - src/components/settings/BusinessProfileForm.tsx (edited — encryptedPut for address save)
tests:
  - npx tsc --noEmit → exit 0, zero errors
---

## Prompt

implement

(Continuation of session 63f2e14a — implementing section 11 gaps from architecture document: encrypt NTN/CNIC fields at rest, wrap API routes with withDecryption HOC, switch client forms to encryptedPost/encryptedPut.)

## Response snapshot

Implemented the complete two-layer encryption architecture:

**Transit layer (ECDH + AES-256-GCM):**
- `withDecryption()` HOC wraps POST/PUT handlers on `/api/invoices`, `/api/clients`, `/api/clients/[id]`, `/api/settings/business-profile`, `/api/fbr/submit`
- Client forms in `invoice-form-client.tsx` and `BusinessProfileForm.tsx` use `encryptedPost()`/`encryptedPut()`
- HOC type updated to `{ params: Promise<Record<string, string>> }` to match Next.js 15

**At-rest layer (AES-256-GCM via `encryptData`/`decryptData`):**
- `businessProfiles.ntnCnic`, `businessProfiles.cnic` — encrypted on write, decrypted on read
- `clients.ntnCnic` — encrypted on write, decrypted on read
- `invoices.sellerNTNCNIC`, `invoices.buyerNTNCNIC` — encrypted on insert, decrypted in GET list
- `auth.account.password` — encrypted via `betterAuth` custom hash hook, legacy plain-text fallback in verify
- Admin: `reset-user-password` encrypts before saving; `user-password` decrypts before returning

**Schema migration:**
- `drizzle/0003_encrypt_ntn_cnic_fields.sql` widens all five NTN/CNIC varchar(13) columns to text

## Outcome

- ✅ Impact: All sensitive identity fields (NTN, CNIC, passwords) are now AES-256-GCM encrypted at rest; all mutation API routes accept ECDH-encrypted transit payloads — plaintext never travels in HTTP body
- 🧪 Tests: `npx tsc --noEmit` → exit 0, zero errors
- 📁 Files: 22 files created or modified
- 🔁 Next prompts: Run DB migration (`drizzle/0003_encrypt_ntn_cnic_fields.sql`) in production; set `ENCRYPTION_KEY` and `ECDH_PRIVATE_KEY_HEX` env vars; consider encrypting `fbrResponseMessage` / `fbrPayload` jsonb
- 🧠 Reflection: varchar(13) constraint was the critical blocker — had to migrate schema before encryption could be stored. Next.js 15 Promise-params type mismatch required updating the HOC signature.

## Evaluation notes (flywheel)

- Failure modes observed: HOC ctx type incompatible with Next.js 15 Promise<params> — caught by tsc, fixed in with-decryption.ts
- Graders run and results (PASS/FAIL): tsc --noEmit PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add integration test that posts encrypted payload and verifies DB stores ciphertext, not plaintext
