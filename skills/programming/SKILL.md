---
name: programming
description: "Programming first principles for any code change — features, bugs, refactors, scripts, config, tests. Covers root-cause debugging, test quality, and verification gates. Use when writing, changing, debugging, or testing code. Dedicated review pass → code-review skill; explicit proof requests → verify-this skill."
---

# Programming

This skill sets outcomes and five absolute gates, not procedure. Choose your own path; note a deviation from a default only where a reviewer would be surprised.

## Hard gates — never bend

1. VERIFY BEFORE CLAIMING. Run the relevant gate once before your first edit to capture a baseline. Claim done/fixed/passing only after re-running it now and reading output + exit code. Compare against baseline; report pre-existing failures, don't fix them out of scope. (`references/verification-before-completion.md`)
2. NAME THE CAUSE BEFORE FIXING. State the mechanism (X→Y→Z), or explicitly label the change a stopgap with a follow-up. (`systematic-debugging/guide.md`)
3. EVERY TEST OBSERVED TO FAIL for the right reason at some point. A red test means fix the code or the test's premise. Remove a test only when the behavior it pins is intentionally gone — never to get green.
4. TESTS ASSERT REAL BEHAVIOR: observable outcomes, expected values from the source of truth. A good test fails only when the product breaks. (`references/write-tests.md`)
5. RUN REAL CHECKS. Merge gates stay on; no `--no-verify`. Safety content — security, accessibility, data-loss — outranks consistency with existing patterns, wherever it's written.

User explicitly waives a gate → comply, and state what evidence is being skipped.

Red flags a gate is about to slip: "should work", "tests were passing earlier", "this test is now obsolete", "the subagent confirmed it".

## Principles

- Least total machinery: existing sound repo code > stdlib > platform > installed dep > minimal new code. Look before writing — re-implementing what lives a few files over is the most common slop. Don't ossify a bad helper for consistency's sake.
- Smallest change is measured at the root cause, not the symptom — when the cause demands a refactor, the refactor IS the smallest safe change.
- Every changed line traces to the task. Mention unrelated issues; leave them. Reverting a bad change is always in bounds.
- Behavior change → test-first while the contract is being discovered; table-driven cases from a stated contract land together. Skipping test-first on a non-mechanical change needs a concrete reason, not "it's small". (`references/tdd-rules.md`)
- Tests follow SUT ownership: new tests for an existing type go in that type's existing test file; split only past ~500 lines or for genuinely distinct fixtures.
- Mock at system edges (network, clock, filesystem, env/config, third-party SDK) by default; mocking an internal collaborator needs a stated reason — convenience isn't one.
- Fail fast with concrete errors unless spec defines safe recovery. Comments true, timeless, minimal.
- Deliberate shortcut with a known ceiling → grep-able `ponytail:` comment naming ceiling + upgrade trigger: `# ponytail: global lock, per-account locks if throughput matters`.
- After AI-assisted edits, deslop when the diff shows odd comments, needless defensive code, type escapes, or single-use abstractions. (`references/refactoring/deslop.md`)
- Push back on speculative complexity: unused config, single-use interfaces, impossible-case handling, scaffolding "for later".
- If you need a paragraph-long comment to justify why the workaround is OK, the code is wrong — fix the code.


## Delegation

Match tier to blast radius, not task keywords; in doubt, one tier up. Delegate when handoff cost is clearly below doing it locally. Dispatch prompts must carry the gates above — subagents do not inherit this skill. Verify by reading the diff AND re-running gates yourself; a subagent's pasted output is not evidence.

Parallel workstreams: test-file contention → sequence or reassign, never a parallel test file for the same type. Don't split high-churn refactors, an in-flux shared interface, or fixtures multiple agents would rewrite.

- Adversarial review: reviewer gets the diff only — never the implementer's reasoning or self-report — and is told to assume the code is wrong. Implementer doesn't review; reviewer doesn't implement.
- Same subagent mistake twice → fix the dispatch prompt or workflow, not each output by hand.
- Mass fan-out (10+ similar items) → pilot 2-3 through the full pipeline first; serialize the conventions that emerge into a doc every dispatch prompt references.

## References — load on demand

Debugging:

- `systematic-debugging/guide.md` — root-cause workflow for bugs/test/build failures; includes report-only multi-hypothesis triage.
- `systematic-debugging/root-cause-tracing.md` — trace bugs backward to origin.
- `systematic-debugging/defense-in-depth.md` — layered validation after root cause found.
- `systematic-debugging/condition-based-waiting.md` — replace sleeps with condition polling.

Tests:

- `references/write-tests.md` — what to assert, seams/mocks, probes, falsification proof, red-test triage, review checklist.
- `references/tdd-rules.md` + `references/tdd-examples.md` — TDD rules and examples.
- `references/test-anti-patterns.md` — mock misuse, test-only prod code, coverage theater.

Quality:

- `references/verification-before-completion.md` — evidence gate details.
- `references/refactoring/clean-refactoring.md` — source-of-truth refactors, ownership, compatibility seams.
- `references/refactoring/deslop.md` — AI slop cleanup.
- `references/error-handling/silent-failures.md` — catch/fallback/retry/null review.

Design:

- `references/architecture/architecture-planning.md` — boundaries, contracts, ADRs.
- `references/design/type-design.md` — domain models, invariants, state machines.

Languages (load when repo uses them): `references/languages/go.md`, `references/languages/swift-ios.md`, `references/languages/typescript-frontend.md`.

Web (browser-rendered UI): `references/web-development.md` — semantics, forms, focus, reduced motion, layout stability, rendered verification.
