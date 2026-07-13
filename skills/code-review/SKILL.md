---
name: code-review
description: "Use when doing a Code review / repo audit: maintainability, correctness, abstraction quality, tests, docs, deps, perf. Modes: audit (default, ranked improvement plan) | nuclear (strict maintainability review with approval bar) | simplify (diff-scoped cleanup pass that applies fixes)."
---

# Code Review

Read-only. No code edits except simplify mode Phase 2, or user explicitly asks.

Modes:

- `audit` (default): balanced repo/scope audit → ranked improvement plan.
- `nuclear`: strict maintainability review. Working behavior not enough; push structure that makes code smaller, clearer, easier to reason about, same behavior. Triggers: "nuclear", "thermo", "brutal", or diff/PR review where user wants high bar.
- `simplify`: diff-scoped cleanup, applies fixes. Not bug hunt. Triggers: "simplify", "clean up the diff/changes", "second catch".

## Inputs

- Scope: paths/globs/dirs, diff, or PR. Default: whole repo. Simplify default: diff.
- Focus: `architecture`, `complexity`, `time-complexity`, `duplication`, `dead-code`, `legacy-code`, `tests`, `errors`, `types`, `comments`, `docs`, `deps`, `all`. Default `all`.

## Workflow

1. Read repo docs/local instructions first.
2. Parse scope/focus/mode. Exclude generated/vendored/build/lockfile areas unless asked.
3. Map repo shape: dirs, languages, frameworks, tooling, hotspots, large/stale areas. Whole-repo: inventory subsystems, entry points, tests, docs.
4. Pick lenses from focus. Subagents when allowed/useful; shard by subsystem/concern, not file count. Sub-reviewers read-only; no overlapping scopes.
5. Every finding: files/symbols, evidence, failure mode or maintenance cost, smallest viable change.
6. Synthesize: merge dupes, reject weak/speculative/style-only findings. Verify branch-dependent findings against current branch.
7. Rank: impact, effort, confidence, regression risk. Nuclear: rank by future leverage (output category order below). Separate architectural debt from feature breadth.
8. Explicit `comments`/`docs` focus → use `technical-writer` if available. Bare `all` → audit locally unless docs are major part of scope.

## Lenses

- Architecture: boundaries, ownership, coupling, layering.
- Complexity: hard control flow, oversized files, needless abstraction, smaller equivalent code.
- Deletion/deps/dead-code: unused files, stale abstractions, removable paths, unused/outdated/overlapping deps.
- Time complexity: hot loops, repeated scans/lookups/sorts/allocs/recompute. Give: current complexity, bottleneck, lower-complexity alternative, space/readability trade-off, worth doing.
- Duplication/legacy: copy-paste, near-dup modules, compat bridges, old patterns, hard-coded values, orphan flows.
- Tests: missing coverage, weak assertions, risky untested behavior.
- Errors: silent failures, swallowed exceptions, weak reporting.
- Types: weak invariants, leaky models, unnecessary optionality, `unknown`/`any`/casts, ad-hoc shapes, silent fallbacks hiding invariants.
- Comments/docs: stale/misleading/redundant comments, missing durable docs, setup/API/contributor drift. Check language doc standards: JSDoc/TSDoc, docstrings, Go doc, rustdoc, DocC.

## Tags

Deletion-first tags for complexity/deps/dead-code findings:

- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled code stdlib covers. Name API.
- `native:` dep/custom code platform/framework/DB/browser/OS covers. Name feature.
- `yagni:` abstraction/config/layer with one impl, no real caller, unproven need.
- `shrink:` same behavior, fewer concepts/lines. Show replacement when concise.

Complexity-only focus: one line per finding, skip full output template; add `net: -N lines possible` when meaningful and cheap. Nothing to cut → `Lean already. Ship.`

## Rules

- High-leverage findings over exhaustive nitpicks — all modes, nuclear included.
- Deletion/simplification beats new abstraction. Stdlib/native/existing deps beat custom code/new deps.
- Over-engineering: name what to cut + what replaces it.
- Correctness/tests/docs/deps/perf gaps count even when line count grows.
- No tiny line cuts that obscure behavior or fight repo conventions.
- Validate against existing patterns/local rules.
- Separate quick wins from strategic refactors.
- Low confidence → say so.
- No forced optimization when asymptotic win/trade-off poor.

## Simplify Mode

`simplify → 4 angles parallel → apply fixes`

Improve changed-code quality, not bug hunt. Correctness bug found → don't fix; list separately for user.

### Phase 0 — Diff

`git diff @{upstream}...HEAD` (fallback `git diff main...HEAD` / `git diff HEAD~1`). Uncommitted changes or empty range → also `git diff HEAD`. Argument (PR/branch/path) → review that instead.

### Phase 1 — Review, 4 angles parallel

4 review subagents in one message, each diff + one angle. No subagents → run angles sequentially yourself. Each finding: `file`, `line`, one-line summary, concrete maintenance cost (not crash scenario).

- Reuse: new code re-implements existing helper. Grep shared/util modules + files adjacent to change; name existing helper to call.
- Simplification: complexity diff adds — redundant/derivable state, copy-paste variants, deep nesting, dead code left behind. Name simpler form.
- Efficiency: wasted work diff introduces — redundant compute/repeated I/O, sequential independent ops, blocking work on startup/hot paths, long-lived closures pinning enclosing scope (prefer struct with needed fields). Name cheaper alternative.
- Altitude: right depth vs fragile bandaid. Special cases on shared infra → generalize mechanism instead.

Tag with deletion-first tags.

### Phase 2 — Apply

Wait for all angles, dedup same line/mechanism, fix each. Skip when fix changes intended behavior, needs changes well outside diff, or false positive — note skip, don't argue. Summary: fixed vs skipped (or already clean).

## Nuclear Mode

Audit rules plus stricter bar. Strict = higher standards, not longer lists; findings stay high-conviction.

### Standards

- Hunt structural simplification: reframings that delete branches/helpers/modes/layers. Delete complexity, don't rearrange it — refactor moving complexity without deleting concepts is not improvement.
- Direct/boring beats hacky/magical/generic. Thin wrappers, identity abstractions, pass-throughs, generic magic must earn keep.
- Logic in canonical owner: flag feature logic in shared paths, wrong layer/package, dup of canonical helper, impl details leaking through APIs.
- No spaghetti growth: ad-hoc conditionals, scattered special cases, one-off flags/booleans/nullable modes in busy flows = design smells.
- File crossing healthy size bound (repo norm; default ~500 LOC) → ask decomposition unless structure clearly justifies.
- Types: casts/`any`/`unknown`/optional-param churn muddying contracts.
- Orchestration simple + atomic: flag avoidable sequential async, partial-update flows.
- Abstraction OK only when it removes more complexity than adds or moves logic to canonical owner. Don't flatten into one file/fn — ownership boundaries and file health still matter.
- Tests passing while modularity/readability worsens still fails review.

### Preferred Fixes

- Delete indirection; don't polish it.
- Reframe state model so conditionals disappear; special cases → default flow with fewer exceptions.
- Move logic to canonical owner; feature-specific logic behind dedicated boundary.
- Collapse dup branches; reuse canonical helper.
- Condition chains → typed model/dispatcher; explicit boundary types.
- Extract focused helper/pure fn only when complexity drops. Split oversized file into focused modules.
- Separate orchestration from business logic; make related updates atomic; parallelize only when it simplifies orchestration.

### Approval Bar

Diff/PR review only; repo-scope audit → findings, no verdict.

Don't approve while unjustified:

- Clear simplification skipped.
- File crosses size bound.
- Ad-hoc branching tangles existing flow; feature checks scatter across shared code.
- Wrapper/cast/optionality churn makes design more indirect.
- Logic dups helper or sits in wrong layer.
- Obvious decomposition skipped.

Tone: direct, demanding. Don't soften major issues. Say when code makes codebase messier.

## Output

Audit mode:

```markdown
# Codebase Improvement Summary

## Executive Summary
- 2-4 sentences: health + biggest opportunities

## Top Improvements To Make Now
- [Impact | Effort | Confidence] Title
  - Files/Symbols:
  - Evidence:
  - Smallest viable change:
  - Why now:

## Quick Wins
- Low-risk, high-leverage cleanups

## Strategic Refactors
- Larger changes needing planning

## Deletion / De-scope Opportunities
- Code, configs, abstractions, or deps likely removable

## Test / Docs / Dependency Gaps
- Missing coverage, stale docs, missing API docs, toolchain cleanup

## Questions / Assumptions
- Uncertainties needing confirmation
```

Nuclear mode: verdict first (approve / needs work) when diff/PR, then findings by future leverage:

1. Structural regressions.
2. Missed dramatic simplification.
3. Spaghetti/branching growth.
4. Boundary/abstraction/type-contract issues.
5. File-size/decomposition.
6. Modularity/ownership.
7. Legibility/maintainability.

Each finding: location, problem, why it matters, smallest safe fix.
