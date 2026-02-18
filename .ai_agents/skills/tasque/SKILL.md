---
name: tasque
description: Operational guide for Tasque (tsq) local task tracking
---

<!-- tsq-managed-skill:v1 -->

# Tasque Skill

Use `tsq` for durable local task tracking.

## Core loop

1. `tsq ready`
2. `tsq show <id>`
3. `tsq update <id> --status in_progress`
4. `tsq update <id> --status closed`

## Create and inspect

- `tsq create "Title" --kind task|feature|epic -p 0..3`
- `tsq show <id>`
- `tsq list --status open --kind task`
- `tsq doctor`

## Dependencies and relations

- `tsq dep add <child> <blocker>` means child waits on blocker
- `tsq dep remove <child> <blocker>`
- `tsq link add <src> <dst> --type relates_to|replies_to|duplicates|supersedes`
- `tsq link remove <src> <dst> --type relates_to|replies_to|duplicates|supersedes`
- `tsq supersede <old-id> --with <new-id> [--reason <text>]`

## JSON mode

Add `--json` to any command for stable automation output:
`{"schema_version":1,"command":"tsq ...","ok":true,"data":{}}`

## Restart durability

- Canonical history is append-only: `.tasque/events.jsonl`
- Derived cache is rebuildable: `.tasque/state.json`
- State recovers by replaying snapshot + event tail after restart
