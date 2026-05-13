# Worktree Management

Purpose: isolated workspace for branch work without disturbing current checkout.

Announce when used:

```text
Using git-workflow worktree-management to set up an isolated workspace.
```

## When to use

Use worktree for:

- parallel branch work
- risky experiments
- isolated verification
- avoiding manual `git stash`

Need user consent before creating branch/worktree.

## Pick location

Order:

1. Existing `.worktrees/`
2. Existing `worktrees/`
3. Local instructions: `AGENTS.md`, `CLAUDE.md`, repo docs
4. Ask user

If both local dirs exist, prefer `.worktrees/`.

If none found, ask:

```text
No worktree directory found. Where should I create worktrees?

1. .worktrees/ (project-local, hidden)
2. ~/Projects/.worktrees/<project-name>/ (global)
```

## Safety check for project-local dirs

Before creating project-local worktree, verify chosen dir is ignored:

```bash
# LOCATION is exact chosen project-local dir: .worktrees or worktrees
git check-ignore -q -- "$LOCATION"
```

Do not check a different dir than the one you will use.

If not ignored:

- Report it.
- Ask before editing `.gitignore`.
- Ask before committing `.gitignore`.
- Prefer global dir if no consent.

Global `~/Projects/.worktrees/<project-name>/` needs no repo ignore check.

Never create project-local worktree before ignore check passes.

## Target path

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
# BRANCH_NAME is actual branch name, e.g. feature/123-my-feature
```

Project-local:

```bash
path=".worktrees/$BRANCH_NAME"
# or
path="worktrees/$BRANCH_NAME"
```

Global:

```bash
path="$HOME/Projects/.worktrees/$project/$BRANCH_NAME"
```

## Create

After user consent:

```bash
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

Existing branch:

```bash
git worktree add "$path" "$BRANCH_NAME"
cd "$path"
```

## Setup

Use repo docs first. Do not hardcode over documented setup.

Fallback examples:

```bash
if [ -f package.json ]; then npm install; fi
if [ -f Cargo.toml ]; then cargo build; fi
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi
if [ -f go.mod ]; then go mod download; fi
```

## Baseline verify

Run normal project check before implementation.

If baseline fails:

- Report command + short failure.
- Do not mix pre-existing failure with new work.
- Ask whether to proceed.

## Report

Success:

```text
Worktree ready at <full-path>
Baseline checks: passing
Ready to implement <feature-name>
```

Failure:

```text
Worktree ready at <full-path>
Baseline checks: failing
Command: <cmd>
Failure: <short exact summary>
Need proceed/stop decision.
```

## Cleanup

Only when user asks:

```bash
git worktree list
git worktree remove <path>
```

If branch delete also requested, follow `commits-and-branches.md` cleanup rules.

## Never

- Create project-local worktree without ignore verification.
- Assume location when local instructions define one.
- Edit `.gitignore` without asking.
- Commit `.gitignore` without asking.
- Continue from failing baseline without telling user.
- Hardcode setup commands over repo docs.
- Delete worktree/branch without explicit ask.
