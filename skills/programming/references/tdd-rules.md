# TDD Rules (Detailed)

## Overview

Prefer writing the test first for behavior changes. Watch it fail when feasible. Write minimal code to pass.

Core principle: if you never saw the test fail, you have weaker evidence that it tests the right thing.

This reference applies when TDD is required or explicitly chosen. For mechanical edits (renames, formatting, file moves), docs/config-only changes, or copy/paste operations that do not affect behavior, you can skip TDD and use lighter verification.

## When to Use

Default (when you choose TDD or behavior changes warrant it):
- New behavior/features
- Bug fixes
- Refactoring that could alter behavior
- Any change that affects runtime behavior

Skip or simplify (unless user explicitly requests TDD or project policy requires it):
- Mechanical edits (renames, formatting, file moves)
- Docs/config-only updates
- Copy/paste changes that do not alter behavior

## Strict TDD Mode

When strict TDD is chosen or required: default to no production change for that behavior before a failing test; deviating needs a stated reason (e.g., contract still being discovered through a spike).

If exploratory code came first, do not pretend it was TDD. Either keep going with explicit test-after verification, or restart the behavior slice from a failing test when the risk warrants it.

Never delete pre-existing or user-authored code only to satisfy process.

## Red-Green-Refactor

- RED: write one minimal test showing one behavior.
- Verify RED: run the test; confirm it fails for the expected reason.
- GREEN: write the simplest code to pass.
- Verify GREEN: re-run the test; ensure all tests still pass.
- REFACTOR: clean up while keeping tests green.

Do not add features beyond the test.

## Verification Checklist

Before marking work complete:

- [ ] New or changed behavior has coverage at the practical public surface
- [ ] Watched new/regression tests fail when feasible
- [ ] Each test failed for expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] Focused tests pass
- [ ] Relevant full gate passes before handoff
- [ ] Output and exit code read
- [ ] Tests use real code or mocks at seams
- [ ] No test named for a path its body doesn't exercise
- [ ] Edge cases and errors covered where the contract branches

Can't check applicable boxes? State what proof is missing and why.

## When Stuck

| Problem | Solution |
|---------|----------|
| Don't know how to test | Write wished-for API. Write assertion first. Ask the user. |
| Test too complicated | Design too complicated. Simplify interface. |
| Must mock everything | Test one layer up, or move dependency behind a seam. |
| Test setup huge | Extract helpers. Still complex? Simplify design. |

## Debugging Integration

Bug found? Default to a failing test that reproduces it when feasible and apt, then follow the TDD cycle. If a test is infeasible or disproportionate, state the rationale and use the lightest viable verification.

## References

- [tdd-examples.md](tdd-examples.md) - examples and rationale
- [test-anti-patterns.md](test-anti-patterns.md) - testing anti-patterns
