# Merge Workflow

Merge strategies, conflict resolution, and post-merge cleanup.

---

## Merge Strategy Decision Tree

### Merge Commit (default)
```bash
git merge feature-branch
# or
gh pr merge --merge
```
**Use when:**
- Feature branch has meaningful commit history
- You want to preserve the full development story
- Multiple contributors on the branch
- Default for most features

**Result:** Creates merge commit, preserves all branch commits

### Squash Merge
```bash
gh pr merge --squash
```
**Use when:**
- Branch has messy/WIP commits
- You want one clean commit in main
- Small feature or bug fix
- Commit history isn't valuable

**Result:** Single commit containing all changes

### Rebase Merge
```bash
gh pr merge --rebase
```
**Use when:**
- Linear history is preferred
- Small changes with clean commits
- Team convention requires it

**NEVER use when:**
- Branch has been shared/pushed
- Multiple people worked on branch
- You'd lose important merge context

**Result:** Replays commits on top of main

---

## Pre-Merge Checklist

Before merging any PR:

- [ ] CI passing (all checks green)
- [ ] Required reviews approved
- [ ] No unresolved conversations
- [ ] Branch is up to date with base
- [ ] No merge conflicts
- [ ] Tested locally if significant changes

### Check CI status
```bash
gh pr checks {pr_number}
```

### Check review status
```bash
gh pr view {pr_number}
```

---

## Conflict Resolution

### Step 1: Fetch latest
```bash
git fetch origin main
```

### Step 2: Start merge or rebase
```bash
# Merge approach
git checkout feature/my-branch
git merge origin/main

# Rebase approach (cleaner history)
git checkout feature/my-branch
git rebase origin/main
```

### Step 3: Identify conflicts
```bash
# See conflicted files
git status

# Shows: "both modified: path/to/file.ts"
```

### Step 4: Resolve conflicts

Open conflicted files and look for markers:
```
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> origin/main
```

Resolution options:
1. Keep yours
2. Keep theirs
3. Combine both
4. Write something new

### Step 5: Mark resolved
```bash
# After editing
git add path/to/resolved-file.ts
```

### Step 6: Complete the merge/rebase
```bash
# For merge
git merge --continue
# or just commit
git commit

# For rebase
git rebase --continue
```

### Step 7: Test
```bash
# Always test after resolving conflicts!
npm test
npm run build
```

### Abort if things go wrong
```bash
git merge --abort
# or
git rebase --abort
```

---

## Common Conflict Scenarios

### Lock file conflicts (package-lock.json, yarn.lock)
```bash
# Accept theirs, then regenerate
git checkout --theirs package-lock.json
npm install
git add package-lock.json
```

### Auto-generated files
```bash
# Regenerate rather than manually resolve
npm run generate
git add generated/
```

### Binary files
```bash
# Choose one version
git checkout --ours image.png   # keep yours
git checkout --theirs image.png # keep theirs
git add image.png
```

---

## Merge via GitHub CLI

### Standard merge
```bash
gh pr merge {pr_number} --merge
```

### Squash merge
```bash
gh pr merge {pr_number} --squash
```

### Rebase merge
```bash
gh pr merge {pr_number} --rebase
```

### With options
```bash
# Merge and delete branch
gh pr merge {pr_number} --merge --delete-branch

# Auto-merge when checks pass
gh pr merge {pr_number} --auto --merge
```

---

## Post-Merge Cleanup

### Delete remote branch (automatic with --delete-branch)
```bash
gh pr merge --delete-branch
# or manually
git push origin --delete feature/123-done
```

### Delete local branch
```bash
git checkout main
git pull origin main
git branch -d feature/123-done
```

### Prune stale references
```bash
git fetch --prune
```

### Full cleanup sequence
```bash
# After PR merged
git checkout main
git pull origin main
git branch -d feature/123-done
git fetch --prune
```

---

## CI Failures Before Merge

If CI fails, use the `gh-fix-ci` skill:

```bash
# Check what failed
gh pr checks {pr_number}

# Get failure logs
gh run view {run_id} --log-failed
```

See: `.ai_agents/skills/gh-fix-ci/SKILL.md`

---

## Merge Queue (if enabled)

Some repos use merge queues for coordinated merging:

```bash
# Add PR to merge queue
gh pr merge {pr_number} --merge --auto

# Check queue status
gh pr view {pr_number}
```

---

## Quick Reference

```bash
# Merge PR (preserves commits)
gh pr merge --merge --delete-branch

# Squash PR (single commit)
gh pr merge --squash --delete-branch

# Rebase PR (linear history)
gh pr merge --rebase --delete-branch

# Resolve conflicts locally
git fetch origin main
git merge origin/main
# ... resolve ...
git add .
git commit
git push

# Abort merge
git merge --abort

# Cleanup after merge
git checkout main && git pull && git branch -d feature/xxx && git fetch --prune
```
