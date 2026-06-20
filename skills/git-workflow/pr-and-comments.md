# PRs and Comments

Goal: reviewable PRs, low-noise feedback handling.

## Create/update PR

Inspect first:

```bash
git status --short
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
gh pr view --json number,url,title 2>/dev/null || true
```

If why unclear, ask. PR body:

```markdown
## Summary
Why + what changed.

## Changes
- Key change

## Testing
- Command/result
- Not run: reason

## Review Notes
- Risky files/flows
- Reviewer focus
```

Prefixes when repo lacks rule: `[Feature]`, `[Fix]`, `[Refactor]`, `[Perf]`, `[Docs]`, `[Test]`, `[Build]`, `[BREAKING]`.

Breaking change needs `[BREAKING]`, `**BREAKING CHANGE:**`, migration steps, affected API.

Create only when user asks:

```bash
gh pr create --title "[Fix] Handle null API response" --body "$(cat <<'EOF'
## Summary
...
EOF
)"
gh pr create --draft --title "..." --body "..."
```

## Improve reviewability

Use for tidy PR / reduce noise / reviewer guidance.

1. Resolve target PR.
2. Inspect commits, diff size, paths, generated files, PR body.
3. Flag noise: stale body, unrelated changes, mixed mechanical+logic, missing tests, unclear entry points.
4. Prefer safe edits: PR body, review notes, file grouping, test/risk notes.
5. Plan before history rewrite/rebase/squash/force-push.
6. Verify final diff still matches intended code.

If too large, recommend split. Do not polish around wrong PR shape.

History cleanup needs user approval:

```bash
gh pr view <PR> --json title,headRefName,baseRefName,state,commits
git fetch origin <headRefName> <baseRefName>
ORIGINAL_TREE=$(git rev-parse origin/<headRefName>^{tree})
# rewrite...
git diff origin/<headRefName> --stat
```

Do not push if tree changed unintentionally.

## Fetch comments

Use for PR feedback summary/fix loops. Prefer installed tool:

```bash
pr-comments
pr-comments <pr>
pr-comments <pr> --repo <owner/repo> --json
pr-comments <pr> --all
```

Default: unresolved review threads + open PR conversation comments + review bodies, full text. `--json` for agent/script triage. `--all` when resolved/outdated context matters.

Fallbacks:

```bash
gh pr view {pr} --comments
gh api repos/{owner}/{repo}/pulls/{pr}/comments
gh api repos/{owner}/{repo}/issues/{pr}/comments
gh api repos/{owner}/{repo}/pulls/{pr}/reviews
python3 skills/git-workflow/scripts/fetch_comments.py > pr_comments.json
```

Auth fails → ask user to run `gh auth login`.

## Handle feedback

1. Fetch unresolved/open first.
2. Read all relevant comments before editing.
3. Validate each against current code. Skip stale/invalid with evidence.
4. Triage: blocking, suggestion, question, nit, praise.
5. Architecture smell (missing boundary/owner/contract) → stop normal fix loop, tell user.
6. Ambiguous scope → ask which numbered items to address.
7. Fix valid blocking items first.
8. Reply with exact fix/file/commit.
9. Resolve only safe conversations after reply/fix; let reviewer resolve significant threads unless repo expects agent resolution.
10. User asks “clear all” → re-fetch and repeat until no actionable unresolved comments or blocker needs decision.

Push only when user asks.

| Label | Action |
| --- | --- |
| Blocking | Fix before merge |
| Suggestion | Consider; ask if scope unclear |
| Question | Answer with evidence |
| Nit | Optional unless user wants polish |
| Praise | No action |
| Stale/invalid | Reply with current-code evidence |
| Architecture smell | Stop; propose boundary/owner/contract path |

Conflicting reviewers: summarize both, tag reviewers, propose middle path only if clear.

## Replies

```text
Fixed in latest commit: added null guard in `src/api/client.ts` and regression test in `src/api/client.test.ts`.
```

```text
Keeping current approach. Reason: {constraint}. Added docs in `{path}`.
```

```text
Can you clarify whether you want {option A} or {option B}? I want to avoid wrong scope.
```

```text
Addressed in abc123:
- {thread 1}: fixed via {file/change}
- {thread 2}: answered; no code change because {reason}
```

## Re-request review

Only after blocking/significant feedback done.

```bash
gh api -X POST repos/{owner}/{repo}/pulls/{pr}/requested_reviewers \
  -f 'reviewers[]={username}'
gh pr edit {pr} --add-reviewer {username}
```
