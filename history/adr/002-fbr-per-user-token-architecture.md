# ADR-002: FBR Per-User Token Architecture

> **Scope**: This ADR documents the decision cluster covering FBR API authentication strategy — specifically how FBR bearer tokens are sourced, stored, encrypted, resolved at request time, and scoped per user. This affects security architecture, business profile design, and FBR API integration behaviour.

- **Status:** Accepted
- **Date:** 2026-02-19
- **Feature:** 005-fbr-compliance-platform
- **Context:** The FBR (Federal Board of Revenue) Digital Invoicing API requires a bearer token for all requests. This token is issued by PRAL (Pakistan Revenue Automation Ltd.) per registered business entity, has a 5-year validity, and is tied to the NTN (National Tax Number) of the business. The current implementation reads `process.env.FBR_API_TOKEN` — a single shared token in the server environment — for all users. This creates a critical compliance gap: in a multi-user environment, all users' invoices are submitted under a single business NTN, which is legally incorrect. Each user (business entity) must submit invoices using their own FBR token tied to their own NTN. Additionally, the `businessProfiles` table already has `fbr_token_encrypted` (AES-256-GCM) and `fbr_token_hint` columns, and the encryption module (`src/lib/settings/encryption.ts`) already exists — the per-user token infrastructure is present but not connected to the FBR submission path.

<!-- Significance checklist
     1) Impact: Long-term security + compliance consequence ✅ — incorrect token = all invoices under wrong NTN, legally invalid
     2) Alternatives: Multiple viable approaches with tradeoffs ✅ — three evaluated
     3) Scope: Cross-cutting ✅ — affects business profile, FBR API client, submit/validate routes, encryption module -->

## Decision

Resolve FBR API bearer tokens per-user from the authenticated session's business profile, with a system-level environment variable as fallback.

- **Primary token source**: For every FBR API call (validate, submit, reference lookups that require auth), decrypt `businessProfiles.fbr_token_encrypted` for the current authenticated user using AES-256-GCM with `process.env.ENCRYPTION_KEY`. The decrypted token is used as the `Authorization: Bearer <token>` header.
- **Fallback**: If the user has no stored FBR token (`fbr_token_encrypted` is null), fall back to `process.env.FBR_API_TOKEN`. This preserves system-level sandbox testing capability and avoids breaking existing flows during migration.
- **FBR client signature change**: `src/lib/fbr/api-client.ts` is updated to accept an optional `userId: string` parameter. When provided, the client fetches and decrypts the user's business profile token server-side. When not provided, the env var is used.
- **Token never leaves server**: The decrypted FBR token exists only in server memory during request processing. It is never returned in API responses, never logged, never stored in cookies or localStorage.
- **Token hint for UI**: `business_profiles.fbr_token_hint` (last 4 characters of the plain token) is the only value shown in the Business Settings UI — confirming a token is stored without exposing it.
- **Encryption at rest**: AES-256-GCM with a per-deployment `ENCRYPTION_KEY` (32-byte hex). The encryption module (`src/lib/settings/encryption.ts`) is already implemented and used for this purpose.
- **Error when no token**: If neither user token nor env var is available, the submit route returns `400 FBR_TOKEN_MISSING` with a user-facing message directing the user to Business Settings.

## Consequences

### Positive

- **Legal compliance**: Each invoice is submitted under the correct business NTN/token. Eliminates the shared-token compliance gap.
- **User autonomy**: Each user manages their own FBR token lifecycle. Token renewal does not require server redeployment.
- **Zero new infrastructure**: Encryption module, `fbr_token_encrypted` column, and `fbr_token_hint` column are already in place. This decision connects existing pieces rather than building new ones.
- **Security**: Token encrypted at rest with AES-256-GCM. Token never transmitted over wire in plaintext. Token never appears in logs (Constitution Principle VIII).
- **Backwards compatible**: System-level fallback preserves existing sandbox testing flows. No existing functionality breaks if users have no stored token.
- **Constitution compliance**: Satisfies Principle VIII (Security) — secrets at rest, never in client code; Principle IX (Data Integrity) — server-side resolution, no client exposure.

### Negative

- **Extra DB query per FBR request**: Each FBR API call now requires fetching and decrypting the business profile before the actual FBR call. Mitigation: business profile is already queried for invoice creation; can be passed in context rather than re-fetched.
- **User configuration burden**: Users must set their FBR token in Business Settings before invoices can be submitted. A missing token produces an error at submit time (not at invoice creation time). Mitigation: clear error message + direct link to settings; token hint shows in Business Settings when set.
- **Key rotation complexity**: If `ENCRYPTION_KEY` needs rotation, all stored `fbr_token_encrypted` values must be re-encrypted with the new key. This requires a coordinated migration script. Mitigation: document rotation procedure in runbook.
- **Single-key encryption**: All users' tokens are encrypted with the same deployment key (not per-user keys). A key compromise exposes all stored tokens. Mitigation: key stored only in env var, never in codebase; access restricted to server process.

## Alternatives Considered

**Alternative A: Shared system token (current approach, keep unchanged)**
- Approach: All users submit invoices using `FBR_API_TOKEN` from env. One token for all users.
- Why rejected: Legally invalid — all invoices are attributed to a single NTN regardless of the actual business submitting. In a multi-user environment this creates compliance and audit failures. Also, token renewal requires a server redeployment.

**Alternative B: Per-user token with external vault (HashiCorp Vault / AWS Secrets Manager)**
- Approach: Store FBR tokens in an external secret vault keyed by user ID. Fetch from vault on each FBR request.
- Why rejected: Over-engineered for the current scale. Adds operational complexity (vault provisioning, secret rotation policies, network latency). AES-256-GCM with a deployment key achieves the same at-rest protection with zero new infrastructure. Per Principle III (Simplicity): simpler solution sufficient.

**Alternative C: Per-user token with server-side session cache (Redis/memory)**
- Approach: Decrypt token once per session, cache decrypted value in Redis or in-memory LRU cache.
- Why rejected: Caching decrypted secrets violates the principle of minimal exposure window. The extra DB query is negligible compared to the FBR API network latency (>100ms). Caching also complicates token invalidation (user changes their token; cache is stale). Adds `ioredis` or equivalent dependency with no justified benefit.

## References

- Feature Spec: `specs/005-fbr-compliance-platform/spec.md` (FR-007, FR-027, FR-028, FR-029, FR-031)
- Implementation Plan: `specs/005-fbr-compliance-platform/plan.md` (Phase 6)
- Research: `specs/005-fbr-compliance-platform/research.md` (Decision 9: FBR API Integration Status)
- Encryption module: `src/lib/settings/encryption.ts`
- Business profile schema: `src/lib/db/schema/business-profiles.ts` (`fbr_token_encrypted`, `fbr_token_hint`)
- FBR API client: `src/lib/fbr/api-client.ts` (to be modified)
- FBR submit route: `src/app/api/fbr/submit/route.ts` (to be modified)
- Related ADRs: ADR-001 (Draft Storage Server Migration)
- Evaluator Evidence: `history/prompts/005-fbr-compliance-platform/002-fbr-compliance-platform-architecture-plan.plan.prompt.md`
