# MCP Cheatsheet

## Read when

- Calling peeku tools through MCP
- Building multi-step tool plans

## Tool names

- `peeku_doctor`
- `peeku_windows_list`
- `peeku_windows_focused`
- `peeku_surfaces_list`
- `peeku_surface_focus`
- `peeku_surface_snapshot`
- `peeku_capture_image`
- `peeku_uia_snapshot`
- `peeku_see`
- `peeku_find`
- `peeku_element_get`
- `peeku_click`
- `peeku_invoke`
- `peeku_set_value`
- `peeku_type`
- `peeku_scroll`
- `peeku_hotkey`
- `peeku_observe`
- `peeku_wait`
- `peeku_batch`
- `peeku_launch`
- `peeku_open`
- `peeku_start_run`
- `peeku_context_select`

## Common argument templates

`peeku_uia_snapshot`:

```json
{
  "target": { "kind": "focused_window" },
  "depth": 2,
  "maxNodes": 500,
  "includeProperties": "basic"
}
```

`peeku_find` with selector:

```json
{
  "selector": { "expr": "window[name~=\"Notepad\"]/edit" },
  "limit": 20
}
```

Live selector eval:

```json
{
  "selector": {
    "expr": "window/button[name=\"OK\"]",
    "preferCachedSnapshot": false
  }
}
```

`peeku_click`:

```json
{
  "selector": { "expr": "window/button[name=\"OK\"]" },
  "method": "uia"
}
```

`peeku_set_value`:

```json
{
  "selector": { "expr": "window/edit" },
  "value": "hello"
}
```

`peeku_start_run`:

```json
{
  "query": "notepad",
  "expectedTitle": "Notepad",
  "waitTimeoutMs": 5000
}
```

`peeku_context_select`:

```json
{
  "item": "Open",
  "target": "context_menu"
}
```

## Response contract checks

- Read `structuredContent` as source of truth.
- For capture/see with base64 image, expect an `image` content block.
- For actions, inspect `evidence` fields.
- For refs, accept both canonical `h:*` and alias `a:*`, but re-resolve on misses.
