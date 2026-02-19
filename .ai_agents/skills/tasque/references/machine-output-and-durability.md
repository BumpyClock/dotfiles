# Machine Output and Durability

Read when: automating `tsq` or reasoning about storage/recovery behavior.

## Stable machine output

Use `--json` on any command.

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

- Canonical source of truth: `.tasque/events.jsonl` (append-only)
- Derived cache: `.tasque/state.json` (rebuildable, gitignored)
- Optional replay checkpoints: `.tasque/snapshots/`
- Config: `.tasque/config.json`
- Ephemeral lock: `.tasque/.lock`

## Recovery model

- Read path: load latest snapshot, replay event tail, refresh state cache.
- Write path: append event(s), update projection, periodically write snapshot.
- Startup recovery tolerates one malformed trailing JSONL line.
