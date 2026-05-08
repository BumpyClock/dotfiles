# Machine Output and Durability

Read when: automating `tsq` or reasoning about storage/recovery behavior.

## Stable machine output

Use `--format json` only when scripting/parsing. Human output is fine for inspection.
`--json` remains shorthand for `--format json`.

Success envelope:

```json
{
  "schema_version": 1,
  "command": "tsq ...",
  "ok": true,
  "data": {}
}
```

Error envelope:

```json
{
  "schema_version": 1,
  "command": "tsq ...",
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "..."
  }
}
```

## Storage model

- Git repos default to sync-worktree mode on `tsq init`: the main worktree keeps
  `.tasque/config.json`, while task data lives in `tsq-sync` unless
  `--sync-branch` or `--worktree-name` names another branch/worktree. Existing main-tree `.tasque` data
  migrates automatically when no `sync_branch` is configured. Fresh clones fetch
  the configured sync branch and create the worktree on first use. `tsq sync`
  pushes the sync branch to `origin` and sets upstream automatically when needed.
- Canonical source of truth: `.tasque/events.jsonl` (append-only)
- Derived cache: `.tasque/state.json` (rebuildable, gitignored)
- Legacy cache fallback: `.tasque/tasks.jsonl` (read-only fallback when `state.json` is absent; removal target)
- Optional replay checkpoints: `.tasque/snapshots/`
- Config: `.tasque/config.json`
- Ephemeral lock: `.tasque/.lock`

## Recovery model

- Read path: load latest snapshot, replay event tail, refresh state cache.
- Write path: append event(s), update projection, periodically write snapshot.
- Startup recovery tolerates one malformed trailing JSONL line.
- Do not create or edit `.tasque/tasks.jsonl`; new writes use `.tasque/state.json`.
