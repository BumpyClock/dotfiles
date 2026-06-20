---
name: git-workflow
description: "Git/GitHub: PRs, commits, branches, worktrees, conflicts, comments, CI."
context: fork
model: claude-sonnet-4-6
---

# Git Workflow

Git/GitHub ops. Safety first. Small explicit commands. No surprise state moves.

## Global rules

- Inspect first: `git status --short`, then relevant `git diff` / `git log`.
- Use `gh` for GitHub. Prefer API/JSON for PR comments/checks.
- Use `committer` for commits. Stages explicit paths, rejects `.`
- Never `git add .` or `git add -A`.
- Push only when user asks.
- Branch changes need consent: create, switch, rebase, merge, delete.
- Destructive ops forbidden unless explicit: `reset --hard`, `clean`, force-delete, force-push, overwrite.
- No manual `git stash`. Auto-stash from pull/rebase ok when command owns it.
- Ask before resolving binary conflicts or choosing one side blindly.
- Auth fails → ask user to run `gh auth login`; don't invent tokens.

## Read needed guide

| Task | Read |
| --- | --- |
| Commit, amend, branch, rebase, cleanup | `commits-and-branches.md` |
| Create PR, write PR body, improve reviewability, handle review comments | `pr-and-comments.md` |
| Merge PR, resolve conflicts, fix CI | `merge-and-ci.md` |
| Parallel/isolated branch work | `worktree-management.md` |
| Changelog setup/update | `add-changelog.md` |

## Quick commands

```bash
# Status
git status --short
git diff
git diff --staged

# Commit explicit paths
committer "fix(scope): concise change" path/to/file.ts

# PR data
gh pr view --json number,title,url,headRefName,baseRefName

# Comments
pr-comments
pr-comments <pr> --repo <owner/repo> --json
pr-comments <pr> --all

# Checks
gh pr checks <pr>
python3 skills/git-workflow/scripts/inspect_pr_checks.py --repo . --pr <pr>
```

## Commit types

Conventional Commits: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

## PR title prefixes

When repo has no stricter convention: `[Feature]`, `[Fix]`, `[Refactor]`, `[Perf]`, `[Docs]`, `[Test]`, `[Build]`, `[BREAKING]`.
