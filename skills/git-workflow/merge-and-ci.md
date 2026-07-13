# Merge and CI

Goal: merge safely, resolve conflicts deliberately, inspect CI with `gh` evidence.

## Merge

Repo convention wins: check recent merged PRs (`gh pr list --state merged --limit 5`) or repo settings. Else: merge commit when branch history meaningful; squash for WIP/noisy commits; rebase for small clean linear commits. Squash/rebase flatten branch context — avoid when individual commits carry meaning.

Pre-merge gate: CI green, required reviews approved, no unresolved conversations, branch current per repo policy, no conflicts, significant changes tested (or reason stated), user asked/approved merge. Verify: `gh pr view <pr> --json mergeStateStatus,reviewDecision`, `gh pr checks <pr>`.

After merge: branch delete still needs explicit ask; cleanup rules in `commits-and-branches.md`.

## Conflicts

Branch-change consent before local merge/rebase. Find conflicted files: `git diff --name-only --diff-filter=U`.

Rules:

- Minimal correctness-first edits; preserve both sides when clearly compatible.
- Neither side clearly right → stop, ask.
- Binary conflict → ask before choosing/replacing.
- Lockfiles/generated files: regenerate with repo's own package manager/generator, stage only those exact files.
- No leftover conflict markers; no broad refactors during resolution.
- Test with repo's own commands after resolving.

Summary: files resolved, notable choices, test/build outcome, risks/checks not run.

## CI failures

CI red on user's branch/PR → inspect and fix proactively; push still needs user ask. Auth fails → ask user to run `gh auth login`.

Preferred script (bundled; `<skill-dir>` = this skill's install directory, not repo-relative):

```bash
python3 <skill-dir>/scripts/inspect_pr_checks.py --repo . --pr <number-or-url> [--json]
```

Script preserves: `gh pr checks` field drift, Actions log snippets, external URL-only checks, pending/missing logs; non-zero exit while failures remain. Fail states: `failure`, `error`, `cancelled`, `timed_out`, `action_required`, `bucket=fail`.

Manual fallback: `gh pr checks <pr> --json name,state,bucket,link,workflow` (fields rejected → use fields gh shows); `gh run view <run_id> --log`; log pending with job id → `gh api /repos/<owner>/<repo>/actions/jobs/<job_id>/logs`. External checks: report name + URL; don't chase other providers unless asked.

Fix loop: inspect failed check set → extract first actionable error with exact log text → identify root cause (no blind retries) → smallest safe fix → run matching local command when available → push only on ask → re-check only with new evidence.

Report per check: name, run URL, status, exact failure snippet, likely cause, proposed next fix. Never say green until `gh pr checks`/CI evidence says green.
