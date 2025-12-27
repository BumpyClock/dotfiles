---
name: git-workflow
description: Preferred way to use git - PRs, commits, branches, merges, PR comments, and CI checks. Use for any git/GitHub task. any time the user asks for any action that requires interacting with git/GitHub like commit, push, comments, create PR, or fix CI.
---

spin up a dedicated sub-agent to perform git-workflow tasks requested by the user. 

# Git Workflow Skill

Modular git workflow management using Conventional Commits and GitHub Flow.

## Available Workflows

| Task | File | When to Use |
|------|------|-------------|
| Create PR | `create-pr.md` | Creating a new pull request with proper description |
| Review Comments | `review-comments.md` | Fetching, triaging, and addressing PR feedback |
| Commits | `commit-workflow.md` | Writing conventional commits, staging, amending |
| Branches | `branch-management.md` | Creating, naming, and cleaning up branches |
| Merging | `merge-workflow.md` | Merge strategies, conflict resolution, cleanup |
| Changelog | `add-changelog.md` | Setting up or updating a project changelog |
| Address PR Comments | `gh-address-comments.md` | Handle PR review/issue comments with gh CLI |
| Fix CI | `gh-fix-ci.md` | Inspect failing PR checks and plan fixes |

## Usage

Based on the user's task, read the relevant sub-file for detailed instructions:

```
.ai_agents/skills/git-workflow/
├── create-pr.md          # PR creation workflow
├── review-comments.md    # Handling PR feedback
├── commit-workflow.md    # Conventional commits
├── branch-management.md  # GitHub Flow branching
├── merge-workflow.md     # Merge strategies
├── add-changelog.md      # Changelog setup and updates
├── gh-address-comments.md # Address PR review/issue comments
├── gh-fix-ci.md          # Fix failing PR checks
└── scripts/              # gh helpers
    ├── fetch_comments.py
    └── inspect_pr_checks.py
```

## Quick Reference

**Conventional Commit Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**Branch Prefixes:** `feature/`, `fix/`, `hotfix/`

**PR Type Prefixes:** `[Feature]`, `[Fix]`, `[Refactor]`, `[Perf]`, `[Docs]`, `[Test]`, `[Build]`, `[BREAKING]`

## Related Skills

- `git-work-trees` - Isolated worktree setup for parallel work
- `coderabbit-review` - Automated code review with CodeRabbit
