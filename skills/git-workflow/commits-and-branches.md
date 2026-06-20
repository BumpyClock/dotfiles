# Commits and Branches

Goal: reviewable git changes. No surprise pushes, branch moves, hidden staging.

## Before any git write

```bash
git status --short
git diff
git branch --show-current
```

Unexpected delete/rename → stop, ask.

## Commit format

```text
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

Rules: imperative subject, no period, short when natural, body = what/why. Breaking change → `!` or `BREAKING CHANGE:`.

Examples:

```text
feat(auth): add password reset
fix(api): handle null response
feat!: remove deprecated API endpoints

BREAKING CHANGE: clients must use /v2/session.
```

## Staging

Use explicit paths only. Prefer `committer`.

```bash
git add path/to/file.ts
git add src/components/Button.tsx
git diff --staged
```

```bash
committer "fix(api): handle null response" path/to/file.ts
```

Never:

```bash
git add .
git add -A
```

Partial staging ok:

```bash
git add -p
# y stage, n skip, s split, e edit, q quit
```

Unstage:

```bash
git restore --staged path/to/file.ts
```

## Amend policy

Amend only when all true:

- User asked for amend.
- Last commit unpushed.
- You created last commit: `git log -1 --format='%an'`.
- Change belongs to incomplete last commit or typo fix.

```bash
git commit --amend --no-edit
git commit --amend -m "fix(scope): better message"
```

Never amend when:

- User did not ask.
- Commit was pushed.
- Commit belongs to someone else.
- Commit is merge commit.
- Pre-commit hook rejected earlier commit. Fix, then make new commit.

## Branch naming

Format:

```text
<type>/<issue>-<short-description>
```

Types: `feature/`, `fix/`, `hotfix/`, `docs/`, `refactor/`, `test/`, `chore/`.

Rules: lowercase, hyphens, short/clear, issue number when useful, no special chars.

Examples:

```text
feature/123-user-auth
fix/456-login-redirect-loop
hotfix/789-security-patch
```

## Create/switch/push branch

Branch changes need consent.

```bash
git switch main
git pull origin main
git switch -c feature/123-new-feature
```

From another branch:

```bash
git switch -c fix/456-derived-fix other-branch
```

Push only when asked:

```bash
git push -u origin feature/123-new-feature
```

## Check branch state

```bash
git branch --show-current
git branch -vv
git branch -a
git log main..HEAD --oneline
git log HEAD..origin/main --oneline
```

## Update branch from main

Need branch-change consent.

Rebase for solo, clean history:

```bash
git fetch origin
git rebase origin/main
```

Merge for shared branches/context preservation:

```bash
git fetch origin
git merge origin/main
```

Do not rebase shared/pushed branch unless user explicitly accepts history rewrite risk.

## Cleanup

List first. Ask before deleting.

```bash
git branch --merged main
git branch --no-merged main
git for-each-ref --sort=committerdate refs/heads/ \
  --format='%(committerdate:short) %(refname:short)'
```

Delete local only when explicitly asked:

```bash
git branch -d feature/123-done
# force-delete unmerged only with explicit ask
git branch -D feature/456-abandoned
```

Delete remote only when explicitly asked:

```bash
git push origin --delete feature/123-done
```

Prune stale refs ok when useful:

```bash
git fetch --prune
```

Avoid bulk deletion. Show candidates, ask, delete exact names.

## Commit checklist

Before commit:

- `git status --short`
- `git diff --staged`
- Tests/checks relevant to change, or state not run.
- Commit only explicit paths.

After failed hook:

- Fix issue.
- Stage explicit paths.
- Create new commit unless user asked amend and amend policy passes.
