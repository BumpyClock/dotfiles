# TDD Rules (Detailed)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

Core principle: If you didn't watch the test fail, you don't know if it tests the right thing.

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

## The Iron Law

When doing TDD: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST

Write code before the test? Delete it and start over if you are committed to TDD.

If you are following TDD, no exceptions:
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete

Implement fresh from tests.

## Red-Green-Refactor

- RED: write one minimal test showing one behavior.
- Verify RED: run the test; confirm it fails for the expected reason.
- GREEN: write the simplest code to pass.
- Verify GREEN: re-run the test; ensure all tests still pass.
- REFACTOR: clean up while keeping tests green.

Do not add features beyond the test.

## Verification Checklist

Before marking work complete:

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output pristine (no errors, warnings)
- [ ] Tests use real code (mocks only if unavoidable)
- [ ] Edge cases and errors covered

Can't check all boxes? If you intended to follow TDD, you didn't. Either restart with TDD or explicitly decide to skip and state why.

## When Stuck

| Problem | Solution |
|---------|----------|
| Don't know how to test | Write wished-for API. Write assertion first. Ask your human partner. |
| Test too complicated | Design too complicated. Simplify interface. |
| Must mock everything | Code too coupled. Use dependency injection. |
| Test setup huge | Extract helpers. Still complex? Simplify design. |

## Debugging Integration

Bug found? Default to a failing test that reproduces it, then follow the TDD cycle. If a test is infeasible, state why and propose the lightest viable verification.

## References

- [references/tdd-examples.md](tdd-examples.md) - examples and rationale
- [../test-driven-development/test-anti-patterns.md](../test-driven-development/test-anti-patterns.md) - testing anti-patterns
