# Worktrees

Goal: isolated branch workspace without disturbing current checkout. Use for parallel branch work, risky experiments, isolated verification, avoiding manual stash. Consent before creating branch/worktree; tell user when setting one up.

## Location

Order: existing `.worktrees/` → existing `worktrees/` → local instructions (`AGENTS.md`, `CLAUDE.md`, repo docs) → ask user (offer `.worktrees/` project-local vs `~/Projects/.worktrees/<project>/` global). Both local dirs exist → `.worktrees/`.

Project-local dir MUST pass ignore check before create: `git check-ignore -q -- "$LOCATION"` on the exact dir. Not ignored → report, ask before any `.gitignore` edit/commit, prefer global dir if no consent. Global dir needs no check.

Paths: `.worktrees/$BRANCH_NAME` | `worktrees/$BRANCH_NAME` | `$HOME/Projects/.worktrees/$project/$BRANCH_NAME` (`project=$(basename "$(git rev-parse --show-toplevel)")`).

## Create + verify

```bash
git worktree add "$path" -b "$BRANCH_NAME"   # existing branch: omit -b
cd "$path"
```

Setup per repo docs first; only fall back to ecosystem-default install commands. Run normal project baseline check before implementing. Baseline fails → report command + exact failure, keep separate from new work, ask proceed/stop.

Report: path, baseline result, next step.

## Cleanup

Only when asked: `git worktree list`, `git worktree remove <path>`. Branch delete → `commits-and-branches.md` rules.

## Never

- Project-local worktree without ignore verification.
- Assume location when local instructions define one.
- Edit/commit `.gitignore` without asking.
- Continue from failing baseline without telling user.
- Hardcode setup commands over repo docs.
- Delete worktree/branch without explicit ask.
