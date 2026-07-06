# vacuous-test

## Trigger
Digests-Swift repo audit (2026-07-04): test file contains `XCTAssertTrue(true)` after calling a function under a name like `testDoesNotCrash`, plus a loop `for c in cases { _ = normalize(c) }` under `testHandlesAllInputsCorrectly` with no assertion at all.

## Expected
Coverage Theater gate (`test-anti-patterns.md`): "what production change makes this fail?" — none, since the assertion is a tautology or absent. Delete the test.

## Observed failure
Agent (Sonnet 4.5, 2026-07-04) kept both tests as "smoke coverage" without checking whether any real change could fail them.
