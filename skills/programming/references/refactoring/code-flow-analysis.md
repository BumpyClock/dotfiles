# Code Flow Analysis

Use before simplification when behavior spans multiple files, entry points, async paths, callbacks, or hidden side effects.

## Analysis principles

1. Start from real entry points. Trace primary and secondary execution paths.
2. Map function calls, data transforms, branches, external dependencies, and side effects.
3. Identify complexity patterns: over-abstraction, duplicate logic, dead code, premature optimization, and workaround layers.
4. Understand intent, constraints, edge cases, and error handling before judging.
5. Preserve functionality. Change only how clearly the code expresses existing behavior.

## Refinement lens

- Apply repo standards and established conventions.
- Prefer explicit readable code over dense or clever code.
- Cut unnecessary complexity and nesting when comprehension improves.
- Remove or merge redundant logic only when behavior stays the same.
- Avoid over-simplification that makes debugging, extension, or maintenance harder.
- Focus on recent or requested areas unless broader review is explicitly requested.

## Output

Provide an executive summary, current execution flow, complexity hotspots, dead-code candidates, behavior-preserving simplification opportunities, priority by impact/effort, and boundary recommendations when structure is part of the problem.
