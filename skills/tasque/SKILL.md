---
name: tasque
description: Operational guide for Tasque (tsq) local task tracking and management.
---

<!-- tsq-managed-skill:v1 -->



Durable task tracking via `tsq`.

- Local-first and repo-local (`.tasque/`), so tracking works offline with no external service.
- Append-only JSONL history is git-friendly and auditable across agent sessions.
- Durable restart/replay model survives context compaction and crashes.
- Lane-aware readiness plus typed dependencies makes parallel sub-agent execution explicit and safe.
- Stable `--json` output keeps agent automation predictable.
- Survive context compaction, session restarts, and crashes.

## What to do by default

1. Run `tsq ready --lane planning` and `tsq ready --lane coding`.
2. Pick a task with `tsq show <id>`.
3. If planning is incomplete, collaborate with the user and attach/update spec.
4. Mark planning done: `tsq update <id> --planning planned`.
5. Claim/start work: `tsq update <id> --claim [--assignee <name>]` then `tsq update <id> --status in_progress`.
6. Close when complete: `tsq update <id> --status closed`.

## Required habits

- Keep lifecycle `status` and `planning_state` separate.
- Add dependencies so parallel work is explicit (`blocks` vs `starts_after`).
- Break work into small tasks that can run in parallel across sub-agents.
- Create new tasks for discovered bugs/follow-ups instead of leaving TODOs in chat.
- Prefer `--json` for automation and tool-to-tool handoffs.

## Read when needed

- Planning/deferred semantics and lane-ready behavior: `references/planning-workflow.md`
- Full CLI command catalog and option matrix: `references/command-reference.md`
- Task authoring checklist and naming/labeling standards: `references/task-authoring-checklist.md`
- JSON schema and storage/durability model: `references/machine-output-and-durability.md`
