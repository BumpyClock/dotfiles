# Worktree Management

Create isolated workspaces for parallel branch work without switching the main checkout.

## Start

Announce: `Using git-workflow worktree-management to set up an isolated workspace.`

Use this flow when starting feature work that should not disturb the current checkout.

## Directory Selection

Choose the worktree base in this order:

1. Existing `.worktrees/`
2. Existing `worktrees/`
3. Preference in local instructions such as `AGENTS.md` or `CLAUDE.md`
4. Ask the user

If both `.worktrees/` and `worktrees/` exist, prefer `.worktrees/`.

If neither directory exists and local instructions do not specify a location, ask:

```text
No worktree directory found. Where should I create worktrees?

1. .worktrees/ (project-local, hidden)
2. ~/Projects/.worktrees/<project-name>/ (global location)
```

## Safety Checks

For project-local directories, verify the directory is ignored before creating the worktree:

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

If the chosen project-local directory is not ignored:

1. Add it to `.gitignore`
2. Commit that change
3. Continue with worktree creation

Do not create a project-local worktree before this check passes.

Global directories under `~/Projects/.worktrees/<project-name>/` do not need a repo `.gitignore` check.

## Creation

Detect the repo name:

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

Build the target path:

```bash
case "$LOCATION" in
  .worktrees|worktrees)
    path="$LOCATION/$BRANCH_NAME"
    ;;
  ~/Projects/.worktrees/*)
    path="$HOME/Projects/.worktrees/$project/$BRANCH_NAME"
    ;;
esac
```

Create the worktree and branch:

```bash
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

## Project Setup

Run the repo's normal setup for the detected stack:

```bash
if [ -f package.json ]; then npm install; fi
if [ -f Cargo.toml ]; then cargo build; fi
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi
if [ -f go.mod ]; then go mod download; fi
```

Prefer the repo's documented package manager or setup command when local docs specify one.

## Baseline Verification

Run the project's normal test or verification command before implementation.

If baseline checks fail:

1. Report the failure
2. Do not blur pre-existing failures with new work
3. Ask whether to proceed anyway

## Report Back

Use this format:

```text
Worktree ready at <full-path>
Baseline checks: passing
Ready to implement <feature-name>
```

If checks fail, replace the baseline line with the failing command and short failure summary.

## Quick Reference

| Situation | Action |
|-----------|--------|
| `.worktrees/` exists | Use it after ignore verification |
| `worktrees/` exists | Use it after ignore verification |
| Both exist | Use `.worktrees/` |
| Neither exists | Check `AGENTS.md` / `CLAUDE.md`, then ask |
| Project-local dir not ignored | Add to `.gitignore`, commit, continue |
| Baseline checks fail | Report and ask before proceeding |

## Never

- Create a project-local worktree without ignore verification
- Assume a location when local instructions already define one
- Continue from a failing baseline without telling the user
- Hardcode setup commands when repo docs say otherwise
