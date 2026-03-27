---
name: analyze-codebase-improvements
description: Analyze a repository for high-value maintainability, correctness, testing, documentation, dependency, and simplification opportunities without changing code. Use when the user wants a whole-codebase improvement scan, a scoped cleanup review, or a ranked list of high-leverage refactors, deletions, or modernization work.
---

# Analyze Codebase Improvements

Use this skill for analysis-only repo reviews. Do not make code changes.

## Inputs

- Optional scope paths, globs, or directories
- Optional focus areas
- Default scope: whole repository
- Default focus: `all`

## Focus Areas

- `architecture` - boundaries, module structure, coupling, layering
- `complexity` - hard-to-follow control flow, oversized files, needless abstraction
- `duplication` - repeated logic, copy-paste code, near-duplicate modules
- `dead-code` - unused files, stale abstractions, removable code paths
- `legacy-code` - old patterns, compatibility bridges, hard-coded values, orphan flows
- `tests` - missing coverage, weak assertions, risky untested behavior
- `errors` - silent failures, swallowed exceptions, weak error reporting
- `types` - weak invariants, leaky models, unclear boundaries
- `comments` - stale or misleading comments/docs
- `docs` - setup drift, architecture drift, missing guidance
- `deps` - unused, outdated, overlapping, or unnecessary dependencies
- `simplify` - places where smaller or clearer code would help most
- `all` - run all applicable analyses

## Workflow

1. Read repo-level docs and local instructions first.
2. Parse user input into scope and focus. Exclude generated, vendored, build, and lockfile-only areas unless explicitly requested.
3. Map the repo shape: directories, languages, frameworks, tooling, hotspots, large files, and stale areas.
4. Choose applicable review lenses from the focus areas above.
5. If subagents are available and allowed in the current session, split the work into bounded parallel passes. Otherwise, perform equivalent local passes by subsystem or focus area.
6. Require concrete evidence for every finding: file paths, symbols, repeated patterns, or specific failure modes.
7. Merge duplicate findings. Drop speculative, style-only, or low-signal feedback.
8. Rank remaining opportunities by impact, effort, confidence, and regression risk.

## Output Format

Use this structure:

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
- Missing coverage, stale docs, or toolchain cleanup

## Questions / Assumptions
- Uncertainties that need confirmation
```

## Rules

- Analysis only; do not modify code.
- Prefer high-leverage findings over exhaustive nitpicks.
- Favor deletion and simplification over new abstraction.
- Validate findings against existing patterns and local repo rules.
- Separate quick wins from strategic refactors.
- Report uncertainty explicitly when confidence is low.

