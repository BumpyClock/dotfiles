# Planning Workflow

Read when: deciding if work belongs in planning lane vs coding lane, or parking work as deferred.

## Overview

Tasque supports planning-aware workflow via `planning_state` field, orthogonal to lifecycle `status`.

Separation tracks **what needs design/planning** independently from **what is actively worked on**. Task can be `open` but still need planning, or `in_progress` with planning done.

## Planning State

Every task carries `planning_state` field, two values:

- `needs_planning` — needs planning before coding begins (default for new tasks)
- `planned` — planning done, ready for coding

New tasks default to `planning_state: "needs_planning"`. Legacy tasks (pre-feature) treated as `needs_planning`.

## Deferred Status

`deferred` status = active-but-parked lifecycle state. Tasks with `status: deferred`:

- **Not ready** (excluded from `ready` command output)
- **Included** in `stale` scans (can go stale like any non-terminal task)
- Can transition to any non-terminal status (`open`, `in_progress`, `blocked`)
- **Not terminal** — unlike `closed`/`canceled`, deferral reversible

Use `deferred` when task valid but not actionable now (waiting external input, deprioritized, parked for future iteration).

## Lane-Aware Ready

`ready` command supports lane filtering to split planning work from coding work:

| Command | Returns |
|---|---|
| `tsq ready` | All ready tasks (planning + coding) |
| `tsq ready --lane planning` | Ready tasks with `planning_state` = `needs_planning` (or unset) |
| `tsq ready --lane coding` | Ready tasks with `planning_state` = `planned` |

Task "ready" when:
- Status is `open` or `in_progress`
- Zero open blockers (all dependency targets `closed` or `canceled`)
- Not `canceled`, `closed`, or `deferred`

Lane filtering applied on top of standard ready check.

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

1. Create tasks — start as `open` + `needs_planning`
2. Run `tsq ready --lane planning` to find tasks needing planning
3. Do planning; mark done with `tsq update <id> --planning planned`
4. Run `tsq ready --lane coding` to find tasks ready for implementation
5. Claim + work tasks normally
6. Use `tsq update <id> --status deferred` to park valid-but-not-yet-actionable tasks
