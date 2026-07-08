---
name: analyze-codebase-improvements
description: "Read-only repo audit: maintainability, correctness, tests, docs, deps, perf."
---

# Analyze Codebase Improvements

Read-only repo audit. Do not edit code.

## Inputs

- Scope: paths/globs/dirs. Default: whole repo.
- Focus: `architecture`, `complexity`, `time-complexity`, `duplication`, `dead-code`, `legacy-code`, `tests`, `errors`, `types`, `comments`, `docs`, `deps`, `simplify`, `all`. Default: `all`.

## Workflow

1. Read repo docs/local instructions first.
2. Parse scope/focus. Exclude generated, vendored, build, lockfile-only areas unless asked.
3. Map repo shape: dirs, languages, frameworks, tooling, hotspots, large/stale areas.
4. Pick lenses from focus. Use subagents when allowed/useful; shard by subsystem or concern.
5. For every finding: cite files/symbols, evidence, failure mode or maintenance cost, smallest viable change.
6. Merge duplicates. Drop speculative/style-only/low-signal items.
7. Rank by impact, effort, confidence, regression risk.
8. For `comments`, `docs`, or `all`: use `technical-writer` if available; otherwise audit locally.

## Lenses

- Architecture: boundaries, ownership, coupling, layering.
- Complexity/simplify: hard control flow, oversized files, needless abstraction, smaller equivalent code.
- Deletion/deps/dead-code: unused files, stale abstractions, removable paths, unused/outdated/overlapping deps.
- Time complexity: hot loops, repeated scans/lookups/sorts/allocations/recompute; include current complexity, bottleneck, lower-complexity alternative, expected complexity, space/readability trade-off, worth doing.
- Duplication/legacy: copy-paste, near-duplicate modules, compatibility bridges, old patterns, hard-coded values, orphan flows.
- Tests: missing coverage, weak assertions, risky untested behavior.
- Errors: silent failures, swallowed exceptions, weak reporting.
- Types: weak invariants, leaky models, unclear boundaries.
- Comments/docs: stale/misleading/redundant comments, missing durable docs, setup/API/contributor drift. Validate comment accuracy and language docs standards: JSDoc/TSDoc, docstrings, Go doc, rustdoc, DocC.

Deletion-first tags for complexity/deps/dead-code/simplify findings:

- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled code stdlib already covers. Name API.
- `native:` dependency/custom code platform/framework/DB/browser/OS already covers. Name feature.
- `yagni:` abstraction/config/layer with one impl, no real caller, or unproven need.
- `shrink:` same behavior with fewer concepts/lines. Show shorter replacement when concise.

## Rules

- Analysis only; no code edits.
- Prefer high-leverage findings over exhaustive nitpicks.
- Favor deletion/simplification over new abstraction.
- Prefer stdlib, native features, and existing deps over custom code/new deps.
- For over-engineering, name what to cut and what replaces it; include `net: -N lines possible` when meaningful and cheap.
- Correctness, tests, docs, deps, and perf gaps still count even when line count grows or does not shrink.
- Do not chase tiny line cuts that obscure behavior or fight repo conventions.
- Validate against existing patterns/local rules.
- Separate quick wins from strategic refactors.
- Report uncertainty when confidence low.
- Do not force optimization when asymptotic win/trade-off is poor.
- If nothing useful to cut in simplify-only pass, say lean already.

## Output

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
