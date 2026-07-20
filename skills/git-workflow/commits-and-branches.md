# Commits and Branches

Goal: reviewable changes. No surprise pushes, branch moves, hidden staging.

## Before any git write

`git status --short`, `git diff`, `git branch --show-current`. Unexpected delete/rename → stop, ask.

## Commits

- Check repo style first: `git log --oneline -20`. Repo convention wins; else Conventional Commits (types + voice in AGENTS.md).
- Imperative subject, no period, body = what/why. Breaking → `!` or `BREAKING CHANGE:` footer.
- Stage explicit paths only; prefer `committer "<type>(scope): msg" <paths…>`. Never `git add .` / `-A`. `git add -p` ok for partial.
- Before commit: `git diff --staged`; run relevant tests/checks or state not run.
- Failed hook → fix root cause, stage explicit paths, new commit (not amend).

## Amend policy

Amend only when ALL true: user asked; last commit unpushed; you authored it (`git log -1 --format='%an'`); change belongs to that commit (completion/typo). Never amend pushed, foreign, or merge commits.

## Branches

- Changes need consent: create, switch, rebase, merge, delete.
- Naming: match repo pattern (`git branch -a`); else `<type>/<issue>-<short-desc>`, lowercase, hyphens.
- Update from main: rebase solo branches, merge shared ones. Never rebase shared/pushed branch without explicit history-rewrite consent.
- Push only when asked.

## Cleanup

List candidates first (`git branch --merged main` / `--no-merged main`), ask, delete exact names only. Force-delete (`-D`) and remote delete need explicit ask. `git fetch --prune` ok when useful. No bulk deletion.
