# Planning Workflow

Read when: deciding whether work belongs in planning lane vs coding lane, or when parking work as deferred.

## Overview

Tasque supports a planning-aware workflow via the `planning_state` field, orthogonal to lifecycle `status`.

This separation allows teams to track **what needs design/planning** independently from **what is actively being worked on**. A task can be `open` but still need planning, or `in_progress` with planning already complete.

## Planning State

Every task carries a `planning_state` field with two values:

- `needs_planning` — task needs planning before coding work can begin (default for new tasks)
- `planned` — planning is complete, task is ready for coding

New tasks default to `planning_state: "needs_planning"`. Legacy tasks (created before this feature) are treated as `needs_planning`.

## Deferred Status

The `deferred` status is an active-but-parked lifecycle state. Tasks with `status: deferred`:

- Are **not ready** (excluded from the `ready` command output)
- **Are** included in `stale` scans (they can become stale like any non-terminal task)
- Can transition to any non-terminal status (`open`, `in_progress`, `blocked`)
- Are **not terminal** — unlike `closed` or `canceled`, deferral is reversible

Use `deferred` when a task is valid but not actionable right now (e.g., waiting on external input, deprioritized, or parked for a future iteration).

## Lane-Aware Ready

The `ready` command supports lane filtering to separate planning work from coding work:

| Command | Returns |
|---|---|
| `tsq ready` | All ready tasks (both planning and coding) |
| `tsq ready --lane planning` | Ready tasks with `planning_state` = `needs_planning` (or unset) |
| `tsq ready --lane coding` | Ready tasks with `planning_state` = `planned` |

A task is "ready" when:
- Its status is `open` or `in_progress`
- It has zero open blockers (all dependency targets are `closed` or `canceled`)
- It is not `canceled`, `closed`, or `deferred`

Lane filtering is applied on top of the standard ready check.

## CLI Usage

### Create with planning state

```bash
# Explicit planning state
tsq create "Design auth module" --planning needs_planning
tsq create "Design auth module" --needs-planning    # shorthand for --planning needs_planning

# Mark as already planned
tsq create "Implement auth module" --planning planned
```

### Filter by planning state

```bash
tsq list --planning needs_planning   # tasks that still need planning
tsq list --planning planned          # tasks with planning complete
```

### Update planning state

```bash
tsq update <id> --planning planned          # mark planning as done
tsq update <id> --planning needs_planning   # revert to needs-planning
```

### Lane-aware ready

```bash
tsq ready                    # all ready tasks
tsq ready --lane planning    # what needs planning?
tsq ready --lane coding      # what's ready to code?
tsq ready --lane coding --json   # machine-readable output
```

### Deferred status

```bash
tsq update <id> --status deferred    # park a task
tsq list --status deferred           # see parked tasks
tsq update <id> --status open        # un-park a task
```

## Typical Workflow

1. Create tasks — they start as `open` + `needs_planning`
2. Run `tsq ready --lane planning` to find tasks needing planning work
3. Do planning; mark complete with `tsq update <id> --planning planned`
4. Run `tsq ready --lane coding` to find tasks ready for implementation
5. Claim and work on tasks normally
6. Use `tsq update <id> --status deferred` to park tasks that are valid but not actionable yet
