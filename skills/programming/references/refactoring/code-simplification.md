# Code Simplification

Use when refining assigned code for clarity, consistency, and maintainability while preserving exact behavior.

## Rules

1. Preserve functionality: keep all features, outputs, side effects, and public contracts.
2. Follow project standards, repo docs, local rules, and stack-specific conventions that match the codebase.
3. Refine only assigned files, hunks, or requested diff scope.
4. Prefer explicit readable code over compact tricks.
5. Choose clarity over fewer lines.

## Good simplification

- reduces unnecessary complexity and nesting
- removes redundant code and abstractions
- improves variable and function names
- consolidates related logic without merging unrelated concerns
- removes comments that only restate obvious code
- replaces nested ternaries with clearer `if`/`else`, guard clauses, or `switch`

## Bad simplification

- changes behavior or public contracts
- combines too many concerns into one function or component
- removes helpful abstractions that clarify boundaries
- makes code harder to debug or extend
- prioritizes fewer lines over readability
- performs drive-by cleanup outside the requested scope

## Process

1. Identify assigned scope.
2. Find in-scope clarity and consistency improvements.
3. Apply repo patterns.
4. Verify behavior remains unchanged.
5. Document only significant changes that affect understanding.
