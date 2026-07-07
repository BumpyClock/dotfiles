---
name: programming
description: "Guides production code changes: root-cause debugging, TDD, test quality, verification gates, delegation, and code standards. Use when implementing features, fixing bugs, refactoring, or writing or reviewing code and tests."
---

# Programming

Build prod code. Smallest safe change. Preserve behavior unless req/test/doc says change.

## Core

Simplicity ladder, always on:

1. No code if need is speculative or already covered.
2. Existing code in this repo: helper, util, type, or pattern already here. Look before writing; re-implementing what lives a few files over is the most common slop.
3. Standard library.
4. Native platform/framework feature.
5. Already-installed dependency.
6. Tiny local helper or direct line.
7. Minimum new code.

First rung that holds wins.

Tie-breaks:

- Safety beats brevity: validation at trust boundaries, security, accessibility basics, data-loss prevention, explicit reqs, tests, fresh verification.
- Existing code patterns beat generic minimalism when consistency lowers maintenance cost.
- New deps only when stdlib/native/existing deps fall short and custom ownership costs more.
- Fewest clear ownership boundaries beats fewest files.

Push back when req implies needless complexity: speculative features, single-use interfaces, unused config, impossible-case handling, scaffolding "for later".

Rules in this skill are strong defaults, not ceremony. Hard gates stay absolute: fresh verification evidence before success claims, named root cause before fixes, no coverage-theater tests, no bypassing merge checks. Everything else bends to judgment — deviate when the situation warrants, and state the deviation plus reason so it's reviewable.

## Workflow

1. Read relevant repo docs/instructions. Load refs from References only when task needs them.
2. State assumptions. Multiple plausible meanings → offer options + rec. Ask only when unsafe to assume.
3. Nontrivial task → plan scope, success criteria, test strategy.
4. Bugs/failures → reproduce, find root cause, fix at source (`systematic-debugging/guide.md`).
5. Behavior change → TDD when feasible (`references/tdd-rules.md`). Skipping TDD → say why.
6. Before adding a new mechanism, search for existing owner/consumer patterns. Reuse, consolidate, or create new deliberately (`references/refactoring/clean-refactoring.md`).
7. Understand existing code purpose/structure before editing. Edit surgically: every changed line traces to req. Mention unrelated issues; leave them.
8. After AI-assisted edits, run deslop pass when diff shows odd comments, needless defensive code, type escapes, or single-use abstractions (`references/refactoring/deslop.md`).
9. Run formatter/lint/tests/docs gate relevant to change. Read output + exit code.
10. Conflicting instructions/reqs/code → call out. Order: safety rules → existing code patterns → language refs. Ask when user judgment needed.

## Delegation

Delegate when runtime permits and work parallelizes; work local for tiny tasks, urgent blockers, tight coupling. Saved multi-task plans → `subagent-driven-development` skill.

- Dispatch: `developer-lite` clear 1-2 file mechanical work; `developer` cross-module/API/schema/security/concurrency/perf/debugging; `researcher` external info; `technical-writer` public docs; `reviewer` post-impl pass, spec first then quality.
- Give subagents full context inline: task, scope, contracts, acceptance criteria, deliverable format.
- Verify delegated work yourself: diff + gates. Reports are signals, not evidence.
- Stop signs: `NEEDS_CONTEXT`, `BLOCKED`, `DONE_WITH_CONCERNS`, architectural smell changing scope → add context, split, upgrade, or ask.

## Code Rules

- Match surrounding style/format/patterns; file consistency beats outside guide.
- Preserve behavior unless req/test/doc calls for change. Breaking change allowed when it is the right fix; call it out.
- Refactor only task area; broader cleanup needs approval. Remove only imports/vars/fns your change made unused.
- Clean refactor means one concept with one clear owner. Do not layer wrappers, aliases, pass-local constants, duplicate structs, or parallel abstractions unless they are external boundaries or named short-lived compatibility seams with removal conditions.
- Fix forward. Keep existing impl unless req, root cause, or approved refactor calls for replacement; remove transitional code only after replacement works.
- Fail fast with concrete errors unless spec defines safe recovery.
- Deliberate shortcut with known ceiling → mark with grep-able `ponytail:` comment naming ceiling + upgrade trigger: `# ponytail: global lock, per-account locks if throughput matters`. No trigger named = rot. Harvest ledger anytime: `grep -rnE '(#|//) ?ponytail:' .`
- Prefer clear control flow, immutable data, explicit state transitions. Style detail: `references/refactoring/code-simplification.md`.
- Comments/docs true, timeless, concise; update user-facing docs when behavior/API changes (`references/documentation/code-documentation.md`).

## Tests

- Tests pin real behavior. Good test fails only when product behavior/contract breaks.
- Behavior change or bug fix → one focused test at a time. See it fail when feasible, make it pass, then choose next test from what you learned.
- Assert observable behavior through outermost practical entry point: return values, exit codes, persisted rows, HTTP responses, rendered output. Avoid internal-call assertions, compiler-guaranteed shapes, current config values, and count-only checks where actual values matter.
- Prefer real implementations. Mock seams only: network, clock, filesystem, process/env/config lookup, third-party SDK. If many internals need mocks, test one layer up.
- Keep tests deterministic: explicit inputs, controlled variables, seeded randomness, temp dirs/ports, no Internet, condition-based waits, close resources.
- Expected values come from the real source of truth (config, asset catalog, schema), never literals copied from production source.
- New tests for an existing type go in that type's existing test file; split only past ~500 lines or for genuinely distinct fixtures.
- Code removed → its tests removed in the same change. "Kept for coverage" is not a reason.
- Details: `references/write-tests.md`, `references/tdd-rules.md`, `references/test-anti-patterns.md`.

## Verification

Claim complete/fixed/passing only with fresh evidence from current turn: name the proving command, run it now, read output + exit code, report actual state. Full gate + evidence matrix: `references/verification-before-completion.md`.

Merge gates stay on; run the real check instead of `--no-verify`/`--skip-checks`.

## References

Load on demand; all one level deep.

Debugging:

- `systematic-debugging/guide.md` - root-cause workflow for bugs/test/build failures.
- `systematic-debugging/root-cause-tracing.md` - trace bugs backward to origin.
- `systematic-debugging/defense-in-depth.md` - layered validation after root cause found.
- `systematic-debugging/condition-based-waiting.md` - replace sleeps with condition polling.
- `issue-investigation/guide.md` - incident triage, hypothesis ranking.

Tests:

- `references/write-tests.md` - behavior-first test writing: what to assert, seams/mocks, probes, falsification proof, red-test triage, review checklist.
- `references/tdd-rules.md` + `references/tdd-examples.md` - TDD rules and examples.
- `references/test-anti-patterns.md` - mock misuse, test-only prod code.

Quality:

- `references/verification-before-completion.md` - evidence gate details.
- `references/refactoring/clean-refactoring.md` - source-of-truth refactors, ownership, compatibility seams.
- `references/refactoring/deslop.md` - AI slop cleanup.
- `references/refactoring/code-simplification.md` - local clarity refactors, style rules.
- `references/refactoring/code-flow-analysis.md` - simplification across files/async/side effects.
- `references/error-handling/silent-failures.md` - catch/fallback/retry/null review.
- `references/documentation/code-documentation.md` - comments, API docs.

Design:

- `references/architecture/architecture-planning.md` - boundaries, contracts, ADRs.
- `references/design/type-design.md` - domain models, invariants, state machines.

Roles (load when acting in that mode):

- `references/roles/code-reviewer.md` - structured review.
- `references/roles/pair-programmer.md` - approach analysis before coding.
- `references/roles/software-architect.md` - system design.
- `references/roles/sprint-planner.md` - parallel workstream planning.
- `references/roles/coding-teacher.md` - teaching guidance.

Languages (load when repo uses them):

- `references/languages/go.md`, `references/languages/swift-ios.md`, `references/languages/typescript-frontend.md`.

Explicit proof requests → `verify-this` skill.
