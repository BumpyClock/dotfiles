# Merge and CI

Goal: merge safely, resolve conflicts deliberately, inspect CI with `gh` evidence.

## Merge choice

Default: preserve commits unless repo/user says squash/rebase.

| Strategy     | Command                     | Use when                                         |
| ------------ | --------------------------- | ------------------------------------------------ |
| Merge commit | `gh pr merge <pr> --merge`  | meaningful branch history, multiple contributors |
| Squash       | `gh pr merge <pr> --squash` | WIP/noisy commits, small fix/feature             |
| Rebase merge | `gh pr merge <pr> --rebase` | clean linear history, small clean commits        |

Never use rebase merge when branch is shared/pushed, multi-contributor, or merge context matters.

## Pre-merge gate

Before merge:

- CI green.
- Required reviews approved.
- No unresolved conversations.
- Branch up to date enough for repo policy.
- No conflicts.
- Significant changes tested locally or explicit reason not run.
- User asked/approved merge.

Check:

```bash
gh pr view <pr> --json number,title,mergeStateStatus,reviewDecision,url
gh pr checks <pr>
```

## Merge commands

```bash
gh pr merge <pr> --merge
gh pr merge <pr> --squash
gh pr merge <pr> --rebase
gh pr merge <pr> --auto --merge
```

After merge, branch delete still needs explicit ask.

```bash
git push origin --delete feature/123-done
git switch main
git pull origin main
git branch -d feature/123-done
git fetch --prune
```

Avoid one-shot cleanup. List, ask, delete exact names.

## Conflict flow

Need branch-change consent before local merge/rebase.

```bash
git fetch origin main
git switch feature/my-branch
git merge origin/main
# or
git rebase origin/main
```

Find conflicts:

```bash
git status --short
git diff --name-only --diff-filter=U
rg -n '^(<<<<<<<|=======|>>>>>>>)' .
```

Conflict markers:

```text
<<<<<<< HEAD
ours
=======
theirs
>>>>>>> origin/main
```

Resolve by choosing one side, combining, or rewriting. Binary conflict → ask before choose/replace.

Rules: minimal correctness-first edits; preserve both sides when clear; stop if neither side clearly right; regenerate lock/generated files; no conflict markers; no broad refactors.

Mark resolved:

```bash
git add path/to/resolved-file.ts
git merge --continue
# or
git rebase --continue
```

Abort path:

```bash
git merge --abort
git rebase --abort
```

Test after conflict resolution:

```bash
npm test
npm run build
```

Use repo docs/package manager. Examples are not mandate.

Summary: files resolved, notable choices, test/build outcome, risks/checks not run.

## Common conflicts

Lockfile:

- Regenerate with repo package manager, not hardcoded npm.
- Stage exact conflicted lockfile only.

```bash
npm install
pnpm install
yarn install
bun install
git add pnpm-lock.yaml
```

Generated files:

```bash
npm run generate
git add path/to/generated-file
```

Binary file: ask before choose/replace.

## CI failure workflow

Use for failing PR checks. Fix CI only when user asked or approves plan.

Auth:

```bash
gh auth status
# if fails: ask user to run gh auth login
```

Preferred script:

```bash
python3 skills/git-workflow/scripts/inspect_pr_checks.py --repo . --pr <number-or-url>
python3 skills/git-workflow/scripts/inspect_pr_checks.py --repo . --pr <number-or-url> --json
```

Script preserves: `gh pr checks` field drift, Actions log snippets, external URL-only checks, pending/missing logs, non-zero exit while failures remain. Fail states: `failure`, `error`, `cancelled`, `timed_out`, `action_required`, `bucket=fail`.

Manual fallback:

```bash
gh pr checks <pr> --json name,state,bucket,link,startedAt,completedAt,workflow
# If fields rejected, use fields shown by gh.

gh run view <run_id> --json name,workflowName,conclusion,status,url,event,headBranch,headSha
gh run view <run_id> --log
```

If run log pending and job id exists:

```bash
gh api "/repos/<owner>/<repo>/actions/jobs/<job_id>/logs" > /tmp/job.log
```

External checks: report name + URL. Do not chase other providers unless user asks.

Fix loop:

1. Inspect the failed check set before editing.
2. Extract the first actionable error with exact log text.
3. Identify likely root cause; do not retry blindly.
4. Apply the smallest safe fix.
5. Run the matching local command when available.
6. Push only when the user asks.
7. Re-check the PR check set and repeat only with new evidence.

## CI summary format

```text
Check: <name>
Run: <url>
Status: <failure|external|log_pending|log_unavailable>
Failure: <short exact snippet>
Likely cause: <one sentence>
Next fix: <small proposed action>
```

Quote exact errors. Do not say green until `gh pr checks` or CI evidence says green.
