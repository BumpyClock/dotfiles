---
name: change-amplification
description: Find PRs where one intended change forced edits across conceptually separate files/tests/configs/prompts/docs because architecture lacks one clear owner, contract, or boundary. Use when asked for change amplification, missing boundaries, PR-based architecture debt, or ranked cleanup backlog from PR history.
---

# Change Amplification

Find PRs that show change amplification: one intended change forced edits across multiple conceptually separate places because the architecture did not name one clear owner, contract, or boundary.

This is not a blame report and not a list of bad PRs. Output is a ranked backlog of missing boundaries with PR links as evidence.

## Inputs

Use PR history, current code, and repo docs/tests. Prefer `gh` for PR data.

Useful commands:

```bash
gh pr list --state merged --limit 100 --json number,title,url,body,mergedAt,files,additions,deletions
gh pr view <pr> --json number,title,url,body,files,commits,mergedAt
gh pr diff <pr> --patch
```

If the target window, repo, or PR set is unclear, ask or choose a bounded recent window and say so.

## Candidate Detection

Look for PRs where:

- one intended conceptual change appears in title/body,
- edits span conceptually separate layers or artifacts: source, tests, config, prompts, docs, generated code, scripts, migrations,
- repeated edits look like drift from a missing owner/contract/boundary,
- the same invariant is encoded in multiple places,
- tests had to change in many areas because no single contract captured behavior.

Reject PRs where breadth was justified:

- genuine cross-cutting feature,
- intentional broad refactor,
- generated/mechanical update only,
- migration that necessarily touches all call sites,
- formatting/rename-only breadth,
- one-time cleanup with no future leverage.

## Verification Against Current Code

Before reporting a candidate as actionable, verify the suspected boundary gap still exists in current code.

1. Inspect current files that carried the amplified change.
2. Search for current owner/contract/type/test/lint rule that may already centralize the concept.
3. If current code fixed the issue, mark `Resolved` or omit from actionable backlog.
4. If evidence is incomplete, mark `Needs investigation`, not actionable.
5. Include only actionable cleanups when the current code still shows duplicated ownership, scattered invariant logic, weak contract, or missing guardrail.

## Analysis Questions

For each verified candidate, answer:

1. Intended change: the single conceptual change, usually from PR title/body.
2. Amplification evidence: which files/tests/configs/prompts/docs had to change. Cite paths.
3. Why architectural: why this was not ordinary feature breadth. Name the missing boundary, owner, or contract.
4. Better architecture: smallest change that would make the next similar PR local.
5. Mechanical prevention: what test, type, lint, schema, or contract check would catch drift next time.
6. Deletion criterion: what temporary compatibility path should be removed once the new owner exists.

## Ranking

Rank by expected future leverage:

1. Frequency likely to recur.
2. Number of concepts/files made local by the fix.
3. Bug risk from duplicated invariants.
4. Simplicity of cleanup.
5. Existence of a clear mechanical prevention check.

Do not over-rank speculative architecture rewrites. Prefer small owner/contract moves with obvious payoff.

## Output

```markdown
## Ranked Change-Amplification Backlog

### 1. <missing boundary / owner / contract>
- PR evidence: <PR title> <PR link>
- Intended change: <single conceptual change>
- Amplification evidence: <paths grouped by concept>
- Current-code validation: <what was checked; why issue still exists>
- Why architectural: <missing owner/contract/boundary>
- Better architecture: <smallest localizing change>
- Mechanical prevention: <test/type/lint/contract check>
- Deletion criterion: <compat path to remove later>
- Leverage: High | Medium | Low — <why>

## Rejected Candidates
- <PR link/title>: rejected because <genuine cross-cutting/refactor/resolved/etc.>

## Verification Notes
- Commands/data sources used.
- Limits or blind spots.
```

Keep findings evidence-backed. No private transcript paths, secrets, or unrelated personal data.
