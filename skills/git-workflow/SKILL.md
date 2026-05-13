---
name: git-workflow
description: Preferred way to use git - PRs, commits, branches, worktrees, merges, PR comments, and CI checks. Use for any git/GitHub task, including isolated worktree setup for feature work, or any time the user asks for an action that requires interacting with git/GitHub like commit, push, comments, create PR, or fix CI.
context: fork
model: claude-sonnet-4-6
---

# Git Workflow

Use this skill for git/GitHub actions. Safety first. Small explicit ops. No surprise state changes.

## Global rules

- Inspect first: `git status --short`, then relevant `git diff` / `git log`.
- Use `gh` for GitHub. Prefer API/JSON for PR comments/checks.
- Use `committer` for commits. It stages explicit paths and rejects `.`.
- Never use `git add .` or `git add -A`.
- Push only when user asks.
- Branch changes need consent: create, switch, rebase, merge, delete.
- Destructive ops forbidden unless explicit: `reset --hard`, `clean`, force-delete, force-push, overwrite.
- No manual `git stash`. Auto-stash from pull/rebase ok when command owns it.
- Ask before resolving binary conflicts or choosing one side blindly.
- If auth fails, ask user to run `gh auth login`; do not invent tokens.

## Read needed guide

| Task                                             | Read                      |
| ------------------------------------------------ | ------------------------- |
| Commit, amend, branch, rebase, cleanup           | `commits-and-branches.md` |
| Create PR, write PR body, handle review comments | `pr-and-comments.md`      |
| Merge PR, resolve conflicts, fix CI              | `merge-and-ci.md`         |
| Parallel/isolated branch work                    | `worktree-management.md`  |
| Changelog setup/update                           | `add-changelog.md`        |

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

# Checks
gh pr checks <pr>
python3 skills/git-workflow/scripts/inspect_pr_checks.py --repo . --pr <pr>

# Comments
python3 skills/git-workflow/scripts/fetch_comments.py
```

## Commit types

Use Conventional Commits: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

## PR title prefixes

Use when repo has no stricter convention: `[Feature]`, `[Fix]`, `[Refactor]`, `[Perf]`, `[Docs]`, `[Test]`, `[Build]`, `[BREAKING]`.
