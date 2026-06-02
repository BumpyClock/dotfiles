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

## Make PR easy to review

Use when the user asks to make a PR easier to review, tidy a PR, clean up reviewer guidance, annotate a diff, or reduce PR noise.

Default goal: improve reviewability without changing behavior.

1. Resolve the target PR from URL, number, or current branch.
2. Inspect commits, diff size, changed paths, generated files, and PR description.
3. Identify reviewability problems:
   - noisy or misleading commits,
   - stale PR description,
   - unrelated changes,
   - mixed mechanical and logic changes,
   - missing tests or verification notes,
   - unclear reviewer entry points.
4. Prefer safe improvements first: PR body, review notes, file grouping, and explicit test/risk notes.
5. Propose a plan before rewriting history, rebasing, squashing, or force-pushing.
6. Verify the resulting tree or diff still matches the intended code.

Reviewer guidance should include:

- TL;DR matching the actual diff.
- Core files vs generated/mechanical files.
- Risky behavior changes, migration order, rollout plan, and rollback notes when relevant.
- Test coverage and any checks not run.
- Specific reviewer focus areas.

If the PR is too large to make reviewable with notes, recommend splitting instead of polishing around the problem.

### History cleanup

Only rewrite history when the user asks or agrees to the plan. Before rewriting:

```bash
gh pr view <PR> --json title,headRefName,baseRefName,state,commits
git fetch origin <headRefName> <baseRefName>
ORIGINAL_TREE=$(git rev-parse origin/<headRefName>^{tree})
```

Useful commit grouping order:

1. Schema/storage or generated API definitions.
2. Core logic.
3. Wiring and integration.
4. UI or surface behavior.
5. Tests.

After rewriting, verify content identity:

```bash
echo "Original tree: $ORIGINAL_TREE"
echo "Current tree:  $(git rev-parse HEAD^{tree})"
git diff origin/<headRefName> --stat
```

Do not push if the tree changed unintentionally. Push still needs user approval.

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
3. Validate each comment against current code before acting. Do not fix stale, already-addressed, or incorrect feedback without saying why.
4. Triage: blocking, suggestion, question, nit, praise.
5. Separate architecture smell from normal fixes. If a valid comment points to missing boundary, owner, or contract, pause and notify the user before hot-patching around it.
6. Ask user which numbered items to address when scope ambiguous.
7. Fix blocking valid items first.
8. Reply with exact fix/file/commit.
9. Resolve only safe conversations after fix lands; let reviewer resolve significant ones unless user/repo expects agent resolution.
10. When user asks to fully clear feedback, wait/re-fetch after the requested interval and repeat until no actionable unresolved comments remain or a blocker needs user decision.

Push only when user asks, even for PR updates.

## Fetch comments

Use when the user asks to fetch PR comments, summarize review feedback, or address comments. Return a grouped action list ordered by priority, plus open questions that need user clarification.

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
| Stale/invalid | Reply with current-code evidence; no code change |
| Architecture smell | Stop normal fix loop; explain missing boundary/owner/contract and ask/propose path |

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
