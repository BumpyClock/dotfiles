---
name: verify-this
description: "Verify concrete claims with fresh evidence; return VERIFIED/NOT VERIFIED/INCONCLUSIVE."
source: https://github.com/shaneholloman/cursor-plugins/tree/main/cursor-team-kit/skills/verify-this
license: MIT
---

# Verify This

Use when user asks to verify, prove, measure, confirm a fix, or show evidence for a concrete claim. Stricter than normal test run: goal is to prove or disprove one falsifiable statement.

Use GO/NO-GO mode for acceptance verification, high-risk completion checks, browser/data capture validation, migration readiness, PR cleanup readiness, or independent verifier decision.

Do not use for vague quality claims like "the code is cleaner". Ask for measurable claim first.

## Workflow

1. Restate claim in falsifiable form: condition, metric, threshold, expected direction.
2. Choose smallest local surface that could disprove the claim.
3. Capture baseline evidence when possible: merge base, parent commit, failing branch, current broken repro, or pre-change artifact.
4. Capture treatment evidence with same command, data, warmup, environment.
5. Compare raw artifacts: test output, terminal transcript, HTTP response, screenshot, trace, profile, timing, or heap snapshot.
6. Return exactly one verdict: `VERIFIED`, `NOT VERIFIED`, or `INCONCLUSIVE`.

## GO/NO-GO Mode

For acceptance gates where user needs a shipping decision rather than single claim verdict.

1. Restate acceptance criteria as falsifiable checks.
2. Verify against current local artifacts/code/live UI. Do not trust prior assistant reports.
3. Check every saved/generated artifact exists, is non-empty when expected, matches manifest or source of truth.
4. Check sensitive data handling when relevant: no secrets, credentials, private prompts, customer data, or unrelated personal data persisted.
5. Return `GO` only when every required acceptance check passes with current evidence.
6. Return `NO-GO` when any required check fails, is blocked, or cannot be verified.
7. If `NO-GO`, list exact repair actions. If `GO`, list residual risks only when real.

Output starts with `GO` or `NO-GO` before explanation.

## Local Surfaces

- Code behavior: focused unit/integration test or minimal repro script.
- CLI/TUI behavior: terminal transcript, command output, or recording.
- UI behavior: screenshots, browser traces, accessibility snapshot, or pixel/DOM checks.
- API behavior: local HTTP/RPC request and response diff.
- Performance: same-machine baseline/treatment timings or profiles.
- Memory: heap snapshots before and after suspected operation.

## Artifacts

Prefer inline evidence unless files are useful and safe. If writing artifacts safe, use:

```text
/tmp/verify-this/<claim-slug>/
|-- claim.md
|-- timeline.md
|-- baseline/
|-- treatment/
|-- diff/
`-- verdict.md
```

Do not store sensitive prompts, screenshots, HTTP bodies, heap data, customer data, credentials, or private code extracts unless user explicitly agrees.

## Verdict Rules

- `VERIFIED`: baseline and treatment differ in predicted direction by claimed threshold with no obvious confound.
- `NOT VERIFIED`: behavior unchanged, moves wrong way, or misses threshold.
- `INCONCLUSIVE`: no valid baseline, noisy signal, failed measurement, or environment difference invalidates comparison.

## Output

Claim verification:

```text
VERIFIED | NOT VERIFIED | INCONCLUSIVE
Claim: <falsifiable claim>

Evidence:
<metric/artifact>: baseline=<...>, treatment=<...>, delta=<...>, threshold=<...>

Reasoning:
<one tight paragraph naming evidence and confounds>
```

GO/NO-GO verification:

```text
GO | NO-GO
Scope: <what was verified>

Evidence:
| Check | Evidence | Result |
| --- | --- | --- |
| <criterion> | <artifact/command/live check> | PASS/FAIL |

Repair actions:
- <only when NO-GO>

Residual risks:
- <only real remaining risks>
```

Do not soften negative results. Clear `NOT VERIFIED` is useful.
