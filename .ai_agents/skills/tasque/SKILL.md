---
name: tasque
description: Operational guide for Tasque (tsq) local task tracking and management.
---

<!-- tsq-managed-skill:v1 -->

# Tasque Skill

Use Tasque for creating and managing tasks, features, and epics. These will persist across sessions and devices. Use tsq cli to create and manage tasks.

Add `--json` to any command for stable automation output

## CORE TASK CREATION RULES
- Include specs when possible
- Use a consistent title format
- Assign a priority level
- Use a consistent label format
- Create Dependencies links
- Plan so that the tasks can be completed in parallel using sub-agents. Think through the dependencies and how they can be completed in parallel.
- Prioritize tasks based on their importance and urgency.
- Break tasks into smaller sub-tasks when possible.
- Create new tasks as needed. When navigating the codebase if you discover a bug or a feature that needs to be implemented, create a new task for it.

- Use the `tsq` command-line interface to create and manage tasks.

Use `tsq` for durable local task tracking.

## Core loop

1. `tsq ready`
2. `tsq show <id>`
3. `tsq update <id> --status in_progress`
4. `tsq update <id> --status closed`

## Create and inspect

- `tsq create "Title" --kind task|feature|epic -p 0..3 [--external-ref <ref>]`
- `tsq show <id>`
- `tsq list [--status S] [--assignee A] [--external-ref R] [--kind K] [--label L] [--tree [--full]]`
- `tsq search "status:open label:bug some title text"`
- `tsq doctor`
- `tsq watch [--once] [--interval N] [--status ...] [--assignee A] [--tree]`

## Close and reopen

- `tsq close <id> [<id2> ...] [--reason <text>]` — close one or more tasks
- `tsq reopen <id> [<id2> ...]` — reopen closed tasks (not canceled)

## History

- `tsq history <id> [--limit N] [--type <event-type>] [--actor <name>] [--since <iso>]`

## Specs

- `tsq spec attach <id> --text "<markdown>"` for short inline specs
- `tsq spec attach <id> --file <path>` to ingest an existing markdown file
- `tsq spec attach <id> --stdin` to ingest piped markdown content
- `tsq spec check <id>` to validate fingerprint + required sections diagnostics
- `tsq update <id> --claim --require-spec` to enforce a passing spec check before claiming
- Never manually write `.tasque/specs/<id>/spec.md`; always use `tsq spec attach` so canonical path + metadata stay consistent

## Labels

- `tsq label add <id> <label>` — add label (lowercase, [a-z0-9:_/-], max 64)
- `tsq label remove <id> <label>`
- `tsq label list` — all labels with counts

## Dependencies and relations

- `tsq dep add <child> <blocker>` means child waits on blocker
- `tsq dep remove <child> <blocker>`
- `tsq dep tree <id> [--direction up|down|both] [--depth N]` — dependency graph
- `tsq link add <src> <dst> --type relates_to|replies_to|duplicates|supersedes`
- `tsq link remove <src> <dst> --type relates_to|replies_to|duplicates|supersedes`
- `tsq duplicate <id> --of <canonical-id> [--reason <text>]` to canonicalize duplicates without dependency rewiring
- `tsq duplicates [--limit <n>]` for dry-run duplicate candidate scaffolding
- `tsq supersede <old-id> --with <new-id> [--reason <text>]`

## Search

- `tsq search "<query>"` — structured query with implicit AND
- Fields: `id`, `title`, `status`, `kind`, `priority`, `assignee`, `external_ref`, `parent`, `label`, `ready`
- Negation: `-status:closed` (use `--` separator: `tsq search -- -status:closed`)
- Bare words match title substring


## Restart durability

- Canonical history is append-only: `.tasque/events.jsonl`
- Derived cache is rebuildable: `.tasque/tasks.jsonl`
- State recovers by replaying snapshot + event tail after restart
