---
name: peeku-windows
description: Use when automating Windows UI/apps with peeku CLI or MCP. Exposes peeku primitives (targeting, observing, selecting, acting, waiting, streaming, recipes, batch, performance gates) with selection heuristics and reliability rules so agents can choose the right workflow instead of following a fixed sequence.
---

# Peeku Windows

## Overview

Use this skill as a capability map for `peeku`.

Choose primitives based on task intent, confidence, and failure mode. Do not assume a fixed step order.

## Operating Conventions

- Prefer JSON outputs for machine decisions: `--format json`.
- Prefer daemon mode for iterative loops and `watch`.
- Prefer selectors for replayability; use refs for short-lived follow-up only.
- Treat action success as data-driven (`ok`, `warnings`, `evidence`), not assumed.

## Primitive Families

### 1) Targeting primitives

Use to define where operations apply.

- Window targets:
  - focused window
  - `hwnd`
  - window query (`titleContains`, `processName`, `processId`)
- Surface targets:
  - `start_menu`, `context_menu`, `active_popup`, `taskbar`, `notification_area`, `desktop_root`

Pick window query or `hwnd` when focus drift is likely.
Pick surfaces for shell UI.

### 2) Observation primitives

Use to inspect current state.

- `windows list`, `windows focused`
- `uia snapshot`
- `see` (capture + snapshot)
- `capture image`
- `observe` (events)

Use shallow snapshots first (`depth 2`, `maxNodes 500`), then increase only if required.

### 3) Selection primitives

Use to resolve UI elements.

- `find` for multi-match discovery
- `element get` for detail inspection
- selector DSL with segment filters (`=`, `~=`)
- live evaluation:
  - CLI: `--live`
  - MCP: `selector.preferCachedSnapshot=false`

Use live evaluation when UI state changes faster than snapshots remain useful.

### 4) Action primitives

Use to mutate UI/application state.

- `click`, `invoke`
- `set-value`, `type`
- `scroll`, `hotkey`

Method choice:
- prefer UIA semantics when controls expose patterns (`--method uia`)
- prefer input simulation when UIA path is ineffective (`--method input`)

### 5) Time/coordination primitives

Use to synchronize with asynchronous UI changes.

- `wait` for condition arrival
- `watch` for streaming selector updates (daemon required)

Use `wait` for bounded synchronization.
Use `watch` for long-running reactive flows.

### 6) Composite primitives

Use for high-level intents.

- `start run` for open-start-search-enter workflow
- `context select` for menu-item selection
- `batch` for deterministic multi-step tool sequences

Use `batch` when atomic step ordering and stop-on-error behavior matter.

### 7) Performance primitives

Use when performance/regression validation is requested.

- `perf gate` measures `find`, `click`, `set-value`, `type`, `watch`
- supports threshold checks and baseline updates

## Reliability Rules

- Use selectors as the durable contract.
- Treat `h:*` and `a:*` refs as ephemeral.
- On stale/unknown ref, re-resolve with selector and retry once.
- For `set-value` and `type`, fail on `verificationMatched=false`.
- For transient surfaces (`start_menu`, `context_menu`, `active_popup`), refresh ids before actions.

## Primitive Selection Heuristics

- Need broad context quickly: `see`.
- Need precise structure only: `uia snapshot`.
- Need candidate elements: `find`.
- Need one element's capabilities/properties: `element get`.
- Need deterministic multi-step execution: `batch`.
- Need launch/menu intents: `start run` or `context select`.
- Need fast reactive monitoring: daemon + `watch`.
- Need regression signal: `perf gate`.

## CLI and MCP Mapping

- CLI command templates: `references/02-cli-cheatsheet.md`
- MCP tools and argument templates: `references/03-mcp-cheatsheet.md`
- Selector grammar and ref policy: `references/04-selectors-and-refs.md`
- Recovery playbook: `references/05-recovery.md`
- Perf and metrics workflow: `references/06-metrics.md`

## Minimal Bootstrap Snippets

Daemon-backed CLI loop:

```powershell
peeku --format json doctor
peeku --daemon
```

Sample inspect/select/act loop:

```powershell
peeku --format json see --depth 2 --maxNodes 500
peeku --format json find --selector "window/edit" --limit 20
peeku --format json set-value --selector "window/edit" --value "hello"
```

Stop daemon:

```powershell
peeku --daemon --stop
```
