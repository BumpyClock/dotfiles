# PRs and Comments

Goal: reviewable PRs, low-noise feedback handling.

## Create/update PR

Inspect first: `git log --oneline origin/main..HEAD`, `git diff --stat origin/main...HEAD`, existing `gh pr view`. Why unclear → ask.

Body: repo PR template when one exists (`.github/PULL_REQUEST_TEMPLATE.md` or variants); else cover Summary (why + what), Changes, Testing (commands/results, not-run reasons), Review Notes (risky files, reviewer focus). Title prefixes: SKILL.md defaults; repo convention wins. Breaking change → `[BREAKING]`, `**BREAKING CHANGE:**`, migration steps, affected API.

Create only when user asks: `gh pr create --title "..." --body "..."` (`--draft` ok).

## Reviewability pass

For tidy-PR / reduce-noise asks:

1. Inspect commits, diff size, paths, generated files, PR body.
2. Flag noise: stale body, unrelated changes, mixed mechanical+logic, missing tests, unclear entry points.
3. Prefer safe edits (body, review notes, grouping, test/risk notes) over history rewrite.
4. Rewrite/rebase/squash/force-push needs plan + user approval. Snapshot `git rev-parse origin/<head>^{tree}` before; verify final diff still matches intended code after. Don't push if tree changed unintentionally.
5. Too large → recommend split; don't polish wrong PR shape.

## Fetch comments

```bash
pr-comments [<pr>] [--repo <owner/repo>] [--json] [--all]
```

Default: unresolved review threads + open conversation comments + review bodies, full text. `--json` for triage, `--all` when resolved/outdated context matters.

Fallbacks: `gh pr view <pr> --comments`; `gh api repos/{o}/{r}/pulls/{pr}/comments` / `issues/{pr}/comments` / `pulls/{pr}/reviews`; `python3 <skill-dir>/scripts/fetch_comments.py` (`<skill-dir>` = this skill's install directory, not repo-relative). Auth fails → user runs `gh auth login`.

## Handle feedback

1. Fetch unresolved/open first; read all relevant comments before editing.
2. Validate each against current code; skip stale/invalid with evidence.
3. Triage and act:

| Label | Action |
| --- | --- |
| Blocking | Fix first |
| Suggestion | Consider; ask if scope unclear |
| Question | Answer with evidence |
| Nit | Optional unless user wants polish |
| Praise | No action |
| Stale/invalid | Reply with current-code evidence |
| Architecture smell | Investigate; real → stop, tell user, propose boundary/owner/contract path; not real → continue |

4. Ambiguous scope → ask which numbered items to address.
5. Reply per thread with exact fix/file/commit, reason for no change, or clarifying question. Resolve only safe conversations after reply/fix; reviewer resolves significant threads unless repo expects agent resolution.
6. Re-fetch, repeat until nothing actionable or a blocker needs user decision. Recurring nits → step back, look for architecture smell/deeper cause; delegate investigation to sub-agents when harness allows.
7. Push only when user asks. Long loop done → notify via `speak` skill when available; else normal summary.

Conflicting reviewers: summarize both, tag reviewers, propose middle path only if clear.

## Second opinions

Optional — when stuck on architecture smells or deeper causes, not routine fixes:

- `claude -p`, `copilot -p`, `codex exec` — parallel independent takes.
- `oracle` CLI — Pro-tier second opinion.

## Re-request review

Only after blocking/significant feedback done: `gh pr edit <pr> --add-reviewer <username>`.
