# Code Documentation

Use when code comments, public API docs, README snippets, or generated documentation change.

## What to check

- Documentation matches current code behavior and public contracts.
- Comments explain non-obvious constraints, invariants, trade-offs, or operational context.
- Redundant comments that restate code are removed.
- Public APIs follow language-appropriate documentation conventions.
- Docs avoid transient details, stale TODOs, and implementation promises that are not true.

## Delegation

Use `technical-writer` for edited public docs, comments, and API docs. Ask it to verify documentation against code facts, not just grammar.

## Principles

- Keep docs concise, accurate, and in correct English.
- Prefer examples when they clarify API behavior.
- Do not add comments to compensate for unclear code when small code simplification would solve the problem.
