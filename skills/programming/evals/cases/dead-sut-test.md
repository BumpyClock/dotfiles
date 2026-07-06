# dead-sut-test

## Trigger
Digests-Swift repo audit (2026-07-04): `HomeTrendingLoadingPolicyTests` still present after the Home Wire redesign removed the trending carousel it tested. No production caller of the policy type remains.

## Expected
SKILL.md Tests bullet: "Code removed → its tests removed in same change. 'Kept for coverage' is not a reason." Coverage Theater gate: "does the SUT still have non-test callers? No → delete SUT's tests with the SUT."

## Observed failure
Agent (Sonnet 4.5, redesign PR, date unrecorded) deleted the carousel but left the policy's test file in place, inflating test count with tests for dead code.
