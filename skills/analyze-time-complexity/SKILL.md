---
name: analyze-time-complexity
description: Analyze code for time complexity bottlenecks, explain the current Big O cost, and suggest lower-complexity refactors without changing code. Use when the user provides code, files, or a codebase area and wants performance-oriented complexity analysis sorted by impact.
---

# Analyze Time Complexity

Use this skill for Big O analysis only. Do not make code changes.

## Initial Handling

- If the user provides code, analyze that code.
- If the user provides files or directories, analyze all requested code in that scope.
- If no code or scope is provided, respond exactly:

```text
No code provided for analysis. Do you want me to analyse the entire codebase?
```

## Workflow

1. Read all requested code before drawing conclusions.
2. Identify the current time complexity for each relevant function, loop nest, traversal, search, sort, allocation, or repeated operation.
3. Explain the specific bottlenecks. Name the loops, data scans, nested lookups, repeated recomputation, or expensive operations causing the cost.
4. Suggest a refactored approach with lower asymptotic cost when a meaningful improvement exists.
5. Call out trade-offs:
   - space complexity changes
   - readability or implementation complexity
   - preprocessing or caching overhead
   - edge cases or behavior changes to watch
6. Rank findings by impact so the most meaningful wins appear first.

## Output Requirements

For each item, include:

- current time complexity
- what causes it
- lower-complexity alternative
- expected new complexity
- space/readability trade-offs
- why the suggestion is or is not worth doing

## Rules

- Analyze all code requested by the user; do not stop early.
- Do not make code changes.
- Be specific about the operation driving each complexity class.
- Do not force an optimization when the asymptotic gain is negligible or the trade-off is poor.
- Prefer clear explanations and justified suggestions over broad claims.

