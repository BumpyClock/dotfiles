# Verification Before Completion

Use before claiming work is done, fixed, passing, green, ready, reviewed, safe to merge, or before committing, pushing, creating a PR, handing off, or moving to the next task.

Core rule: evidence before claims.

## Gate

Before a success claim:

1. Identify the command or check that proves the claim.
2. Run the full command or check fresh in this turn.
3. Read the full output and exit code.
4. Verify the output matches the claim.
5. State only what the evidence proves.

If the check fails, report failure with the exact failing command and key output. If the check was not run, say it was not run.

## Evidence Matrix

| Claim | Requires | Not enough |
| --- | --- | --- |
| Tests pass | Test command output with zero failures | Prior run, expectation, partial run unless scoped claim says partial |
| Lint clean | Lint command output with zero errors | Formatting only, compiler only |
| Build succeeds | Build command exit 0 | Tests or lint passing |
| Bug fixed | Original symptom reproduced and now passes | Code changed, manual inspection |
| Regression test works | Red-green proof when feasible | Test only passes once |
| Requirements met | Requirement checklist checked against code | Tests passing alone |
| Agent completed | Diff + verification checked by orchestrator | Agent report |

## Red Flags

Stop and verify before continuing if you are about to say:
- `done`
- `fixed`
- `passes`
- `green`
- `ready`
- `looks good`
- `should work`
- `probably`
- any synonym implying success without current evidence

Also stop before commit, push, PR, task closure, or handoff.

## Regression Tests

For bug fixes, prefer proof that the test catches the bug:

1. Add or run test against broken behavior.
2. Confirm it fails for the expected reason.
3. Apply fix.
4. Confirm it passes.

If red-green proof is infeasible or disproportionate, state why and use the strongest practical check.

## Delegated Work

Subagent status is a signal, not evidence.

Before accepting delegated work:
- Inspect changed files or diff.
- Run the relevant checks yourself when feasible.
- Compare implementation against acceptance criteria.
- Report gaps, blocked checks, or residual risk explicitly.
