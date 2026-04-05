---
id: "028"
title: Code Review FBR API Integration vs DI Spec v1.12
stage: general
date: 2026-04-05
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: System Inn
command: /engineering:code-review
labels: ["fbr","api-integration","code-review","security","correctness"]
links:
  spec: "Technical Documentation for DI API V1.12.pdf"
  ticket: null
  adr: null
  pr: null
files:
  - src/lib/fbr/post-invoice.ts
  - src/lib/fbr/validate.ts
  - src/lib/fbr/error-codes.ts
  - src/lib/fbr/submission-service.ts
  - src/lib/fbr/api-client.ts
  - src/lib/invoices/fbr-mapping.ts
  - src/app/api/fbr/submit/route.ts
  - src/app/api/fbr/validate-ntn/route.ts
tests:
  - none run
---

## Prompt

@C:\Users\System Inn\Downloads\Technical Documentation for DI API V1.12.pdf /engineering:code-review  the attach file is have all the technical info of fbr api integration read that and review my code is they will produce any issue after deployment

## Response snapshot

Reviewed all FBR integration code against the DI API v1.12 specification. Found 4 critical, 2 high, 2 medium issues.

**Critical (deployment blockers):**
1. `post-invoice.ts:51` — FBR POST response wraps status inside `validationResponse` object. Code checks `raw.statusCode` which is always `undefined`. Every successful submission throws FBRSubmissionError.
2. `validate.ts:64` — Same root cause. Validate response is wrapped. `valid` is always `false`, always returns generic error 0113.
3. `error-codes.ts` — Entire error catalog is misaligned with spec. Codes 0008–0043 have wrong messages and wrong fieldPaths (appear to be invented, not from spec).
4. `uom` vs `uoM` field name — Spec requires `uoM` (case-sensitive JSON key), code sends `uom`. FBR rejects every line item with error 0024.

**High:**
5. `validate.ts:70` — OR logic for `valid` check; statusCode "00" with status "invalid" (item errors) would pass as valid after shape fix.
6. `validate-ntn/route.ts` — NTN validation is a stub returning 501; real endpoints (5.11 STATL, 5.12 Get_Reg_Type) not implemented.

**Positive:** Transaction boundary design, retry logic, sandbox routing, and token resolution are all correct.

**Verdict:** Request Changes. Issues #1 and #2 are complete blockers — no invoice can be submitted or validated.

## Outcome

- ✅ Impact: Identified 4 critical deployment-blocking bugs. The API integration will fail on every invoice submission and validation until issues #1 and #2 are fixed.
- 🧪 Tests: none run
- 📁 Files: read-only review, no modifications made
- 🔁 Next prompts: Fix post-invoice.ts and validate.ts response unwrapping; re-map error-codes.ts from spec; rename uom→uoM
- 🧠 Reflection: The response shape bugs (#1, #2) are the same root cause — the FBR API response wraps the validation result in a `validationResponse` key, but both callers cast the root response as if it IS the validation result. The error catalog (#3) appears to have been written independently of the spec document.

## Evaluation notes (flywheel)

- Failure modes observed: PDF could not be read with standard tool (no pdftoppm); had to use subagent
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment: Fix the response unwrapping in both post-invoice.ts and validate.ts, then fix uoM field name, then rebuild error catalog from spec
