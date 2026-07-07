---
name: code-review
description: "Code quality review + repo audit: maintainability, correctness, abstraction quality, tests, docs, deps, perf. Modes: audit (default, ranked improvement plan) | nuclear (strict maintainability review with approval bar) | simplify (diff-scoped cleanup pass that applies fixes)."
---

# Code Review

Read-only review. Do not edit code unless user asks — exception: `simplify` mode applies fixes.

Three modes:

- `audit` (default): balanced audit of repo/scope. Output ranked improvement plan.
- `nuclear`: strict maintainability review. Behavior working is not enough; push for structure that makes code smaller, clearer, more direct, easier to reason about without changing behavior. Trigger on "nuclear", "thermo", "strict", "brutal", or diff/PR review where user wants high bar.
- `simplify`: diff-scoped quality cleanup, then apply fixes. Not a bug hunt; correctness stays with audit/nuclear. Trigger on "simplify", "clean up the diff/changes", "second catch".

## Inputs

- Scope: paths/globs/dirs, diff, or PR. Default: whole repo.
- Focus: `architecture`, `complexity`, `time-complexity`, `duplication`, `dead-code`, `legacy-code`, `tests`, `errors`, `types`, `comments`, `docs`, `deps`, `simplify`, `all`. Default: `all`.
- Mode: `audit` | `nuclear` | `simplify`. Default: `audit`. Simplify default scope: diff, not repo.

## Workflow

1. Read repo docs/local instructions first.
2. Parse scope/focus/mode. Exclude generated, vendored, build, lockfile-only areas unless asked.
3. Map repo shape: dirs, languages, frameworks, tooling, hotspots, large/stale areas. For whole-codebase passes: inventory subsystems, entry points, generated dirs, tests, docs.
4. Pick lenses from focus. Use subagents when allowed/useful; shard by subsystem or concern, not file count. Avoid overlapping write/review scopes; keep sub-reviewers read-only.
5. For every finding: cite files/symbols, evidence, failure mode or maintenance cost, smallest viable change.
6. Synthesize: merge duplicates, reject weak/speculative/style-only findings. Verify branch-dependent findings against current branch.
7. Rank by impact, effort, confidence, regression risk; in nuclear mode, rank by future leverage. Separate architectural debt from feature breadth.
8. For `comments`, `docs`, or `all`: use `technical-writer` if available; otherwise audit locally.

## Lenses

- Architecture: boundaries, ownership, coupling, layering.
- Complexity/simplify: hard control flow, oversized files, needless abstraction, smaller equivalent code.
- Deletion/deps/dead-code: unused files, stale abstractions, removable paths, unused/outdated/overlapping deps.
- Time complexity: hot loops, repeated scans/lookups/sorts/allocations/recompute; include current complexity, bottleneck, lower-complexity alternative, expected complexity, space/readability trade-off, worth doing.
- Duplication/legacy: copy-paste, near-duplicate modules, compatibility bridges, old patterns, hard-coded values, orphan flows.
- Tests: missing coverage, weak assertions, risky untested behavior.
- Errors: silent failures, swallowed exceptions, weak reporting.
- Types: weak invariants, leaky models, unclear boundaries, unnecessary optionality, `unknown`/`any`/casts, ad-hoc object shapes, silent fallbacks hiding invariants.
- Comments/docs: stale/misleading/redundant comments, missing durable docs, setup/API/contributor drift. Validate comment accuracy and language docs standards: JSDoc/TSDoc, docstrings, Go doc, rustdoc, DocC.

## Tags

Deletion-first tags for complexity/deps/dead-code/simplify findings:

- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled code stdlib already covers. Name API.
- `native:` dependency/custom code platform/framework/DB/browser/OS already covers. Name feature.
- `yagni:` abstraction/config/layer with one impl, no real caller, or unproven need.
- `shrink:` same behavior with fewer concepts/lines. Show shorter replacement when concise.

Complexity-only pass: one finding per line; include `net: -N lines possible` when meaningful and cheap. Nothing useful to cut → `Lean already. Ship.`

## Rules

- Analysis only; no code edits. Exception: simplify mode applies its fixes (Phase 2).
- Prefer high-leverage findings over exhaustive nitpicks. Fewer high-conviction findings beat long nit lists.
- Favor deletion/simplification over new abstraction. Deletion beats extraction when both preserve behavior and clarity.
- Prefer stdlib, native features, and existing deps over custom code/new deps.
- For over-engineering, name what to cut and what replaces it.
- Correctness, tests, docs, deps, and perf gaps still count even when line count grows or does not shrink.
- Do not chase tiny line cuts that obscure behavior or fight repo conventions.
- Validate against existing patterns/local rules.
- Separate quick wins from strategic refactors.
- Report uncertainty when confidence low.
- Do not force optimization when asymptotic win/trade-off is poor.

## Simplify Mode

`simplify → 4 cleanup angles in parallel → apply the fixes`

Improve quality of changed code, not hunt bugs. Do not flag correctness bugs; route them to audit/nuclear.

### Phase 0 — Gather diff

`git diff @{upstream}...HEAD` (fallback `git diff main...HEAD` / `git diff HEAD~1`). Uncommitted changes or empty range → also `git diff HEAD`. Argument (PR, branch, path) → review that target instead.

### Phase 1 — Review (4 angles in parallel)

Launch 4 independent review subagents in one message, each with the diff + one angle. No subagents available → run angles sequentially yourself. Each finding: `file`, `line`, one-line summary, concrete cost (what is duplicated, wasted, or harder to maintain) — not a crash scenario.

- Reuse: new code re-implementing something the codebase already has. Grep shared/utility modules and files adjacent to the change; name the existing helper to call instead.
- Simplification: unnecessary complexity the diff adds — redundant or derivable state, copy-paste with slight variation, deep nesting, dead code left behind. Name the simpler form that does the same job.
- Efficiency: wasted work the diff introduces — redundant computation or repeated I/O, independent operations run sequentially, blocking work added to startup or hot paths, long-lived objects built from closures that pin the enclosing scope (prefer struct copying only needed fields). Name the cheaper alternative.
- Altitude: change implemented at right depth, not fragile bandaid. Special cases layered on shared infrastructure → generalize the underlying mechanism instead.

Tag findings with deletion-first tags above.

### Phase 2 — Apply fixes

Wait for all angles, dedup findings on same line/mechanism, fix each remaining one directly. Skip when fix would change intended behavior, require changes well outside the diff, or is a false positive — note the skip, don't argue. Finish with brief summary: fixed vs skipped (or confirm already clean).

## Nuclear Mode

Everything above, plus stricter standards, aggressive flagging, and approval bar.

### Standards

- Be ambitious about structural simplification. Look for code-judo moves where existing architecture makes branches/helpers/modes/layers disappear.
- Prefer deleting complexity over rearranging it.
- No PR should push a file from <1k to >1k lines without strong reason. Ask for decomposition unless structure clearly justifies size.
- No spaghetti growth: ad-hoc conditionals, scattered special cases, flags, nullable modes, one-off branches in busy flows are design smells.
- Cleaner design beats "it works." Do not approve refactors that move complexity without deleting concepts.
- Direct/boring/maintainable beats hacky/magical/generic. Thin wrappers, identity abstractions, pass-through helpers, generic magic must earn keep.
- Logic belongs in canonical owner. Flag feature logic leaking into shared paths, implementation details leaking through APIs, wrong layer/package, duplicate helper where canonical utility exists.
- Orchestration should be simple and atomic. Flag unnecessary sequential async and partial-update flows when parallel/transactional shape is clearer.
- New/existing abstraction okay only when it removes more complexity than it adds or moves logic to canonical owner.
- Do not flatten into one file/function; ownership boundaries and file health still matter.

### Review Questions

- Is there a reframing that deletes whole categories of complexity?
- Did diff improve or worsen local architecture?
- Did cohesive module become more coupled/stateful/harder to scan?
- Is logic in right file/layer/package?
- Did file/component cross healthy size boundary?
- Are repeated conditionals signaling missing model/helper?
- Is abstraction earning its keep?
- Are casts/optionality/ad-hoc shapes obscuring invariant?
- Is orchestration more sequential or less atomic than needed?

### Flag Aggressively

- Cleaner reframing deletes branches/helpers/modes/layers.
- Refactor moves code around without reducing concepts.
- File crosses 1000 lines due to PR.
- New conditionals bolt onto unrelated/busy paths.
- One-off booleans, nullable modes, flags complicate flow.
- Feature logic leaks into general-purpose modules.
- Generic magic hides simple structure.
- Thin wrappers/pass-through helpers add indirection without clarity.
- Casts/`any`/`unknown`/optional params muddy contract.
- Copy-paste replaces helper/canonical utility.
- Narrow edge-case logic lands in busy function.
- Tests pass but modularity/readability worsens.
- Temporary branch likely becomes permanent debt.
- Sequential async or partial updates add avoidable brittleness.

### Preferred Fixes

- Delete indirection instead of polishing it.
- Reframe state model so conditionals disappear.
- Move logic to canonical owner.
- Turn special cases into default flow with fewer exceptions.
- Extract focused helper/pure function when it reduces complexity.
- Split large file into focused modules.
- Put feature-specific logic behind dedicated boundary.
- Replace condition chains with typed model/dispatcher.
- Separate orchestration from business logic.
- Collapse duplicate branches.
- Reuse canonical helper.
- Make boundary types explicit.
- Parallelize independent work when it simplifies orchestration.
- Make related updates atomic.

### Approval Bar

Do not approve while these remain unjustified:

- Incidental complexity preserved when clear simplification exists.
- File grows from <1k to >1k lines.
- Ad-hoc branching tangles existing flow.
- Feature checks scatter across shared code.
- Wrapper/cast/optionality churn makes design more indirect.
- Logic duplicates helper or sits in wrong layer.
- Obvious decomposition would improve maintainability.

Tone: direct, serious, demanding. Do not soften major issues. Say when code makes codebase messier.

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

Nuclear mode — findings ordered by priority:

1. Structural regressions.
2. Missed dramatic simplification.
3. Spaghetti/branching growth.
4. Boundary/abstraction/type-contract issues.
5. File-size/decomposition concerns.
6. Modularity/ownership problems.
7. Legibility/maintainability issues.

Each finding: location, problem, why it matters, smallest safer fix.
