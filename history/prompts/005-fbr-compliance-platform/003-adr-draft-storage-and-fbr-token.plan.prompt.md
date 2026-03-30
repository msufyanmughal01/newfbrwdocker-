---
id: 003
title: ADR Draft Storage and FBR Token
stage: plan
date: 2026-02-19
surface: agent
model: claude-sonnet-4-6
feature: 005-fbr-compliance-platform
branch: 005-fbr-compliance-platform
user: System Inn
command: /sp.adr
labels: ["adr","draft-storage","fbr-token","security","architecture","indexeddb"]
links:
  spec: specs/005-fbr-compliance-platform/spec.md
  ticket: null
  adr: history/adr/001-draft-storage-server-migration.md
  pr: null
files:
  - history/adr/001-draft-storage-server-migration.md
  - history/adr/002-fbr-per-user-token-architecture.md
  - history/adr/
tests:
  - Significance test: ADR-001 — PASS (all 3 criteria met)
  - Significance test: ADR-002 — PASS (all 3 criteria met)
---

## Prompt

/sp.adr draft-storage-server-migration
(followed by: /sp.adr fbr-per-user-token-architecture)

## Response snapshot

Created history/adr/ directory (did not previously exist). Created 2 ADRs, 0 existing conflicts.

**ADR-001: Draft Storage Server Migration**
- Decision: Migrate draft persistence from IndexedDB (client-side) to server-side PostgreSQL exclusively; remove IndexedDB draft recovery useEffect from InvoiceFormClient; server-side drafts via /api/invoices with status='draft' as single source of truth; manual save only; draft ID held in React state for active session only.
- Significance: Fixes root cause of draft popup bug; cross-device consistency; simpler code (80 lines deleted); Constitution III + IX compliance.
- Alternatives rejected: Fix popup only (symptom, not cause); bidirectional sync (over-complex); IndexedDB as sole source (no SSR, no cross-device).

**ADR-002: FBR Per-User Token Architecture**
- Decision: Resolve FBR bearer token per-user from businessProfiles.fbr_token_encrypted (AES-256-GCM decrypt); fallback to FBR_API_TOKEN env var; token never leaves server; hint shown in UI; 400 FBR_TOKEN_MISSING when no token available.
- Significance: Legal compliance (invoices under correct NTN per user); zero new infrastructure (encryption module + columns already exist); security boundary maintained.
- Alternatives rejected: Shared system token (legally invalid multi-user); external vault (over-engineered); Redis cache (unnecessary exposure window, adds dependency).

## Outcome

- ✅ Impact: 2 ADRs created documenting cross-cutting architectural decisions; all decision rationale, tradeoffs, and alternatives captured for future reference
- 🧪 Tests: Significance test — ADR-001 PASS, ADR-002 PASS (all 3 criteria: impact, alternatives, cross-cutting scope)
- 📁 Files: history/adr/001-draft-storage-server-migration.md, history/adr/002-fbr-per-user-token-architecture.md
- 🔁 Next prompts: /sp.tasks — generate testable implementation task list
- 🧠 Reflection: Both ADRs connected existing code (IndexedDB module, encryption module, business profile columns) to decisions rather than introducing new patterns. ADR template is well-suited; create-adr.sh script not present so agent-native creation used.

## Evaluation notes (flywheel)

- Failure modes observed: create-adr.sh bash script not found; history/adr/ directory did not exist. Both handled gracefully — directory created, ADRs written with agent-native tools.
- Graders run and results (PASS/FAIL): Significance test — ADR-001 PASS, ADR-002 PASS
- Prompt variant (if applicable): Two /sp.adr commands handled in single response (second arrived mid-execution)
- Next experiment (smallest change to try): Run /sp.tasks to generate task breakdown
