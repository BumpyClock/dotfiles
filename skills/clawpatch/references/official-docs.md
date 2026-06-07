# Clawpatch Docs Notes

Sources checked 2026-06-07: `https://clawpatch.ai/`, GitHub docs `index`, `quickstart`, `code-review`, `findings`, `patching`, `validation`, `configuration`, `safety`.

## Model

- Maps repo -> semantic features.
- Reviews bounded feature context -> findings.
- State in `.clawpatch/`: `config.json`, `project.json`, `features/`, `findings/`, `patches/`.
- `--json` = machine stdout; progress/warnings stderr.

## Common Flow

```bash
clawpatch init
clawpatch map
clawpatch review --limit 3 --jobs 3
clawpatch report
clawpatch fix --finding <id>
clawpatch revalidate --finding <id>
git diff
```

## Review

```bash
clawpatch review --limit 3
clawpatch review --limit 12 --jobs 4
clawpatch review --feature <id>
clawpatch review --since origin/main
clawpatch review --mode deslopify --limit 3
clawpatch review --provider codex --model <model>
```

- Consumes `clawpatch map` features.
- Claims feature locks; releases after review.
- `--since <ref>` limits to changed owned/context files vs `HEAD`.
- Rate limit: `--rate-limit-per-minute` or `CLAWPATCH_RPM`.
- Provider output must be strict JSON.
- Rejects unavailable evidence paths, stale line ranges, mismatched quotes.

## Deslopify

Simplification-only review. Report maintainability/performance findings rooted in accidental complexity.

Good targets: semantic duplication, pass-through wrappers, shadow modules, prod bloat, dead legacy paths, no-boundary defensive code, private-structure tests, type/build silencing, band-aid hacks.

Skip: file-size taste, normal framework boilerplate, broad architecture opinion.

## Findings

Finding fields: feature ID, title, category, severity, confidence, triage, evidence, reasoning, repro, recommendation, test gap, suggested regression test, minimum fix scope, status, linked patch attempts, history.

Statuses: `open`, `false-positive`, `fixed`, `wont-fix`, `uncertain`.

```bash
clawpatch status
clawpatch next
clawpatch show --finding <id>
clawpatch report --json
clawpatch triage --finding <id> --status false-positive --note "covered by contract test"
clawpatch revalidate --all --status open --limit 10
```

`triage` appends history; IDs stay stable.

## Fix/Validate

- `fix --finding <id>` only; explicit, scoped.
- Checks source worktree clean outside `.clawpatch/` when configured.
- Creates patch attempt, asks provider for plan/edit, runs configured `format`, `typecheck`, `lint`, `test`, records results, links attempt.
- Validation success -> finding `uncertain`; failure -> `open`.
- CLI does not mark `fixed` from patch pass alone. Revalidate after edits.
- Current limits: no `--skip-*` validation flags, no finding-targeted test generation, no parallel batch revalidation.

## Config/Safety

Config order: `--config`, `CLAWPATCH_CONFIG`, `$CLAWPATCH_STATE_DIR/config.json`, `clawpatch.config.json`, `.clawpatch/config.json`, defaults.

Env: `CLAWPATCH_STATE_DIR`, `CLAWPATCH_PROVIDER`, `CLAWPATCH_MODEL`, `CLAWPATCH_REASONING_EFFORT`.

Safe facts:

- `review`, `status`, `report`, `doctor`, `map --dry-run` do not edit source.
- `fix` needs `--finding <id>` and refuses dirty source by default.
- `.clawpatch/` state may change during runs.
- Codex provider review/revalidate uses read-only sandbox.
- No normal-flow auto commit/PR/landing/rollback/global process lock.
- After fix, caller owns `git diff` + tests before commit.
