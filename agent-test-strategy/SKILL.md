---
name: agent-test-strategy
description: >
  Use when an agent is about to write unit tests on its own initiative while implementing a
  change or fixing a repo-level issue: decides whether tests are worth the interaction budget,
  keeps exploratory checks as throwaway probes instead of committed test files, and blocks
  self-confirming and cheating test patterns. Triggers: "should the agent write tests",
  test budget or test cost questions, agent-authored test files. Chinese sessions use
  agent-test-strategy-zh instead.
  Do NOT use when the user explicitly asks for TDD or test-first work (use
  test-driven-development), when writing tests IS the requested deliverable, or when reviewing
  an existing suite (use brooks-test).
---

# Agent Test Strategy

Chinese edition: `agent-test-strategy-zh` (equivalent content, used for Chinese sessions).

## Core stance

Three findings drive every rule below (evidence: [references/evidence.md](references/evidence.md),
read it when the user questions the cost or asks you to justify the budget):

1. **Agent-written tests rarely move the outcome.** Across six strong models on SWE-bench
   Verified, resolved and unresolved tasks show similar test-writing rates; prompting the agent
   to write more or fewer tests changed resolution only marginally, while changing cost
   substantially.
2. **Agent-written tests are observational, not verifying.** They mostly print intermediate
   values; assertions are the minority. Treat them as a debugger you can script, not as a
   correctness gate.
3. **A test you write shares your assumptions.** It can confirm that code runs, not that it is
   right. Real verification comes from an oracle you did not author: existing tests, the
   user's reproduction, hidden or golden tests.

So: tests are a **feedback channel with a price**, not a deliverable. Spend on them only when
the signal is worth the tokens.

## Decide first, write later

Run this before creating any test artifact:

1. **Does a usable check already exist?** Existing suite, reproduction script, or a command the
   user gave you. Run it. Do not author a parallel test.
2. **Do you only need to see a value?** Write a throwaway **probe** (see below). One probe per
   hypothesis.
3. **Does the project need permanent regression protection?** Propose the cases to the user as a
   list and wait for confirmation. Do not commit test files on your own initiative.
4. **Did the user explicitly ask for tests or TDD?** Their instruction wins — hand off to
   `test-driven-development` if they asked for test-first, or write what they asked for.

Default outcome of steps 1–3: **zero new committed test files**.

## Probe rules

A probe is an executable scratch check, not a test:

- Location: `.dsh/scratch/` or the OS temp directory. Never `tests/`, `test_*`, `*.spec.*`,
  `__tests__/`.
- Shape: prints the values you need; assertions optional and local. No fixtures, no mocks, no
  framework setup.
- Lifetime: delete it, or leave it out of version control. It must not ship.
- Never edit an existing test to make a probe easier, and never modify assertions.

## Stop conditions

- One hypothesis, one probe. A second failure on the same hypothesis is a signal to stop and
  report what you observed, not to widen the test surface.
- Asking for more tests is not a way to raise confidence; it raises token spend. If you cannot
  name the decision a test would change, do not write it.
- When the budget is tight, suppress test authoring first: the evidence says success drops only
  modestly while cost drops a lot.

## Red flags — stop and reconsider

- `assertNotNull(x)` or `assertDoesNotThrow(...)` as the only assertion.
- Asserting internal call counts or call order (`verify(...)`), which breaks on refactors.
- Mocking the business logic under test instead of only external I/O.
- Commenting out or weakening an assertion, adding test-specific branches, or changing
  implementation semantics just to make a check pass. This is grader gaming and it is recorded
  in evaluation audits; do not do it silently.
- Writing tests to "prove" a fix you already believe in.

## When tests are the deliverable

- Ask for the case list first: behavior, boundary, failure path. Get confirmation, then write.
- One behavior per test; assert business values; mock only external boundaries.
- Self-check before committing: would this test fail if the implementation were wrong, and would
  it survive a refactor of internals? If either answer is no, fix or drop it.

## Handoff

- User wants strict TDD or test-first: `test-driven-development`.
- Reviewing or repairing an existing suite: `brooks-test`.
- Verification before claiming completion is still `verification-before-completion`; this skill
  only governs whether you author tests, not whether you prove the work.

## One example

Bug: `parse_duration("90m")` returns 5400 instead of 5400 seconds vs minutes confusion.

- Wrong: create `tests/test_parse_duration.py` with five tests, run them, report "all tests pass".
  Cost paid, oracle is your own assumption.
- Right: run the existing suite; if nothing covers it, write
  `.dsh/scratch/probe_duration.py` that prints `parse_duration("90m")` and the expected value,
  fix, re-run the probe, delete it. If the fix deserves permanent protection, propose two cases
  to the user and let them decide.
