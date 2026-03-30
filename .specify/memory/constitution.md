<!--
  ======================================================================
  SYNC IMPACT REPORT
  ======================================================================
  Version change: (new) → 3.0.0
  Modified principles: N/A (initial creation)
  Added sections:
    - 10 Core Principles (I through X)
    - Constraints (What Must NOT Happen + Behavioral Boundaries)
    - Development Workflow (7-step mandatory workflow)
    - Measurable Success Criteria
    - Governance (Amendment, Versioning, Compliance, Authority)
  Removed sections: N/A (initial creation)
  Templates requiring updates:
    - .specify/templates/plan-template.md — Constitution Check section
      references "[Gates determined based on constitution file]"
      ✅ No update needed; plan-template dynamically reads this file
    - .specify/templates/spec-template.md
      ✅ No update needed; template structure aligns with principles
    - .specify/templates/tasks-template.md
      ✅ No update needed; task phases align with workflow
  Follow-up TODOs:
    - RATIFICATION_DATE set to today (2026-02-11) as first adoption
  ======================================================================
-->

# FBR Digital Invoicing Portal Constitution

## Core Principles

### I. Clarity Above All

All work — code, structure, naming, decisions — MUST prioritize clarity.
Nothing unclear, ambiguous, or misleading may be added to the project.

- Every variable name MUST reveal intent.
- Every function name MUST describe behavior.
- Every file name MUST indicate purpose.
- If a reader needs to open a file to understand what it does,
  the name has failed.
- Write for the person who reads your code at 2am during an incident.
- If something can be misread, it will be misread.

### II. Consistency Is Mandatory

All formats, naming conventions, structural patterns, and architectural
decisions MUST remain consistent across the entire codebase.

- A single change MUST NOT introduce a new pattern unless the old
  pattern is fully migrated in the same change.
- Two ways of doing the same thing is worse than either way alone.
- Inconsistency creates confusion, confusion creates bugs, bugs
  create production incidents.

### III. Simplicity Over Complexity

The simplest solution that meets the requirement MUST be chosen.
Complexity MUST be earned by proving simpler alternatives insufficient.

- Premature abstraction is as dangerous as premature optimization.
- Do not build for imagined future requirements.
- Build for what the spec says today.
- When in doubt, choose the approach with fewer moving parts, fewer
  files, fewer dependencies, and fewer concepts a new developer
  must learn.

### IV. Purpose-Driven Development

Every file, function, component, type, and dependency MUST serve a
clear, documented purpose.

- If code cannot justify its existence by pointing to a requirement
  in the project specification, it MUST be removed.
- Speculative features are forbidden.
- Dead code is forbidden.
- Unused dependencies are forbidden.

### V. Quality Cannot Be Compromised

All contributions MUST meet established standards for clarity,
structure, correctness, and completeness.

- A feature that works but is untested is incomplete.
- A component that renders but is inaccessible is incomplete.
- An action that succeeds but skips validation is broken.
- "It works on my machine" is not a quality standard.
- Low-quality work is not permitted regardless of speed or deadlines.

### VI. Transparency of Changes

All modifications MUST be documented through meaningful commit
messages and clear descriptions.

- No silent changes, hidden logic, or undocumented behavior allowed.
- Every decision that deviates from an established pattern MUST
  include a comment explaining why.
- If someone reviewing the code would ask "why was this done this
  way," the answer MUST already be in the code.

### VII. Scalability of Structure

The project structure MUST support future expansion without breaking
existing work.

- Adding a new feature MUST require adding files, not modifying
  unrelated ones.
- The directory structure MUST remain predictable: a developer who
  has seen one feature MUST be able to find any other feature
  without searching.
- Decisions MUST consider long-term structural implications.

### VIII. Security Is Not Optional

Security MUST be built into every layer from the start, not bolted
on after the fact.

- Authentication MUST be verified on every protected endpoint,
  no exceptions.
- Authorization MUST be checked on every mutation, no exceptions.
- User input MUST be validated on the server, always. Client-side
  validation exists for user experience only and MUST NOT be trusted.
- Secrets MUST NOT appear in client-side code, version control,
  or logs.

### IX. Data Integrity Above Convenience

All calculations involving money, tax, or quantities MUST happen
on the server. Client-side calculations exist only for preview
purposes and MUST NOT be persisted or trusted.

- Financial values MUST use exact types, never floating point.
- Records that have reached a final state MUST be immutable.
  No update, no soft modification, no "just this once."
- Every mutation MUST be auditable: who changed it, when, and
  what the previous value was.

### X. Testability Is a Requirement

Every unit of behavior MUST be testable in isolation.

- If a function cannot be tested without spinning up the entire
  application, it is too tightly coupled.
- Untested code is unfinished code.
- Tests are the proof that the real work is done.
- No phase of development is complete until its tests pass.

## Constraints

Constraints prevent reasonable but wrong choices. Every constraint
below exists because its absence caused a failure in a previous build.

### What Must NOT Happen

- Do NOT generate code without reading this constitution and the
  project specification first.
- Do NOT introduce dependencies not approved in the project
  specification.
- Do NOT skip authentication checks on any protected endpoint.
- Do NOT skip input validation on any user-submitted data.
- Do NOT write database queries without scoping to the current
  tenant or organization.
- Do NOT hard-delete business records; use soft deletion.
- Do NOT expose secrets, tokens, or credentials in client-facing code.
- Do NOT leave debug logging in production code.
- Do NOT skip writing tests.
- Do NOT modify records that have reached a final state.
- Do NOT make assumptions when requirements are ambiguous; ask the
  developer instead.

### Behavioral Boundaries

- Do NOT build features not described in the project specification.
- Do NOT add abstractions "for future use" that no current
  requirement demands.
- Do NOT optimize for performance before correctness is proven.
- Do NOT sacrifice readability for cleverness.
- Do NOT duplicate functionality that already exists in the
  approved stack.
- Do NOT introduce new patterns when an existing pattern covers
  the use case.

## Development Workflow

Every change MUST follow all seven steps. No step may be deferred.

1. Read the project specification for the current phase.
2. Read this constitution in full.
3. Implement following all principles and constraints.
4. Review the work against every applicable principle.
5. Run all verification checks: type safety, unit tests,
   end-to-end tests.
6. Document what changed in a meaningful commit message.
7. Verify all acceptance criteria from the project specification
   are met.

Each phase is complete only when all seven steps are done.

## Measurable Success Criteria

The project is considered working when ALL of the following are true:

- [ ] Type checker produces zero errors.
- [ ] Unit test suite passes with at least 80% coverage on core logic.
- [ ] End-to-end test suite passes all scenarios.
- [ ] Build completes without errors.
- [ ] Application loads without console errors.
- [ ] Authentication works end to end.
- [ ] Tenant isolation holds: no user can access another
  organization's data under any circumstance.
- [ ] Accessibility standards are met across all pages.

These are not aspirational targets. They are the definition of done.

## Governance

This constitution overrules personal preference, habit, or style.
All contributors — human or AI — MUST comply strictly.

### Amendment Procedure

- Amendments require clear reasoning and documented justification.
- Only the project owner may approve amendments.
- The version number MUST be updated with every change.
- No silent or informal rule changes are permitted.
- Changes MUST be reviewed and approved before being applied.

### Versioning Policy

- **MAJOR**: Backward-incompatible governance changes such as
  removing or redefining a principle.
- **MINOR**: New principles, sections, or materially expanded
  guidance.
- **PATCH**: Clarifications, wording improvements, and
  non-semantic refinements.

### Compliance Review

- All code changes MUST verify alignment with active principles
  before being committed.
- Dead code and unused patterns MUST be removed immediately
  upon detection.

### Authoritative Source

This constitution is the single authoritative source for project
governance. When conflicts arise between this constitution and
any other document, this constitution wins.

**Version**: 3.0.0 | **Ratified**: 2026-02-11 | **Last Amended**: 2026-02-11
