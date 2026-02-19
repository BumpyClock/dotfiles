# Command Reference

Read when: you need exact command syntax or available options.

## Core workflow

- `tsq init`
- `tsq create "Title" [--kind ...] [-p ...] [--parent <id>] [--external-ref <ref>] [--discovered-from <id>] [--planning <needs_planning|planned>] [--needs-planning] [--id <tsq-xxxxxxxx>] [--body-file <path|->]`
- `tsq show <id>`
- `tsq list [--status ...] [--assignee ...] [--external-ref <ref>] [--discovered-from <id>] [--kind ...] [--planning <needs_planning|planned>] [--dep-type <blocks|starts_after>] [--dep-direction <in|out|any>] [--tree]`
- `tsq update <id> [--title ...] [--status ...] [--priority ...] [--external-ref <ref>] [--clear-external-ref] [--discovered-from <id>] [--clear-discovered-from] [--planning <needs_planning|planned>]`
- `tsq update <id> --claim [--assignee <a>] [--require-spec]`
- `tsq ready [--lane <planning|coding>]`

## Dependencies and relations

- `tsq dep add <child> <blocker> [--type <blocks|starts_after>]`
- `tsq dep remove <child> <blocker> [--type <blocks|starts_after>]`
- `tsq dep tree <id> [--direction <up|down|both>] [--depth <n>]`
- `tsq link add <src> <dst> --type <relates_to|replies_to|duplicates|supersedes>`
- `tsq link remove <src> <dst> --type <relates_to|replies_to|duplicates|supersedes>`
- `tsq duplicate <id> --of <canonical-id> [--reason <text>]`
- `tsq duplicates [--limit <n>]`
- `tsq merge <source-id...> --into <target-id> [--reason <text>] [--force] [--dry-run]`
- `tsq supersede <old-id> --with <new-id> [--reason <text>]`

## Specs, notes, labels, history

- `tsq spec attach <id> [source] [--file <path> | --stdin | --text <markdown>]`
- `tsq spec check <id>`
- `tsq note add <id> <text>`
- `tsq note list <id>`
- `tsq label add <id> <label>`
- `tsq label remove <id> <label>`
- `tsq label list`
- `tsq history <id> [--limit <n>] [--type <event-type>] [--actor <name>] [--since <iso>]`

## Reporting and maintenance

- `tsq watch [--once] [--interval <seconds>] [--status <csv>] [--assignee <name>] [--tree]`
- `tsq stale [--days <n>] [--status <status>] [--assignee <name>] [--limit <n>]`
- `tsq orphans`
- `tsq doctor`

## Global options and status alias

- Add `--json` to any command for stable machine output.
- Add `--exact-id` to disable fuzzy id matching.
- Status alias: `done` maps to `closed`.
