# Coding Rules

## Usage Guide

- Rules have severity: [C]ritical, [H]igh, [M]edium, [L]ow
- Rules have ID in following format: [{category}{position}-{severity}]
- When rules conflict: Higher severity wins → Existing code patterns take precedence
- Process rules by severity (Critical first)

## General Workflow [G]

- **[G1-C]** Never use `--no-verify`, `--skip-checks`, or similar flags when committing code.
- **[G2-H]** Prefer simple, clean, maintainable solutions over clever or complex ones; readability and maintainability are primary concerns.
- **[G3-H]** Make the smallest reasonable changes to reach the desired outcome; prefer incremental refactors. Ask permission before full rewrites or large reimplementations.
- **[G4-H]** Match the style and formatting of surrounding code; consistency within a file outweighs external style guides.
- **[G5-C]** Never make changes unrelated to the current task; document unrelated issues instead of fixing them.
- **[G6-H]** Comments must be true and timeless; describe current behavior (no history).
- **[G9-C]** Tests should avoid mocks when possible; prefer real implementations and real data.
- **[G10-C]** Never discard an existing implementation without explicit permission.
- **[G16-C]** No backwards compatibility; fix‑forward. Remove deprecated code only when a working replacement is in place (same change set when feasible); do not leave dead code behind.
- **[G17-H]** Default behavior parity: preserve existing behavior unless explicitly specified in tests, docs, or PR/issue description.
- **[G11-M]** Avoid names like "improved", "new", or "enhanced"; naming must be evergreen.
- **[G12-H]** Analyze existing code patterns and purpose before changing code; ask for clarification if unsure.
- **[G13-C]** Never implement fallbacks or workarounds for failing tests; fix the underlying issue.
- **[G14-C]** For behavior changes, tests must thoroughly verify desired outcomes; think about tests before implementing a feature.
- **[G15-H]** Plan first, code later; this minimizes wasted effort and improves correctness.

## Architecture & Structure [A]

- **[A1-C]** The existing code structure must not be changed without a strong reason.
- **[A2-C]** Default: reproduce every bug with a unit test before fixing it. If infeasible, state why and propose the lightest viable verification.
- **[A3-C]** Default: cover every new behavior with a unit test before implementation. If skipping TDD for a non-behavioral change, state why and propose verification.
- **[A4-M]** Minor inconsistencies and typos in the existing code may be fixed.
- **[A5-H]** All CI workflows must pass before code changes may be reviewed.

## Code Style & Patterns [S]

- **[S1-H]** Method and function bodies may not contain comments.
- **[S2-M]** Error and log messages must be a single sentence with no trailing period.
- **[S4-H]** Fail fast with detailed errors; prefer early exceptions over graceful failure.
- **[S7-H]** CQS is a core principle on designing functions and methods

## Class Requirements [C]

- **[C1-C]** Every interface must have a supplementary documentation preceding it.
- **[C2-H]** A class docblock must explain the purpose of the class and provide usage examples.
- **[C3-C]** Implementation inheritance must be avoided at all costs (not to be confused with subtyping).
- **[C4-H]** Favor immutability; avoid getters/setters (anemic object model).
- **[C7-H]** Every class may have only one primary constructor; any secondary constructor must delegate to it.
- **[C9-C]** Avoid utility classes, static methods, and public static literals. Allowed only for pure, dependency‑free helpers or factory/constructor helpers, or when required by a framework; no hidden state or side effects.
- **[C11-C]** All classes must be declared final, thus prohibiting inheritance.

## Method Requirements [M]

- **[M1-C]** Methods must never return `null`.
- **[M3-C]** `null` may not be passed as an argument.
- **[M4-C]** Type introspection or reflection on object internals is strictly prohibited.
- **[M6-H]** Exception messages must include as much context as possible.

## Documentation [D]

- **[D1-H]** README.md must explain repo purpose, stay concise, and use correct English.
- **[D4-H]** Docblocks must be written in English only, using UTF-8 encoding.

## Testing Standards [T]

- **[T1-C]** Every test must test only public behavior.
- **[T2-C]** Every domain logic change must be covered by a unit test to guarantee repeatability.
- **[T3-H]** Tests should verify one behavior and stay concise; use Given-When-Then when it improves clarity.
- **[T5-H]** Every test must assert at least once.
- **[T6-M]** Prefer a one-to-one mapping between test files and feature files; group only when it reduces duplication.
- **[T8-M]** Use edge or irregular inputs (e.g., non-ASCII) when relevant.
- **[T9-M]** Avoid shared mutable state or shared constants across tests; prefer local fixtures.
- **[T11-M]** Tests must be named as full English sentences describing the behavior of SUT (System under test).
- **[T12-H]** Tests may not test functionality irrelevant to their stated purpose.
- **[T13-H]** Tests must close resources they use, such as file handlers, sockets, and database connections.
- **[T14-H]** Objects must not provide functionality used only by tests.
- **[T15-M]** Tests may not assert on side effects such as logging output.
- **[T17-M]** Tests should prepare a clean state at the start; avoid teardown except for required resource closure.
- **[T21-M]** Store temp files in temp directories and use ephemeral TCP ports.
- **[T22-H]** Tests must be quiet; disable logging from objects under test.
- **[T24-H]** Tests must not wait indefinitely for any event; they must always stop waiting on a timeout.
- **[T27-H]** Tests must assume the absence of an Internet connection.
- **[T28-H]** Avoid asserting on full error messages; prefer types, codes, or stable identifiers.
- **[T29-H]** Tests must not rely on default configurations of the objects they test; provide custom arguments.
- **[T30-H]** Avoid mocking the file system, sockets, or memory managers unless necessary.
- **[T32-M]** Inline small fixtures instead of loading them from files.
- **[T33-M]** Create large fixtures at runtime rather than store them in files.
- **[T34-M]** Tests may create supplementary fixture objects to avoid code duplication.

## AI Code Generation Process [AI]

- **[AI2-H]** Write tests before implementation when following TDD (behavior changes, bug fixes); otherwise ensure appropriate verification.
- **[AI3-H]** Design interfaces before classes
- **[AI4-H]** Implement with immutability in mind
- **[AI5-H]** Error handling: validate early, use Optionals, throw specific exceptions
