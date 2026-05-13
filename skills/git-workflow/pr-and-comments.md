# PRs and Comments

Purpose: make PRs reviewer-friendly, then handle feedback with minimal noise.

## PR creation flow

Gather facts first:

```bash
git status --short
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
gh pr view --json number,url,title 2>/dev/null || true
```

If why/problem unclear, ask before inventing. Need enough context for summary, testing, risk.

## PR body shape

```markdown
## Summary

Why this exists + what changed.

## Changes

- Key change 1
- Key change 2

## Testing

- Command/manual check run
- Not run: reason

## Review Notes

- Risky files/flows
- Specific reviewer focus
```

Title prefix when repo has no stricter convention:

- `[Feature]` new behavior
- `[Fix]` bug fix
- `[Refactor]` internal cleanup/no behavior change
- `[Perf]` perf change
- `[Docs]` docs only
- `[Test]` tests only
- `[Build]` build/deps/CI
- `[BREAKING]` breaking change

## Breaking changes

Must include:

- Title starts `[BREAKING]`.
- `**BREAKING CHANGE:** ...` in summary.
- Migration guide or exact migration steps.
- Affected APIs/interfaces.
- Deprecation timeline when applicable.

## PR templates

Feature:

```markdown
## Summary

Adds {capability} so {user/system benefit}.

## Changes

- Added {component/API/flow}
- Wired {integration point}
- Updated {docs/tests/config}

## Testing

- {command/result}
- {manual flow}

## Review Notes

- Review {risk/complex area}
```

Fix:

```markdown
## Summary

Fixes {bug} causing {impact}.

## Root Cause

{short cause}

## Changes

- {fix}
- {regression guard}

## Testing

- {command/result}
- {edge case verified}

## Review Notes

- Check {nearby flow}
```

Refactor:

```markdown
## Summary

Refactors {area} to {benefit}; behavior intended unchanged.

## Changes

- {structure/pattern change}
- {deleted/renamed/moved code}

## Testing

- {command/result proving behavior}

## Review Notes

- Compare {before/after area}
```

Create PR only when user asks:

```bash
gh pr create --title "[Fix] Handle null API response" --body "$(cat <<'EOF'
## Summary
...

## Changes
- ...

## Testing
- ...

## Review Notes
- ...
EOF
)"
```

Draft PR:

```bash
gh pr create --draft --title "..." --body "..."
```

## Comment handling flow

1. Fetch unresolved first.
2. Read all relevant feedback before editing.
3. Triage: blocking, suggestion, question, nit, praise.
4. Ask user which numbered items to address when scope ambiguous.
5. Fix blocking items first.
6. Reply with exact fix/file/commit.
7. Resolve only safe conversations; let reviewer resolve significant ones.

Push only when user asks, even for PR updates.

## Fetch comments

Preferred unresolved count:

```bash
gh api graphql -f query='query($owner:String!,$repo:String!,$pr:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$pr){reviewThreads(first:100){nodes{isResolved}}}}}' \
  -f owner='{owner}' -f repo='{repo}' -F pr={pr} \
  --jq '[.data.repository.pullRequest.reviewThreads.nodes[]|select(.isResolved==false)]|length'
```

Unresolved compact list:

```bash
gh api graphql -f query='query($owner:String!,$repo:String!,$pr:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$pr){reviewThreads(first:100){nodes{isResolved comments(first:1){nodes{path line body author{login}}}}}}}}' \
  -f owner='{owner}' -f repo='{repo}' -F pr={pr} \
  --jq '.data.repository.pullRequest.reviewThreads.nodes[]|select(.isResolved==false)|.comments.nodes[0]|"\(.path):\(.line) @\(.author.login): \(.body|split("\n")[0])"'
```

Full PR comments when needed:

```bash
gh pr view {pr} --comments
gh api repos/{owner}/{repo}/pulls/{pr}/comments
gh api repos/{owner}/{repo}/issues/{pr}/comments
gh api repos/{owner}/{repo}/pulls/{pr}/reviews
```

Bundled full fetch for current branch PR:

```bash
python3 skills/git-workflow/scripts/fetch_comments.py > pr_comments.json
```

If `gh auth status` fails, ask user to run `gh auth login`.

## Triage labels

| Label      | Action                            |
| ---------- | --------------------------------- |
| Blocking   | Must fix before merge             |
| Suggestion | Consider; ask if scope unclear    |
| Question   | Answer with evidence              |
| Nit        | Optional unless user wants polish |
| Praise     | No action, maybe acknowledge      |

Conflicting reviewer feedback:

- Do not pick sides fast.
- Summarize both views.
- Tag reviewers.
- Propose middle path only if clear.

## Reply patterns

Agree/fixed:

```text
Fixed in latest commit: added null guard in `src/api/client.ts` and regression test in `src/api/client.test.ts`.
```

Explain/no change:

```text
Keeping current approach. Reason: {constraint}. Added comment/docs in `{path}` to make this explicit.
```

Clarify:

```text
Can you clarify whether you want {option A} or {option B}? I want to avoid changing scope wrong way.
```

Batch reply:

```text
Addressed in abc123:
- {thread 1}: fixed via {file/change}
- {thread 2}: answered; no code change because {reason}
```

## Re-request review

Only after blocking/significant feedback done. Re-request existing reviewer via API:

```bash
gh api -X POST repos/{owner}/{repo}/pulls/{pr}/requested_reviewers \
  -f 'reviewers[]={username}'
```

Add new reviewer only when needed:

```bash
gh pr edit {pr} --add-reviewer {username}
```

Not needed for tiny nits unless user/repo expects it.
