---
name: programming
description: "Software implementation/debugging: root cause, tests, verification, standards."
---

# Programming

Build prod code. Smallest safe change. Preserve behavior unless req/test/doc says change. Bias caution; tiny tasks still need judgment.

## Core

Simplicity ladder, always on:

1. No code if need is speculative or already covered.
2. Standard library.
3. Native platform/framework feature.
4. Already-installed dependency.
5. Tiny local helper or direct line.
6. Minimum new code.

First rung that holds wins. Not a research project.

Tie-breaks:

- Safety beats brevity: validation at trust boundaries, security, accessibility basics, data-loss prevention, explicit reqs, tests, fresh verification.
- Existing code patterns beat generic minimalism when consistency lowers maintenance cost.
- DDD only when repo/domain complexity earns it; no default ceremony.
- New deps only when stdlib/native/existing deps fall short and custom ownership costs more.
- Fewest files = fewest clear ownership boundaries, not giant files or hidden coupling.

Push back when req implies needless complexity. No speculative features, single-use interfaces, one-product factories, unused config, impossible-case handling, or scaffolding "for later."

## Workflow

1. Read relevant repo docs/instructions and this skill.
2. Load role/language refs only when task needs them.
3. Verify ideas independently. State assumptions. Multiple plausible meanings → options + rec. Ask only when unsafe to assume.
4. Nontrivial task → plan scope, success criteria, test strategy.
5. Bugs/failures → reproduce or validate issue, find root cause, then fix. No band-aids/fallbacks for failing tests.
6. Behavior change → TDD when feasible. User asks TDD → strict red-green-refactor, no extra behavior. Non-behavioral change → say why TDD skipped.
7. Analyze existing code purpose/structure before editing. Edit surgically. Every changed line traces to req. Mention unrelated issues; do not fix them.
8. After AI edits, deslop when diff shows odd comments, needless defensive code, type escapes, or single-use abstractions.
9. Run formatter/lint/tests/docs gate relevant to change. Read output + exit code.
10. Claim only what fresh evidence proves.
11. Call out conflicting instructions/reqs/code states. Conflict order: safety/critical rules → existing code patterns → specific language refs. Pick safer path only when user judgment not needed.

## Delegation

Delegate when user/runtime permits and work benefits from parallelism. Work local for tiny tasks, urgent/blocking path, or tight coupling. For saved multi-task plans, prefer `subagent-driven-development`.

Orchestrator owns user comms, assumptions, success criteria, architecture/product decisions, contracts, dependency order, final evidence.

Dispatch:

- `developer-lite`: clear local 1-2 file mechanical work.
- `developer`: cross-module, API/schema/auth/security/concurrency/perf/new-dep/debugging/judgment work.
- `researcher`: external/current info.
- `technical-writer`: edited public docs/comments/API docs; use for doc behavior changes when available.
- `reviewer`: combined pass after impl, spec first then quality; use before handoff when change is nontrivial. SDD reviews at aggregation boundaries and final full diff.

Subagent rules: paste exact task/scope/acceptance/tests; never make plan file primary source. Do not retry same prompt unchanged. Agent reports are not evidence; verify diff + gates locally.

Stop signs: `NEEDS_CONTEXT`, `BLOCKED`, correctness `DONE_WITH_CONCERNS`, or architectural smell changing scope/contract → add context, split, upgrade, propose safer path, or ask.

## Code Rules

- Match surrounding style/format/patterns. File consistency beats outside guide.
- Preserve behavior unless req/test/doc calls for change. Breaking change allowed when right fix; call it out.
- Refactor only task area. Preserve behavior while removing duplication, dead branches, wrappers, or indirection exposed by change. Broader cleanup needs approval.
- Remove only imports/vars/fns made unused by your change unless cleanup requested.
- Preserve helpful structure/boundaries. No architecture reshape without strong reason.
- Never discard existing impl without explicit permission. Fix forward; no compat shims/temporary bridges unless req says. Remove transitional code only after replacement works.
- Fail fast with concrete errors unless spec defines safe recovery. Tests assert stable ids/types/codes over full messages.
- Error/log text concise; no trailing period unless project style.
- Prefer clear control flow over dense expressions. Avoid nested ternaries when `if`/guard/`switch` clearer.
- Apply CQS when it clarifies behavior. Queries should not mutate; commands should not hide meaningful return values.
- Favor immutable data + explicit state transitions when practical.
- Names evergreen; avoid `new`, `improved`, `enhanced`.
- Comments true, timeless, English. Remove restatements. Add rare inline comments only for non-obvious constraints/invariants/context.
- Docs concise and accurate. Update user-facing docs when behavior/API changes.
- Think through efficiency, security, scalability, ops impact.

## Tests

- Automated tests required when feasible; interactive/tmux tests when needed. Close panes when done.
- With tmux, show attach cmd so user can watch/interact.
- Bug fix → unit test reproduces issue when feasible; otherwise state why and use lightest viable proof.
- Behavior tests verify public behavior, one behavior at a time, with meaningful assertions. Given/When/Then only when clearer.
- Cover edge/irregular inputs when behavior depends on them. Do not test irrelevant functionality.
- Prefer real local impl/data over mocks. Avoid mocking FS/sockets/memory/core infra unless necessary.
- Tests stay deterministic: no Internet by default, explicit inputs over implicit defaults, temp dirs/ports for resources, close resources, no timeout waits, quiet logs unless logging is behavior.
- Fixtures: inline small, generate large at runtime when clearer. Prefer one test file per feature unless grouping cuts duplication.

## Verification

Never say complete/fixed/passing/green/ready/reviewed without fresh evidence from current turn.

Gate:

1. Name proving command/check.
2. Run it now.
3. Read output + exit code.
4. Compare to claim.
5. Report actual state. If skipped/failed, say so.

Relevant CI should pass before review/ship. Unrecognized worktree changes are user/agent work: ignore unrelated, work with related, stop if unsafe. Leave short thread breadcrumbs for decisions/blockers/follow-ups that should not become code changes.

Never bypass gates with `--no-verify`, `--skip-checks`, or similar flags.

## References

- `issue-investigation/guide.md` - incidents, root-cause hypothesis ranking, validation plans.
- `systematic-debugging/guide.md` - root-cause workflow for bugs/test/build failures/regressions.
- `references/refactoring/deslop.md` - AI slop cleanup.
- `references/verification-before-completion.md` - evidence gate details.
- Explicit proof requests -> use `verify-this` skill.
- `references/roles/code-reviewer.md` - structured review.
- `references/roles/pair-programmer.md` - approach analysis.
- `references/roles/coding-teacher.md` - teaching guidance.
- `references/roles/software-architect.md` - architecture/system design.
- `references/roles/sprint-planner.md` - planning/parallel work.
- `references/architecture/architecture-planning.md` - hard problems, ADRs, contracts, boundaries.
- `references/design/type-design.md` - domain models, APIs, schemas, state machines, type invariants.
- `references/documentation/code-documentation.md` - comments, public API docs, README snippets.
- `references/error-handling/silent-failures.md` - catch/fallback/retry/null/log/user-visible failures.
- `references/refactoring/code-flow-analysis.md` - simplification spanning files/entry points/async/side effects.
- `references/refactoring/code-simplification.md` - local clarity refactors.
- `references/languages/go.md` - Go.
- `references/languages/swift-ios.md` - Swift/iOS.
- `references/languages/typescript-frontend.md` - TypeScript/frontend.
- `references/tdd-rules.md` and `references/tdd-examples.md` - TDD.
- `references/test-anti-patterns.md` - tests to avoid.
