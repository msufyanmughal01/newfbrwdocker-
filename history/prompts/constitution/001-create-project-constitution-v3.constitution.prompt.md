---
id: 001
title: Create Project Constitution v3
stage: constitution
date: 2026-02-11
surface: agent
model: claude-opus-4-6
feature: none
branch: main
user: System Inn
command: /sp.constitution
labels: ["constitution", "governance", "project-setup"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - N/A
---

## Prompt

Project Constitution
Version 3.0.0
This constitution is the authoritative governance document for the entire project. It overrules personal preference, habit, style, and any other project document. When conflicts arise, this file wins. Claude Code must read this file in full before generating any code, creating any file, or making any architectural decision.

Core Principles
I. Clarity Above All
All work, whether code, structure, naming, or decisions, must prioritize clarity. Nothing unclear, ambiguous, or misleading may be added to the project. If something can be misread, it will be misread. Write for the person who reads your code at 2am during an incident. Every variable name must reveal intent. Every function name must describe behavior. Every file name must indicate purpose. If a reader needs to open a file to understand what it does, the name has failed.
II. Consistency Is Mandatory
All formats, naming conventions, structural patterns, and architectural decisions must remain consistent across the entire codebase. A single change must not introduce a new pattern unless the old pattern is fully migrated in the same change. Two ways of doing the same thing is worse than either way alone. Inconsistency creates confusion, confusion creates bugs, bugs create production incidents.
III. Simplicity Over Complexity
The simplest solution that meets the requirement must be chosen. Complexity must be earned by proving that simpler alternatives are insufficient. Premature abstraction is as dangerous as premature optimization. Do not build for imagined future requirements. Build for what the spec says today. When in doubt, choose the approach with fewer moving parts, fewer files, fewer dependencies, and fewer concepts a new developer must learn.
IV. Purpose-Driven Development
Every file, function, component, type, and dependency must serve a clear, documented purpose. No feature, file, or section may exist without explicit intent and value. If a piece of code cannot justify its existence by pointing to a requirement in the project specification, it must be removed. Speculative features are forbidden. Dead code is forbidden. Unused dependencies are forbidden.
V. Quality Cannot Be Compromised
All contributions must meet established standards for clarity, structure, correctness, and completeness. Low-quality work is not permitted, regardless of speed or deadlines. A feature that works but is untested is incomplete. A component that renders but is inaccessible is incomplete. An action that succeeds but skips validation is broken. "It works on my machine" is not a quality standard.
VI. Transparency of Changes
All modifications must be documented through meaningful commit messages and clear descriptions. No silent changes, hidden logic, or undocumented behavior are allowed. Every decision that deviates from an established pattern must include a comment explaining why. If someone reviewing the code would ask "why was this done this way," the answer must already be in the code.
VII. Scalability of Structure
The project structure must support future expansion without breaking existing work. Decisions must consider long-term implications. Adding a new feature should require adding files, not modifying unrelated ones. The directory structure must remain predictable: a developer who has seen one feature should be able to find any other feature without searching.
VIII. Security Is Not Optional
Security must be built into every layer from the start, not bolted on after the fact. Authentication must be verified on every protected endpoint, no exceptions. Authorization must be checked on every mutation, no exceptions. User input must be validated on the server, always. Client-side validation exists for user experience only and must never be trusted. Secrets must never appear in client-side code, version control, or logs.
IX. Data Integrity Above Convenience
All calculations involving money, tax, or quantities must happen on the server. Client-side calculations exist only for preview purposes and must never be persisted or trusted. Financial values must use exact types, never floating point. Records that have reached a final state must be immutable. No update, no soft modification, no "just this once." Immutable means immutable. Every mutation must be auditable. If something changed, there must be a record of who changed it, when, and what the previous value was.
X. Testability Is a Requirement
Every unit of behavior must be testable in isolation. If a function cannot be tested without spinning up the entire application, it is too tightly coupled. Untested code is unfinished code. Tests are not a chore that happens after the real work. Tests are the proof that the real work is done. No phase of development is complete until its tests pass.

Constraints
Constraints are often more important than requirements. They prevent reasonable but wrong choices. Every constraint below exists because its absence caused a failure in a previous build.
What Must NOT Happen
Do not generate code without reading this constitution and the project specification first. Do not introduce dependencies not approved in the project specification. Do not skip authentication checks on any protected endpoint. Do not skip input validation on any user-submitted data. Do not write database queries without scoping to the current tenant or organization. Do not hard-delete business records; use soft deletion. Do not expose secrets, tokens, or credentials in client-facing code. Do not leave debug logging in production code. Do not skip writing tests. Do not modify records that have reached a final state. Do not make assumptions when requirements are ambiguous; ask the developer instead.
Behavioral Boundaries
Do not build features not described in the project specification. Do not add abstractions "for future use" that no current requirement demands. Do not optimize for performance before correctness is proven. Do not sacrifice readability for cleverness. Do not duplicate functionality that already exists in the approved stack. Do not introduce new patterns when an existing pattern covers the use case.

Development Workflow
Read the project specification for the current phase. Read this constitution in full. Implement following all principles and constraints. Review the work against every applicable principle. Run all verification checks: type safety, unit tests, end-to-end tests. Document what changed in a meaningful commit message. Verify all acceptance criteria from the project specification are met.

Measurable Success Criteria
The project is considered working when all of the following are true: the type checker produces zero errors, the unit test suite passes with at least 80 percent coverage on core logic, the end-to-end test suite passes all scenarios, the build completes without errors, the application loads without console errors, authentication works end to end, tenant isolation holds such that no user can access another organization's data under any circumstance, and accessibility standards are met across all pages.

Governance
This constitution overrules personal preference, habit, or style. All contributors, whether human or AI, must comply strictly. Amendment Procedure: Amendments require clear reasoning and documented justification. Only the project owner may approve amendments. The version number must be updated with every change. Versioning Policy: MAJOR for backward-incompatible governance changes, MINOR for new principles or sections, PATCH for clarifications and wording. This constitution is the single authoritative source for project governance.

## Response snapshot

Created the FBR Digital Invoicing Portal Constitution v3.0.0 at `.specify/memory/constitution.md`. The constitution contains 10 core principles (Clarity, Consistency, Simplicity, Purpose-Driven Development, Quality, Transparency, Scalability, Security, Data Integrity, Testability), a Constraints section (What Must NOT Happen + Behavioral Boundaries), a 7-step Development Workflow, Measurable Success Criteria checklist, and full Governance section. All placeholder tokens from the template were replaced. Sync Impact Report embedded as HTML comment. All dependent templates verified — no updates required.

## Outcome

- Impact: Created authoritative governance document for the FBR Digital Invoicing Portal project
- Tests: N/A (governance document, no code)
- Files: .specify/memory/constitution.md (created)
- Next prompts: /sp.specify to create feature specs, /sp.plan for implementation planning
- Reflection: User provided comprehensive constitution content; template expanded from 6 to 10 principles to match input

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Manual validation PASS — no unresolved placeholders, version matches, dates ISO format
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
