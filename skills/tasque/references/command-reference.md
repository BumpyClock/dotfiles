# Command Reference

Read when: you need exact command syntax or available options.

## Core workflow

- `tsq` (no args, TTY): open read-only TUI
- `tsq init [--wizard|--no-wizard] [--yes] [--preset <name>] [--sync-branch|--worktree-name <name>]`
- `tsq init --install-skill|--uninstall-skill [--skill-targets ...] [--skill-name <name>] [--force-skill-overwrite]`

In git repos, `tsq init` defaults to sync-worktree mode using `tsq-sync`.
Use `--sync-branch <name>` or `--worktree-name <name>` to choose another branch/worktree. Existing main-tree
`.tasque` data migrates automatically. Fresh clones fetch the configured sync branch
and create the worktree on first use. `tsq sync` pushes the sync branch to `origin`
and sets upstream automatically when needed. Non-git directories use local `.tasque/` storage.

- `tsq create <title...> [--kind ...] [-p ...] [--parent <id>] [--from-file tasks.md] [--description <text>] [--external-ref <ref>] [--discovered-from <id>] [--planned|--needs-plan] [--ensure] [--id <tsq-xxxxxxxx>] [--body-file <path|->]`

`tasks.md` supports nested two-space bullets:

```md
- Parent task
  - Child task
    - Grandchild task
- [ ] Another parent task
```

- `tsq show <id> [--with-spec]`
- `tsq find ready [--lane <planning|coding>] [--assignee <name>] [--unassigned] [--kind ...] [--label ...] [--planning <needs_planning|planned>] [--tree [--full]]`
- `tsq find <blocked|open|in-progress|deferred|done|canceled> [filters...] [--tree [--full]]`
- `tsq find search <query> [--full]`

Note: for `find ready` and status-based `find` commands, `--full` is only valid with `--tree`. `--tree --full` keeps the full status set instead of applying the default tree status narrowing. `find search --full` remains valid without `--tree`.
- `tsq edit <id> [--title ...] [--description ...] [--clear-description] [--priority ...] [--external-ref <ref>] [--clear-external-ref] [--discovered-from <id>] [--clear-discovered-from]`
- `tsq claim <id> [--assignee <a>] [--start] [--require-spec]`
- `tsq assign <id> --assignee <a>`
- `tsq start <id>`
- `tsq planned <id>`
- `tsq needs-plan <id>`
- `tsq open <id>`
- `tsq blocked <id>`
- `tsq defer <id> [--note <text>]`
- `tsq done <id...> [--note <text>]`
- `tsq reopen <id...> [--note <text>]`
- `tsq cancel <id...> [--note <text>]`

## Dependencies and relations

- `tsq block <task> by <blocker>`
- `tsq unblock <task> by <blocker>`
- `tsq order <later> after <earlier>`
- `tsq unorder <later> after <earlier>`
- `tsq deps <id> [--direction <up|down|both>] [--depth <n>]`
- `tsq relate <src> <dst>`
- `tsq unrelate <src> <dst>`
- `tsq duplicate <id> of <canonical-id> [--note <text>]`
- `tsq duplicates [--limit <n>]`
- `tsq merge <source-id...> --into <target-id> [--reason <text>] [--force] [--dry-run]`
- `tsq supersede <old-id> with <new-id> [--note <text>]`

## Specs, notes, labels, history

- `tsq spec <id> [--file <path> | --stdin | --text <markdown> | --show | --check] [--force]`
- `tsq note <id> <text>`
- `tsq note <id> --stdin`
- `tsq notes <id>`
- `tsq label <id> <label>`
- `tsq unlabel <id> <label>`
- `tsq labels`
- `tsq history <id> [--limit <n>] [--type <event-type>] [--actor <name>] [--since <iso>]`

## Reporting and maintenance

- `tsq watch [--once] [--interval <seconds>] [--status <csv>] [--assignee <name>] [--tree]`
- `tsq tui [--once] [--interval <seconds>] [--status <csv>] [--assignee <name>] [--board|--epics]`
- `tsq stale [--days <n>] [--status <status>] [--assignee <name>] [--limit <n>]`
- `tsq orphans`
- `tsq doctor`
- `tsq repair [--fix] [--force-unlock]`
- `tsq sync [--no-push]`
- `tsq hooks install [--force]`
- `tsq hooks uninstall`
- `tsq migrate [--sync-branch|--worktree-name <name>]`
- `tsq merge-driver <ancestor> <ours> <theirs>`

## Global options and status alias

- Use `--format json` when scripting/parsing.
- `--json` remains shorthand for `--format json`.
- Add `--exact-id` to disable fuzzy id matching.
- Status alias: `done` maps to `closed`.
