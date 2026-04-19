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

- Truth: `.tasque/events.jsonl` (append-only)
- Cache: `.tasque/state.json` (rebuildable, gitignored)
- Replay checkpoints: `.tasque/snapshots/`
- Config: `.tasque/config.json`
- Ephemeral lock: `.tasque/.lock`

## Recovery model

- Read: load latest snapshot → replay event tail → refresh state cache.
- Write: append event(s) → update projection → periodically snapshot.
- Startup tolerates one malformed trailing JSONL line.
