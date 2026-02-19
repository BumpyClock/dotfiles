# Branch Management

GitHub Flow branching strategy with clean naming conventions.

---

## GitHub Flow Principles

1. `main` is always deployable
2. Create feature branches from `main`
3. Push commits to feature branch
4. Open PR for discussion and review
5. Merge to `main` after approval
6. Deploy immediately after merge

---

## Branch Naming Conventions

### Format
```
<type>/<issue>-<short-description>
```

### Types

| Prefix | Use For |
|--------|---------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `hotfix/` | Urgent production fixes |
| `docs/` | Documentation updates |
| `refactor/` | Code refactoring |
| `test/` | Test additions/fixes |
| `chore/` | Maintenance tasks |

### Examples
```
feature/123-user-authentication
fix/456-login-redirect-loop
hotfix/789-security-patch
docs/101-api-documentation
refactor/202-cleanup-legacy-code
```

### Naming Rules
- Lowercase only
- Hyphens for spaces (no underscores)
- Keep short but descriptive
- Include issue number when applicable
- No special characters

---

## Creating Branches

### From main
```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create and switch to new branch
git checkout -b feature/123-new-feature

# Or using switch (newer syntax)
git switch -c feature/123-new-feature
```

### From another branch
```bash
git checkout -b fix/456-derived-fix other-branch
```

### Push new branch to remote
```bash
git push -u origin feature/123-new-feature
```

---

## Working with Worktrees

For parallel work on multiple branches, use the `git-work-trees` skill:

```bash
# Create worktree for parallel work
git worktree add ../project-feature feature/123-new-feature

# List worktrees
git worktree list

# Remove when done
git worktree remove ../project-feature
```

See: `skills/git-work-trees/SKILL.md`

---

## Branch Cleanup

### Check merged branches
```bash
# Branches merged into main
git branch --merged main

# Branches NOT merged
git branch --no-merged main
```

### Delete local branches
```bash
# Delete merged branch
git branch -d feature/123-done

# Force delete unmerged branch
git branch -D feature/456-abandoned
```

### Delete remote branches
```bash
# Delete remote branch
git push origin --delete feature/123-done

# Or shorthand
git push origin :feature/123-done
```

### Prune stale remote references
```bash
# Remove references to deleted remote branches
git remote prune origin

# Or fetch with prune
git fetch --prune
```

### Bulk cleanup script
```bash
# Delete all local branches merged into main
git branch --merged main | grep -v "main" | xargs -n 1 git branch -d

# Prune and list stale branches
git fetch --prune
git branch -vv | grep ': gone]'
```

---

## Checking Branch Status

### Current branch
```bash
git branch --show-current
```

### All branches
```bash
# Local branches
git branch

# Remote branches
git branch -r

# All branches
git branch -a

# With last commit info
git branch -v

# With tracking info
git branch -vv
```

### Branch relationship
```bash
# Commits on feature not in main
git log main..feature/123-xyz

# Commits on main not in feature
git log feature/123-xyz..main
```

---

## Keeping Branches Updated

### Rebase onto main (for clean history)
```bash
git checkout feature/123-my-feature
git fetch origin
git rebase origin/main
```

### Merge main into feature (preserves history)
```bash
git checkout feature/123-my-feature
git fetch origin
git merge origin/main
```

### When to rebase vs merge
- **Rebase**: clean history, solo work, before PR
- **Merge**: shared branches, preserve context

---

## Stale Branch Detection

### Find old branches
```bash
# Branches with no recent commits (local)
git for-each-ref --sort=committerdate refs/heads/ \
  --format='%(committerdate:short) %(refname:short)'

# Filter by age (branches older than 30 days)
git for-each-ref --sort=committerdate refs/heads/ \
  --format='%(committerdate:short) %(refname:short)' | head -20
```

### Remote stale branches
```bash
# Via GitHub CLI
gh api repos/{owner}/{repo}/branches --jq '.[].name'
```

---

## Quick Reference

```bash
# Create branch
git checkout -b feature/123-name

# Push with tracking
git push -u origin feature/123-name

# Delete local
git branch -d branch-name

# Delete remote
git push origin --delete branch-name

# Prune stale
git fetch --prune

# List merged
git branch --merged main

# Update from main
git rebase origin/main
```
