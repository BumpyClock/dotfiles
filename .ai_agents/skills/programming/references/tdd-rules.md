# TDD Rules (Detailed)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

Core principle: If you didn't watch the test fail, you don't know if it tests the right thing.

Violating the letter of the rules is violating the spirit of the rules.

## When to Use

Always:
- New features
- Bug fixes
- Refactoring
- Behavior changes

Exceptions (ask your human partner):
- Throwaway prototypes
- Generated code
- Configuration files

## The Iron Law

NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST

Write code before the test? Delete it. Start over.

No exceptions:
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

Can't check all boxes? You skipped TDD. Start over.

## When Stuck

| Problem | Solution |
|---------|----------|
| Don't know how to test | Write wished-for API. Write assertion first. Ask your human partner. |
| Test too complicated | Design too complicated. Simplify interface. |
| Must mock everything | Code too coupled. Use dependency injection. |
| Test setup huge | Extract helpers. Still complex? Simplify design. |

## Debugging Integration

Bug found? Write failing test reproducing it. Follow TDD cycle. Test proves fix and prevents regression.

Never fix bugs without a test.

## References

- [references/tdd-examples.md](tdd-examples.md) - examples and rationale
- [../test-driven-development/test-anti-patterns.md](../test-driven-development/test-anti-patterns.md) - testing anti-patterns
