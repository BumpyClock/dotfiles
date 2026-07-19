# Deslop Pass

Use this after AI-assisted edits or when the user asks to remove slop. The goal is to make the diff read like normal local code without changing behavior.

## Focus Areas

- Remove comments that restate code, narrate obvious steps, or do not match local style. Do not add comments to compensate for unclear code when a small simplification would solve the problem.
- Remove abnormal defensive checks, broad `try`/`catch`, or fallback paths added only to avoid understanding a trusted path.
- Replace `any`, force casts, or type assertions used only to bypass the type system.
- Simplify deep nesting with guard clauses when it improves readability.
- Delete single-use abstractions, wrappers, options, or config that the task did not need.
- Align naming, error handling, tests, and file structure with nearby code.
- Keep queries free of mutation and commands explicit about meaningful returns (CQS).

## Guardrails

- Preserve behavior unless fixing a clear bug with evidence.
- Keep edits scoped to the user-requested diff.
- Do not turn deslop into a broad rewrite.
- Re-run the relevant verification after cleanup.

## Output

Keep the final summary short: what was removed or simplified, and what verification ran.
