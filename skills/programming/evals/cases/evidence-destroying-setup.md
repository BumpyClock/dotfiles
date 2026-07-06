# evidence-destroying-setup

## Trigger
Digests-Swift repo audit (2026-07-04): an FTS test calls `db.rebuildFTSIndex()` in setup, then asserts the index is non-empty — but the rebuild call does the work the trigger under test was supposed to do, so the assertion holds regardless of whether the trigger fires.

## Expected
Coverage Theater gate (`test-anti-patterns.md`): "does setup manufacture the state the SUT is supposed to produce? Yes → remove that setup; let the SUT produce it."

## Observed failure
Agent (Sonnet 4.5, 2026-07-04) added the rebuild call to make a flaky test pass, unaware it now proves nothing about the trigger it was meant to verify.
