# misleading-name

## Trigger
Digests-Swift repo audit (2026-07-04): `testNetworkErrorHandling` and `testTimeoutErrorHandling` call the SUT with normal inputs; no mock ever throws, no clock ever advances. The named error/timeout branch is never exercised.

## Expected
`tdd-rules.md` checklist: "no test named for a path its body doesn't exercise." `test-anti-patterns.md` Coverage Theater red flag: name contains error/timeout with no throw/clock in body.

## Observed failure
Agent (Sonnet 4.5, 2026-07-04) counted these as error-path coverage in a status report; the real error branch remained untested.
