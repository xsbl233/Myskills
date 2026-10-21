# Evidence: agent-authored tests

Source: Chen, Sun, Shi, Peng, Gu, Lo, Jiang. *Rethinking the Value of Agent-Generated Tests
for LLM-Based Software Engineering Agents.* arXiv:2602.07900v2 (submitted 2026-02-08, revised
2026-04-09).

## Setup

- Benchmark: SWE-bench Verified (500 instances, 12 Python repos).
- Scaffold: mini-SWE-agent — bash tool only, no dedicated testing tool, no enforced test stage.
  The only testing cue is an advisory line in the default prompt.
- Models: six representative families, highest-ranked model of each.

## Test-writing frequency (Table 1 of the paper)

| Model | Resolved | Tasks with tests | Mean tests per task* |
|---|---|---|---|
| Claude Opus 4.5 | 74.4% | 83.0% | 3.52 |
| Gemini 3 Pro | 74.2% | 61.6% | 2.05 |
| GPT-5.2 | 71.8% | 0.6% | 1.00 |
| Kimi K2 Thinking | 63.4% | 97.4% | 3.61 |
| MiniMax M2 | 61.0% | 98.6% | 5.19 |
| DeepSeek v3.2 Reasoner | 60.0% | 89.2% | 3.75 |

\* Among tasks that write at least one test artifact.

Within a model, resolved and unresolved tasks have similar test-writing rates; unresolved tasks
sometimes write more tests, which the authors read as harder tasks triggering trial and error.

## What the tests contain

Value-revealing print statements consistently outnumber assertion-based checks. Assertions are
dominated by local-property checks and exact-value comparisons. In other words, the tests
function mainly as an observation channel during patch development.

## Prompt intervention (four models)

Encouraging or suppressing new test files changed resolution only slightly, while changing cost
materially:

- inducing test writing: higher token and interaction overhead, no success gain;
- suppressing test writing: large cost reduction, modest success drop.

The paper's summary sentence: current agent-written testing practices "reshape process and cost
more than final task outcomes". It frames test writing as a model-dependent process style, not a
capability driver.

## Caveats before generalizing

- One benchmark, Python repositories, one light bash-only scaffold. A scaffold that forces tests
  (for example a test-first workflow with separate sub-agents) is a different regime and can
  behave differently.
- The study covers *agent-authored* tests only. Human-written or hidden tests used as an oracle
  are not the same treatment and are widely reported to help.
- The finding is about averages and significance, not a claim that tests never help a specific
  task. The paper itself explores which issue types may benefit.

## How the skill uses this

- Default to throwaway probes instead of committed tests: probes capture the observational value
  the paper measures, without paying for test assets the paper finds unproductive.
- Keep the real oracle external: existing suite, user reproduction, hidden tests.
- Treat test authoring as a budget decision, not a habit.
