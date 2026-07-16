---
name: requirements-to-delivery
description: Turn a software request into a verified implementation through structured requirement decomposition, user alignment, architecture and module planning, incremental development, module tests, workflow tests, and final acceptance. Use when Codex is asked to build or substantially change software and the work should proceed from requirements through planning, implementation, and testing, especially for multi-module features or requests that are incomplete or ambiguous.
---

# Requirements to Delivery

Drive a software request from intent to tested delivery. Preserve traceability from every requirement to its design, implementation, and verification evidence.

## Operating rules

- Inspect the repository, its instructions, current architecture, tests, and working-tree state before proposing changes.
- Treat existing user changes as authoritative and avoid unrelated edits.
- Maintain a live requirement checklist and development plan. Update them when evidence changes the plan.
- Ask only questions whose answers materially affect scope, behavior, architecture, compatibility, security, data, or acceptance. Group related questions and offer a recommended default when useful.
- Do not implement a materially ambiguous requirement. Continue with unaffected work while waiting when possible.
- State reasonable, low-risk assumptions explicitly and record them in the requirement list.
- Discover and invoke applicable installed skills for specialized implementation or testing work. Read each selected skill completely, announce its use, and follow its instructions. Use the smallest set that covers the task.
- Validate after every coherent development step; do not defer all testing to the end.
- Never claim completion without showing verification evidence and identifying any unverified area.

## Phase 1: Decompose and align requirements

1. Inspect relevant source files, documentation, configuration, schemas, tests, and recent local context.
2. Convert the request into atomic requirement IDs such as `REQ-01`. For each requirement capture:
   - desired behavior and user value;
   - inputs, outputs, states, and business rules;
   - boundaries, failure behavior, and edge cases;
   - affected users, interfaces, data, integrations, and compatibility constraints;
   - non-functional needs such as security, performance, accessibility, observability, and maintainability when relevant;
   - explicit acceptance criteria that can be tested;
   - status: confirmed, assumed, or blocked by a question.
3. Identify contradictions, missing decisions, hidden dependencies, and out-of-scope items.
4. Align with the user on material uncertainties before dependent implementation. If no material uncertainty remains, say so and proceed without asking ceremonial questions.
5. Establish a compact traceability table:

   `Requirement -> Design/module -> Implementation step -> Test/evidence`

## Phase 2: Design the development plan

Create an actionable plan before editing code. Include:

- the implementation sequence and dependency order;
- architecture and data-flow impact;
- module boundaries, responsibilities, and public interfaces;
- data model, API, configuration, migration, and compatibility changes when applicable;
- error handling, security, logging, performance, and rollback considerations when applicable;
- files or areas expected to change;
- the test strategy for each module and for end-to-end workflows;
- completion criteria and verification commands for each step.

Keep steps independently verifiable and sized around coherent modules or behavior slices. Mark exactly one step in progress when the planning tool is available. Revise the plan when repository evidence invalidates an assumption, and explain the revision.

## Phase 3: Implement incrementally

For each planned step:

1. Reconfirm its linked requirement IDs and acceptance criteria.
2. Inspect the exact code paths and tests involved.
3. Implement the smallest coherent change that completes the step, following local conventions.
4. Add or update tests in the same step.
5. Avoid speculative abstractions and scope expansion. Record newly discovered follow-up work separately unless it is necessary for correctness.
6. Update requirement and plan status only after the step passes its verification gate.

Use specialized development skills when they clearly apply, but retain responsibility for integrating their outputs with the overall plan and traceability table.

## Phase 4: Verify every step

After each implementation step, run the narrowest relevant checks first:

1. static checks such as formatting, linting, type checking, schema validation, or compilation;
2. focused unit or component tests for the changed module;
3. integration tests across changed boundaries;
4. the relevant user workflow or process test;
5. broader regression tests in proportion to impact.

When a check fails, diagnose the failure, distinguish product defects from environment or pre-existing failures, fix in-scope defects, and rerun the failed check plus affected regressions. Do not advance the step while required checks fail.

Use applicable testing skills when available. Preserve concrete evidence: command, result, and any limitation. For UI or document output, perform visual verification when layout or interaction matters.

## Final acceptance gate

Before finishing:

- reconcile every requirement ID with implementation and test evidence;
- run the combined workflow tests and an appropriate regression suite;
- review the diff for unintended changes, compatibility risks, secrets, debug artifacts, and missing documentation;
- confirm migrations, generated artifacts, and deployment or rollback notes when relevant;
- report delivered behavior, key files changed, verification results, assumptions, and remaining risks or blockers.

Classify the outcome accurately:

- **Complete:** all required acceptance criteria are implemented and verified.
- **Partially complete:** useful in-scope work is finished but named criteria remain.
- **Blocked:** progress requires a user decision, authority, unavailable dependency, or external-state change.

Never use passing unit tests alone as evidence that a multi-module user workflow is complete.
