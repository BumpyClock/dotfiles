---
name: analyze-codebase-improvements
description: "Read-only repo audit: maintainability, correctness, tests, docs, deps, perf."
---

# Analyze Codebase Improvements

Analysis-only repo reviews. Do not make code changes.

## Inputs

- Optional scope paths, globs, or directories
- Optional focus areas
- Default scope: whole repository
- Default focus: `all`

## Focus Areas

- `architecture` - boundaries, module structure, coupling, layering
- `complexity` - hard-to-follow control flow, oversized files, needless abstraction
- `time-complexity` - algorithmic hot paths, repeated scans, nested lookups, unnecessary recomputation
- `duplication` - repeated logic, copy-paste code, near-duplicate modules
- `dead-code` - unused files, stale abstractions, removable code paths
- `legacy-code` - old patterns, compatibility bridges, hard-coded values, orphan flows
- `tests` - missing coverage, weak assertions, risky untested behavior
- `errors` - silent failures, swallowed exceptions, weak error reporting
- `types` - weak invariants, leaky models, unclear boundaries
- `comments` - stale, misleading, or redundant comments; missing code-level documentation
- `docs` - setup drift, architecture drift, missing API or contributor guidance
- `deps` - unused, outdated, overlapping, or unnecessary dependencies
- `simplify` - places where smaller/clearer code would help most
- `all` - run all applicable analyses

## Workflow

1. Read repo-level docs and local instructions first.
2. Parse user input into scope and focus. Exclude generated, vendored, build, lockfile-only areas unless explicitly requested.
3. Map repo shape: directories, languages, frameworks, tooling, hotspots, large files, stale areas.
4. Choose applicable review lenses from focus areas.
5. Focus includes `comments`, `docs`, or `all` → invoke `technical-writer` subagent if available. Otherwise equivalent local documentation audit. Require it to:
   - validate all existing comments in scope for accuracy, drift, long-term value
   - separate stale, redundant, and missing documentation coverage
   - audit language-appropriate documentation standards (JSDoc/TSDoc for TS/JS, docstrings for Python, Go doc comments for exported symbols, rustdoc for public Rust APIs, `///` DocC for public Swift APIs)
6. Focus includes `time-complexity` or `all` → inspect hot functions, loop nests, traversals, searches, sorts, repeated allocations, recomputation. For each worthwhile item:
   - identify current time complexity
   - name exact operation driving cost
   - propose lower-complexity alternative when materially helpful
   - call out space, readability, preprocessing, caching, or behavior trade-offs
   - say when optimization not worth churn
7. Subagents available/allowed → split into bounded parallel passes. Otherwise equivalent local passes by subsystem or focus area.
8. Require concrete evidence for every finding: file paths, symbols, repeated patterns, hot operations, specific failure modes.
9. Merge duplicate findings. Drop speculative, style-only, or low-signal feedback.
10. Rank remaining opportunities by impact, effort, confidence, regression risk.

## Output Format

```markdown
# Codebase Improvement Summary

## Executive Summary
- 2-4 sentence summary of overall codebase health and biggest opportunities

## Top Improvements To Make Now
- [High impact | Medium effort | 90% confidence] Title
  - Files/Symbols: ...
  - Evidence: ...
  - Smallest viable change: ...
  - Why now: ...

## Quick Wins
- Low-risk, high-leverage cleanups

## Strategic Refactors
- Larger changes that need planning

## Deletion / De-scope Opportunities
- Code, configs, abstractions, or deps that can likely be removed

## Test / Docs / Dependency Gaps
- Missing coverage, stale docs, missing API documentation, or toolchain cleanup

## Questions / Assumptions
- Uncertainties that need confirmation
```

For `time-complexity` findings, include extra fields inside relevant item:

- Current complexity: ...
- Bottleneck: ...
- Lower-complexity alternative: ...
- Expected new complexity: ...
- Space/readability trade-offs: ...
- Worth doing?: ...

## Rules

- Analysis only; do not modify code.
- Prefer high-leverage findings over exhaustive nitpicks.
- Favor deletion and simplification over new abstraction.
- Validate findings against existing patterns and local repo rules.
- Separate quick wins from strategic refactors.
- Report uncertainty explicitly when confidence low.
- Do not force optimization when asymptotic win negligible or trade-off poor.
