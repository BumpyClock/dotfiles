# Task Authoring Checklist

Read when: creating/refining tasks or splitting work for parallel execution.

## Minimum quality bar

- Clear, action-oriented titles.
- Set `kind` correctly (`task`, `feature`, `epic`).
- Assign priority (`0..3`) intentionally.
- Add labels w/ consistent format.
- Attach spec content when scope/acceptance non-trivial.
- Link task deps + relations explicitly.

## Parallelization guidance

- Prefer many independent tasks > one large task.
- Use `blocks` only when completion truly gates another task.
- Use `starts_after` for ordering w/o readiness blocking.
- Add discovered follow-ups as new tasks w/ `--discovered-from <id>`.
- Size each task -> one agent, one focused pass.

## Practical starter flow

```bash
tsq create "<title>" --kind task -p 2 --needs-planning
tsq spec attach <id> --text "<markdown spec>"
tsq dep add <child> <blocker> --type blocks
tsq link add <src> <dst> --type relates_to
```