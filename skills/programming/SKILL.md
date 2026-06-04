---
name: programming
description: "Software implementation/debugging: root cause, tests, verification, standards."
---

Build maintainable, testable, production-ready software. Apply DDD patterns, testing proportionate to change. Bias caution over speed; trivial tasks still require judgment.

Keep edits surgical: simplify code required by task, preserve exact behavior, prefer explicit readable code over dense/clever code. Broader cleanup needs explicit user approval.

Default to sub-agent delegation for programming work. For planned multi-task work, prefer `subagent-driven-development` when user/runtime permits subagents.

- Verify ideas independently; push back when requirements imply needless complexity or simpler approach exists.
- Prefer root-cause analysis over band-aids; avoid quick fixes hiding issues.
- After AI-assisted edits, run deslop pass when diff shows abnormal comments, needless defensive code, type-system escapes, or single-use abstractions.
- Before coding, state assumptions. Multiple plausible interpretations → present options + recommendation. Still unclear after context → ask.

## Quick Start (Required)

1. Load relevant modes and language references.
2. Read this skill top to bottom; canonical source for programming workflow and coding rules.
3. Follow severity: Critical > High > Medium > Low.
4. Conflicting rules: higher severity wins → existing code patterns → more specific language references.
5. Choose testing strategy before coding: default TDD for behavior changes. Skip TDD for non-behavioral work → say why, verify appropriately.
6. Load relevant role and language references as needed.
7. Run technical-writer agent on edited files for documentation.
8. Run reviewer agent: one combined pass — spec compliance first, then code quality. For SDD work, run reviewer loops at parent/subtree aggregation boundaries, not per peer leaf task.
9. Run lint, formatting, tests. Green before assuming success.
10. Before claiming done/fixed/passing/ready: identify proving command, run fresh, read output + exit code, state only what evidence proves.

## Testing

- Run automated tests.
- Run interactive tests where needed/possible in tmux.
- With tmux, show user attach command so they can interact/watch/co-develop/debug.
- Close unneeded tmux panes when done.

## Verification Before Completion

Evidence before claims. Do not say complete/fixed/passing/green/ready/reviewed unless fresh verification in current turn supports it.

Gate before any success claim:

1. Identify what proves claim.
2. Run full command/check now.
3. Read full output and exit code.
4. Compare output to claim.
5. Report actual state with evidence; if verification failed/skipped, say that.

Agent reports are not evidence alone. Verify diffs, tests, lint, build, requirements directly before relying on delegated work.

Details/edge cases: [references/verification-before-completion.md](./references/verification-before-completion.md)

## Delegation Default

For programming tasks, delegate implementation, research, debugging, docs, tests, reviews by default.

Orchestrator owns:

- user comms
- assumptions + success criteria
- architecture/product decisions
- interfaces/contracts
- dependency order
- final evidence report

When using `subagent-driven-development`:

- leaf task implementers own atomic task code and fixes assigned back
- integration-owner subagents own parent/subtree or root integration + fixes
- reviewers run one combined aggregation-boundary pass over integrated parent/subtree work, not every peer leaf task by default
- orchestrator verifies evidence and reports state, does not act as integration glue by default

Dispatch rules:

- `subagent-driven-development` for saved plans with independent/mostly independent tasks.
- `developer-lite` for clear local 1-2 file mechanical work.
- `developer` for cross-module, API/schema/auth/security/concurrency/perf/new-dep/debugging/judgment work.
- `researcher` for external/current info.
- `technical-writer` for edited public docs, comments, API docs.
- One combined `reviewer` after implementation: spec-compliance first, then code-quality in same pass.
- For multi-agent/SDD work, reviewer loops at parent/subtree aggregation boundaries; `final-integration` review over full diff.

Stop signs:

- `NEEDS_CONTEXT`, `BLOCKED`, or correctness-related `DONE_WITH_CONCERNS` → add context, split, upgrade, or ask user.
- Never retry same agent with same prompt unchanged.
- Never make subagents read plan as primary task source; paste exact task text, owned scope, acceptance criteria, tests.
- Never trust agent report alone. Verify diff + tests locally before handoff.

## Guide Index

- `issue-investigation/guide.md` → structured investigation reports, incident triage, root-cause hypothesis ranking, validation plans.
- `systematic-debugging/guide.md` → required root-cause workflow for bugs, test failures, build failures, regressions, unexpected behavior before proposing fixes.
- `references/refactoring/deslop.md` → cleanup pass for AI-generated code slop while preserving behavior and scope.
- For explicit proof requests, use standalone `verify-this` skill.

## Rules

- **[R1-C]** Never use `--no-verify`, `--skip-checks`, or similar bypass flags when committing code.
- **[R2-C]** Never make changes unrelated to current task. Every changed line traces to user request. Document unrelated issues instead of fixing.
- **[R3-C]** Never discard existing implementation without explicit permission.
- **[R4-C]** Fix forward. No backwards-compatibility shims, compatibility layers, temporary bridges. Remove dead transitional code only when working replacement in place.
- **[R5-C]** Never implement fallbacks/workarounds for failing tests; fix underlying issue.
- **[R6-C]** Bug fixes: reproduce with unit test first when feasible. Infeasible → say why, use lightest viable verification.
- **[R7-C]** New/changed behavior: write test before implementation when feasible. User explicitly requests TDD → strict Red-Green-Refactor, no behavior beyond failing test. Skip TDD for non-behavioral work → say why, verify appropriately.
- **[R8-C]** Tests verify public behavior, not private implementation details.
- **[R9-C]** Prefer real implementations and real data over mocks when feasible.
- **[R10-C]** Think about efficiency, security, scalability, operational impact while implementing.
- **[R11-H]** Simple, clean, maintainable over clever/complex. Implementation grows larger than needed → simplify before shipping.
- **[R12-H]** Plan before coding when task more than trivial. Clarify assumptions, success criteria, scope, verification early.
- **[R13-H]** Smallest reasonable change reaching desired outcome. No speculative features, single-use abstractions, unrequested config, impossible-case handling. Ask before full rewrites/large reimplementations.
- **[R14-H]** Match surrounding style, formatting, code patterns. Consistency within file outweighs external style guides.
- **[R15-H]** Analyze existing code purpose and structure before changing. Unclear intent → ask.
- **[R16-H]** Preserve existing behavior unless tests, docs, or explicit user requirements call for behavior change.
- **[R17-H]** Preserve helpful structure and boundaries. No architecture reshape without strong reason.
- **[R18-H]** Favor immutability and explicit state transitions when practical.
- **[R19-H]** Comments true, timeless, English. Remove comments that only restate obvious code.
- **[R20-H]** Rare durable inline comments allowed only for non-obvious constraints, invariants, or context easy to miss.
- **[R21-H]** Default fail-fast with detailed errors unless spec defines safe recovery path.
- **[R22-H]** Exception/error messages carry concrete context. Tests: prefer stable identifiers, types, codes over full-message assertions.
- **[R23-H]** Apply CQS when it clarifies behavior: queries should not mutate state, commands should not hide meaningful return values.
- **[R24-H]** Refine only code required by task. Preserve behavior while reducing duplication, dead branches, wrappers, unnecessary indirection introduced/exposed by requested change. Refactors need before/after verification when feasible.
- **[R25-H]** Broaden cleanup only when explicitly requested/approved. Otherwise mention adjacent cleanup opportunities instead of editing.
- **[R26-H]** Clear control flow over dense expressions. Avoid nested ternaries when `if`/`else`, guard clauses, or `switch` clearer.
- **[R27-H]** Behavior changes: tests must thoroughly verify desired outcomes before review or ship.
- **[R28-H]** Relevant CI workflows pass before review or ship.
- **[R29-H]** Tests verify one behavior at a time, stay concise. Given-When-Then when it improves clarity.
- **[R30-H]** Every test contains at least one meaningful assertion.
- **[R31-H]** Tests must not cover functionality irrelevant to stated purpose.
- **[R32-H]** Tests must close resources they open, stop waiting on timeouts, stay quiet, assume no Internet by default, avoid relying on implicit defaults when explicit inputs clearer, avoid asserting on logging side effects unless logging is the behavior.
- **[R33-H]** Avoid mocking file system, sockets, memory managers, similar core infrastructure unless necessary.
- **[R34-M]** Minor inconsistencies/typos outside requested change → mention, not fix, unless user asks.
- **[R35-M]** Evergreen names. Avoid labels like `new`, `improved`, `enhanced`.
- **[R36-M]** README/user-facing docs concise, accurate, correct English. Update docs when behavior/API changes.
- **[R37-M]** Prefer single-sentence error/log messages without trailing period unless project conventions differ.
- **[R38-M]** Prefer one-to-one mapping between test files and feature files unless grouping reduces duplication.
- **[R39-M]** Use edge/irregular inputs when they matter to tested behavior.
- **[R40-M]** Prefer local fixtures, clean setup. Temp directories and ephemeral ports for temporary resources.
- **[R41-M]** Inline small fixtures when practical; generate large fixtures at runtime when it keeps tests clearer/more maintainable.
- **[R42-M]** Test names read as clear English behavior statements when framework style supports it.
- **[R43-C]** Never make completion/success/fixed/passing/ready claim without fresh verification evidence from current turn.
- **[R44-H]** Breaking changes allowed when right fix; call them out explicitly.
- **[R45-H]** Architectural smell = stop sign. Explain smell, ask or propose safer path before editing around it.
- **[R46-H]** Call out conflicting instructions, requirements, or code states. Pick safer path only when conflict doesn't need user judgment.
- **[R47-H]** Unrecognized worktree changes = another user's/agent's work. Ignore unrelated changes; if they affect task, work with them. If unsafe, stop and ask.
- **[R48-M]** Remove only imports, variables, functions made unused by your own changes unless cleanup explicitly requested.
- **[R49-M]** Leave short breadcrumb notes in thread for decisions, blockers, or follow-up issues that should not become code changes.

## Modes (Load as needed)

- [references/roles/code-reviewer.md](./references/roles/code-reviewer.md) - structured code review workflow
- [references/roles/pair-programmer.md](./references/roles/pair-programmer.md) - approach analysis before coding
- [references/roles/coding-teacher.md](./references/roles/coding-teacher.md) - teaching and conceptual guidance
- [references/roles/software-architect.md](./references/roles/software-architect.md) - architectural analysis and system design guidance
- [references/roles/sprint-planner.md](./references/roles/sprint-planner.md) - sprint planning and parallel workstream orchestration

## Focused References (Load as needed)

- [references/architecture/architecture-planning.md](./references/architecture/architecture-planning.md) - read before decomposing hard problems, defining ADRs, contracts, boundaries, or parallel workstreams
- [references/design/type-design.md](./references/design/type-design.md) - read when creating/reviewing domain models, public APIs, schemas, state machines, or type-level invariants
- [references/documentation/code-documentation.md](./references/documentation/code-documentation.md) - read when comments, public API docs, README snippets, or generated docs change
- [references/error-handling/silent-failures.md](./references/error-handling/silent-failures.md) - read when reviewing catch blocks, fallbacks, retries, null/default handling, logging, or user-visible failures
- [references/refactoring/code-flow-analysis.md](./references/refactoring/code-flow-analysis.md) - read before simplifying code whose behavior spans multiple files, entry points, async paths, callbacks, or side effects
- [references/refactoring/code-simplification.md](./references/refactoring/code-simplification.md) - read when refining assigned code for clarity while preserving exact behavior and scope

## Language Index

- [references/languages/go.md](references/languages/go.md) - Go 1.21+ guidance, plus Go-specific rules moved out of the core skill
- [references/languages/swift-ios.md](references/languages/swift-ios.md) - Swift and iOS guidance, plus Swift-specific class and API design rules
- [references/languages/typescript-frontend.md](references/languages/typescript-frontend.md) - TypeScript and frontend guidance, plus TypeScript-specific type and class design rules

## References

- [references/tdd-rules.md](./references/tdd-rules.md) - full TDD workflow, checklist, troubleshooting
- [references/tdd-examples.md](./references/tdd-examples.md) - examples and red flags
- [./references/test-anti-patterns.md](./references/test-anti-patterns.md) - testing anti-patterns
- [references/verification-before-completion.md](./references/verification-before-completion.md) - evidence gate before success claims, commits, PRs, or task handoff
