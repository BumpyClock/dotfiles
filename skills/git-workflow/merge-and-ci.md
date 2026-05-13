# Merge and CI

Purpose: merge safely, resolve conflicts deliberately, inspect CI failures with `gh` evidence.

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

After merge, branch deletes still need explicit ask.

```bash
git push origin --delete feature/123-done
git switch main
git pull origin main
git branch -d feature/123-done
git fetch --prune
```

Avoid one-shot cleanup. List, ask, then delete exact names.

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
```

Conflict markers:

```text
<<<<<<< HEAD
ours
=======
theirs
>>>>>>> origin/main
```

Resolve by choosing one side, combining, or rewriting. If binary conflict, ask before choosing/replacing.

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

Always test after conflict resolution:

```bash
npm test
npm run build
```

Use repo docs/package manager; commands above are examples, not default mandate.

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

Binary file: ask user before choose/replace.

## CI failure workflow

Use for failing PR checks. Implement CI fixes only when user already asked for fixing CI or explicitly approves plan.

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

Script behavior to preserve:

- Handles `gh pr checks` field drift.
- Fetches GitHub Actions logs and failure snippets.
- Marks external checks as external with URL only.
- Reports pending/missing logs explicitly.
- Exits non-zero while failures remain.
- Treats these as failure: `failure`, `error`, `cancelled`, `timed_out`, `action_required`, `bucket=fail`.

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

External checks: report name + URL. Do not chase Buildkite/other providers unless user asks.

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
