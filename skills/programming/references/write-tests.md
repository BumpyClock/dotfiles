# Write Tests

Use when adding tests, fixing brittle/flaky tests, reviewing a test diff, or adding regression coverage.

Core rule: a test should fail only when real behavior or an explicit contract breaks. It should pass through refactors and config edits that preserve behavior.

## Workflow

1. Write one test at a time.
2. Put the assertion first: expected behavior before setup details.
3. Run the fastest focused test command and confirm red for the expected reason when feasible.
4. Make production code earn green.
5. Use the result to decide the next test.
6. Run the relevant full gate before handoff; read output and exit code.

Batch-written tests often pin guessed behavior. Focused red-green cycles reveal what matters next.

## What To Assert

- Assert observable behavior through the outermost practical entry point: return values, exit codes, persisted rows, HTTP responses, rendered output.
- Reserve narrow unit tests for tricky pure logic such as parsers, schedulers, state machines, or math.
- Do not assert compiler guarantees: type signatures, field existence already checked by types, rejected argument types covered by static analysis.
- Assert actual values, not only collection size, especially for dedupe, normalization, ordering, idempotency, and persistence.
- Use the smallest setup that can show the behavior. Two entities and one mechanism beat a large scenario with unclear failure signals.
- Assert the design contract, not whatever current code happens to output. If no contract exists, ask or define it before pinning a number.

## Mocks And Seams

- Prefer real collaborators inside the system under test.
- Mock seams: network, clock, filesystem, process/env/config lookup, OS services, third-party SDKs.
- Do not mock internal collaborators to make setup convenient. If three internals need mocks, test one layer up.
- Do not make "was called with" the primary assertion when an observable outcome exists.
- Do not couple tests to live config values. Feed fixed inputs or stub the config lookup seam.
- Test doubles should preserve behavior the test depends on. If unsure, run with the real collaborator first and observe required side effects.
- Mock data should be schema-valid and include fields required by the contract or downstream code under test. Avoid giant fixtures that hide the relevant signal.

## Control Variables

- Change one variable per comparison.
- Pin everything unrelated: seed, counts, config, time, locale, env, feature flags.
- Deterministic behavior gets exact assertions.
- Stochastic or tuning-dependent behavior needs repeated runs/seeds and a documented band. A single lucky sample is not proof.
- Replace sleeps with condition-based waits.

## Regression Tests

A regression test should prove the old bug can fail when feasible:

1. Run against broken behavior or temporarily break the relevant production path.
2. Confirm red for the expected reason.
3. Restore/fix code.
4. Confirm green.

If falsifying the test is disproportionate or unsafe, state why and use the strongest practical proof.

## Red Test Triage

Before editing code, classify the failure:

1. Test pinned deleted or accidental semantics → re-spec to contract.
2. Test lost control of a variable → pin the variable.
3. Margin too tight for noisy behavior → widen with rationale.
4. Product code wrong → trace mechanism and fix source.

If repeated constant tweaks make neighboring tests fail, stop tuning and find the shared mechanism.

## Review Checklist

- Assertion targets observable behavior, not implementation detail.
- Test would survive harmless refactor.
- Test would survive config value edit with no logic change.
- Mocks sit at seams, not internal collaborators.
- Mock assertions are not replacing observable outcome checks.
- Counts include value assertions where value matters.
- Random/noisy behavior uses seeds or distributions.
- Test can fail for the intended reason when feasible.
- Function under test is reachable from production code; if only tests call it, consider deleting both.
