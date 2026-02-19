# Commit Workflow

Conventional Commits format with safe commit practices.

---

## Conventional Commits Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Use For |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no code change) |
| `refactor` | Code change that neither fixes nor adds |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependencies |
| `ci` | CI configuration |
| `chore` | Maintenance tasks |

### Scope (Optional)

Indicate the area affected:
```
feat(auth): add OAuth2 support
fix(api): handle null response
docs(readme): update installation steps
```

### Breaking Changes

Two ways to indicate:

1. **Bang notation:**
   ```
   feat!: remove deprecated API endpoints
   ```

2. **Footer:**
   ```
   feat: new authentication flow

   BREAKING CHANGE: requires migration of user sessions
   ```

---

## Commit Message Structure

### Subject Line (Required)
- Max 50 characters
- Imperative mood ("add" not "added")
- No period at end
- Lowercase after type prefix

```
feat(auth): add password reset flow
fix: prevent null pointer in user service
```

### Body (Optional)
- Separate from subject with blank line
- Wrap at 72 characters
- Explain what and why, not how

```
feat(notifications): add email digest option

Users requested a way to receive daily summaries instead of
individual notifications. This adds a new preference toggle
and a scheduled job to compile and send digests.
```

### Footer (Optional)
- References: `Refs: #123, #456`
- Closes: `Closes #789`
- Breaking: `BREAKING CHANGE: description`
- Co-authors: `Co-authored-by: Name <email>`

```
fix(api): handle rate limiting gracefully

Add exponential backoff when API returns 429.
Prevents cascading failures during high load.

Closes #234
Co-authored-by: Jane Doe <jane@example.com>
```

---

## Staging Strategies

### Stage all changes
```bash
git add .
git add -A
```

### Stage specific files
```bash
git add path/to/file.ts
git add src/components/
```

### Interactive/Partial staging
```bash
# Stage hunks interactively
git add -p

# Commands in patch mode:
# y - stage this hunk
# n - skip this hunk
# s - split into smaller hunks
# e - edit the hunk manually
# q - quit
```

### Unstage
```bash
git restore --staged file.ts
git reset HEAD file.ts  # older syntax
```

---

## When to Commit vs. Amend

### Create NEW commit when:
- Adding distinct, logical changes
- After pushing to remote
- When previous commit is complete

### Amend ONLY when ALL conditions met:
1. Commit hasn't been pushed
2. You created the commit (check: `git log -1 --format='%an'`)
3. Adding to incomplete work or fixing typos

```bash
# Amend last commit (not pushed)
git add .
git commit --amend -m "feat: improved message"

# Amend without changing message
git commit --amend --no-edit
```

### NEVER amend when:
- Commit has been pushed
- You didn't create the commit
- It's a merge commit
- Pre-commit hook rejected the commit (fix and make NEW commit)

---

## Commit Frequency

### Good practices:
- Commit logical units of work
- Each commit should compile/pass tests
- Commit before switching context
- Commit before risky changes

### Signs you need to commit:
- You'd describe changes with "and" (split into multiple commits)
- You want to try something experimental
- You're about to leave for the day

### Signs you're committing too often:
- Commits say "WIP" or "fix typo"
- Multiple commits for single logical change
- (Consider squashing before PR)

---

## Pre-commit Checks

### Manual verification
```bash
# Check what will be committed
git diff --staged

# Run tests on staged changes
git stash --keep-index
npm test
git stash pop
```

### If pre-commit hook fails:
1. Fix the issues
2. Stage the fixes: `git add .`
3. Create NEW commit (don't amend if previous was rejected)

---

## Quick Reference

```bash
# Standard commit
git commit -m "feat(scope): description"

# Commit with body (heredoc)
git commit -m "$(cat <<'EOF'
feat(auth): add password reset

Implements forgot password flow with email verification.
Token expires after 24 hours.

Closes #123
EOF
)"

# Stage and commit tracked files
git commit -am "fix: quick fix for tracked files"

# Interactive staging
git add -p

# Amend (unpushed only!)
git commit --amend

# View last commit
git log -1

# Undo last commit (keep changes)
git reset --soft HEAD~1
```
