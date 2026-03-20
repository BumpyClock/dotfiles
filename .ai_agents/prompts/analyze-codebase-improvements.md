---
description: "Analyze the codebase for high-value improvements using specialized agents"
argument-hint: "[scope] [focus-areas]"
allowed-tools: ["Bash", "Glob", "Grep", "Read", "Task"]
---

# Whole Codebase Improvement Analysis

Run a comprehensive codebase-wide improvement analysis using multiple specialized agents. Focus on the highest-leverage improvements with concrete evidence. Do not make code changes.

**Scope / Focus (optional):** "$ARGUMENTS"

**Primary directive:** Use parallel specialized sub-agents and agent teams to review the entire codebase and look for stale legacy code, dead code, bridges for legacy code to new code, hard coded values, orphan code paths, and logical inconsistencies.

## Analysis Workflow:

1. **Determine Analysis Scope**
   - Parse arguments into optional scope paths/globs and focus areas
   - Default: analyze the whole repository
   - If the user provides files or directories, limit analysis to that scope
   - Exclude generated, vendored, build, and lockfile-only areas unless explicitly requested

2. **Available Focus Areas**

   - **architecture** - Boundaries, module structure, coupling, layering issues
   - **complexity** - Unnecessary complexity, hard-to-follow control flow, oversized files
   - **duplication** - Repeated logic, copy-paste patterns, near-duplicate modules
   - **dead-code** - Unused files, stale abstractions, code that can be deleted
   - **legacy dode** - Old patterns, compatibility bridges, or technical debt hotspots, hard coded values, or orphan code paths
   - **tests** - Coverage gaps, weak assertions, high-risk untested behavior
   - **errors** - Silent failures, swallowed exceptions, weak error reporting
   - **types** - Weak invariants, leaky models, unclear type boundaries
   - **comments** - Incorrect, stale, or high-maintenance comments/docs
   - **docs** - Docs/config drift, missing setup or architecture guidance
   - **deps** - Unused, outdated, overlapping, or unnecessary dependencies
   - **simplify** - Places where smaller, clearer code would help most
   - **all** - Run all applicable analyses (default)

3. **Map the Codebase**
   - Read repo-level docs and any relevant local instructions first
   - Inventory major directories, languages, frameworks, and build/test tooling
   - Identify large files, hotspot modules, repeated patterns, and stale areas
   - Note risky areas: low-test modules, complex flows, legacy folders, or config drift

4. **Determine Applicable Reviews**

   Based on repository shape and requested focus:
   - **Always applicable**: `reviewer` for general code quality and design issues
   - **If tests exist or look thin**: `pr-test-analyzer` for critical test gaps
   - **If comments/docs matter**: `comment-analyzer`
   - **If error handling is important**: `silent-failure-hunter`
   - **If types/models/APIs are central**: `type-design-analyzer`
   - **If complexity or duplication stands out**: `code-simplifier`

5. **Launch Analysis Agents**

   **Parallel approach** (default):
   - Launch independent analyses simultaneously
   - Best for whole-repo or multi-directory scans
   - Faster, but requires a final validation pass

   **Sequential approach**:
   - Use when scope is narrow or findings need iterative refinement
   - Easier to inspect each pass before continuing

   For every agent:
   - Give it a bounded scope
   - Require specific file/symbol references
   - Ask for the smallest viable improvement, not a full rewrite
   - Ask it to separate quick wins from strategic refactors

6. **Validate and Rank Opportunities**

   After agents complete:
   - Verify each opportunity against the code
   - Merge duplicates and discard speculative or style-only feedback
   - Score each item on:
     - **Impact** - How much it improves maintainability, correctness, performance, or team velocity
     - **Effort** - Small, medium, or large implementation cost
     - **Confidence** - How well supported the finding is by concrete evidence
     - **Risk** - Likelihood of regressions or migration cost

7. **Provide Improvement Plan**

   Organize findings:
   ```markdown
   # Codebase Improvement Summary

   ## Executive Summary
   - 2-4 sentence summary of the codebase health and biggest opportunities

   ## Top Improvements To Make Now
   - [High impact | Medium effort | 90% confidence] Replace duplicated validation flow in `src/...`
     - Files/Symbols: ...
     - Evidence: ...
     - Smallest viable change: ...
     - Why now: ...

   ## Quick Wins
   - Low-risk, high-leverage cleanups worth doing soon

   ## Strategic Refactors
   - Larger changes that need planning but would pay off materially

   ## Deletion / De-scope Opportunities
   - Code, configs, abstractions, or dependencies that can likely be removed

   ## Test / Docs / Dependency Gaps
   - Missing coverage, stale docs, or toolchain cleanup opportunities

   ## Questions / Assumptions
   - Anything uncertain that needs confirmation before acting
   ```

## Usage Examples:

**Whole repo scan (default):**
```text
/analyze-codebase-improvements
```

**Limit to a directory + focus areas:**
```text
/analyze-codebase-improvements src architecture duplication
```

**Review prompt/docs hygiene only:**
```text
/analyze-codebase-improvements prompts docs comments
```

**Focus on test and dependency cleanup:**
```text
/analyze-codebase-improvements tests deps
```

## Tips:

- Prefer high-leverage findings over exhaustive nitpicks
- Favor deletions and simplifications over new abstractions
- Ignore generated or vendored code unless the user asks about it
- Validate opportunities against existing project patterns and local rules
- For large repos, analyze one subsystem at a time and compare results


## Notes:

- This prompt is analysis-only; it should not change code
- Findings should include evidence and a smallest viable next step
- Prefer concrete improvements over broad rewrites
- If confidence is low, report the uncertainty explicitly
