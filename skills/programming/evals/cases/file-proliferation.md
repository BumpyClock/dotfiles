# file-proliferation

## Trigger
Digests-Swift repo audit (2026-07-04): several classes ended up with 7-11 separate test files (e.g. split by feature/PR rather than by fixture), produced by parallel agent workstreams each avoiding file contention by creating a new test file for the same type.

## Expected
SKILL.md Principles: "Tests follow SUT ownership: new tests for an existing type go in that type's existing test file; split only past ~500 lines or for genuinely distinct fixtures." SKILL.md Delegation: "test-file contention → sequence or reassign, never a parallel test file for the same type."

## Observed failure
Multiple parallel agents (Sonnet 4.5, various dates) each created a fresh test file per workstream to avoid merge conflicts, fragmenting one type's tests across 7-11 files with no size or fixture justification.
