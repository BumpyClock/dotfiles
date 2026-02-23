# CLI Cheatsheet

## Read when

- Running peeku from terminal
- You need exact commands without discovery

## Global flags

- `--format json`
- `--timeout 00:00:10`
- `--log-level info|debug|trace`

## Diagnostics

```powershell
peeku doctor
peeku doctor --deep
```

## Windows and capture

```powershell
peeku --format json windows list --limit 10
peeku --format json windows focused
peeku --format json capture image --includeBase64 false
```

## UIA inspect

```powershell
peeku --format json uia snapshot --depth 2 --maxNodes 500
peeku --format json see --depth 2 --maxNodes 500 --includeBase64 false
peeku --format json find --selector "window[name~=\"Notepad\"]/edit" --limit 20
peeku --format json element get --selector "window/edit" --includeProperties all
```

## Actions

```powershell
peeku --format json click --selector "window/button[name=\"OK\"]"
peeku --format json invoke --selector "window/menuitem[name=\"File\"]"
peeku --format json set-value --selector "window/edit" --value "hello"
peeku --format json type --selector "window/edit" --text "hello" --append false
peeku --format json scroll --selector "window/edit" --lines -3 --direction vertical
peeku --format json hotkey --keys "CTRL+SHIFT+S"
```

## Wait and watch

```powershell
peeku --format json wait --selector "window/button[name=\"OK\"]" --live --timeout 00:00:10
peeku --format json watch --selector "window/button[name=\"OK\"]" --debounce-ms 100 --limit 20
```

Notes:
- `watch` requires daemon mode.
- `--live` avoids stale snapshot state.

## Surfaces

```powershell
peeku --format json surfaces list
peeku --format json surfaces focus --kind context_menu
peeku --format json surfaces snapshot --kind active_popup --depth 2 --maxNodes 500
```

Surface kinds:
- `start_menu`
- `context_menu`
- `active_popup`
- `taskbar`
- `notification_area`
- `desktop_root`

## Batch

```powershell
peeku --format json batch --in ops.json --stop-on-error true
```

`ops.json`:

```json
[
  { "tool": "peeku_find", "args": { "selector": { "expr": "window/edit" } } },
  { "tool": "peeku_set_value", "args": { "selector": { "expr": "window/edit" }, "value": "hello" } }
]
```
