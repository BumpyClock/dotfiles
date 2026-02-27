# Selectors and Refs

## Read when

- Writing selector expressions
- Deciding between selector and ref usage

## Selector syntax

Expression is `/`-separated segments.

Grammar:

```text
selector := segment ('/' segment)*
segment := [controlType] filter*
filter := '[' key op value ']'
op := '=' | '~='
```

Keys:
- `name` or `title`
- `controlType`
- `automationId`
- `class` or `className`

Ops:
- `=` case-insensitive exact match
- `~=` case-insensitive contains

Examples:

```text
window
window[name~="Notepad"]/edit
window/*[automationId="CloseButton"]
window[name~="PowerShell"]/tab/list/tabitem[name="PowerShell"]
```

## Selector defaults

- Snapshot-backed evaluation by default.
- Use live evaluation when state changes rapidly:
  - CLI: `--live`
  - MCP: `selector.preferCachedSnapshot=false`

## Ref strategy

- Prefer selectors for replayable automation.
- Use refs only for immediate next actions in the same short flow.
- `h:*` and `a:*` can expire or become stale.

If ref fails:
1. re-run `find` with selector
2. retry action once with fresh result
