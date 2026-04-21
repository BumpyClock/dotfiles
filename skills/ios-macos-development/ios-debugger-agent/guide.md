---
name: ios-debugger-agent
description: Build, run, inspect, and debug iOS apps on Simulator with XcodeBuildMCP. Use when asked to launch an app, inspect visible UI, tap/type/swipe, capture screenshots/logs, or diagnose runtime behavior from a booted simulator.
---

# iOS Debugger Agent

Use XcodeBuildMCP for live simulator debugging when tools are available. Prefer these tools over shelling out to `simctl` for interactive build/run/UI/log workflows; use `ios-simulator/guide.md` scripts when you need repeatable reports or automation artifacts.

## Core Workflow

1. Show active defaults first with `session_show_defaults`.
2. Discover project/workspace with `discover_projs` if defaults are missing.
3. List schemes with `list_schemes` and choose the app scheme.
4. List simulators with `list_sims`; prefer a booted iOS simulator when one exists.
5. Set defaults with `session_set_defaults`: `projectPath` or `workspacePath`, `scheme`, and `simulatorId` or `simulatorName`.
6. Build/run with `build_run_sim` when launch is requested, or `build_sim` when compile-only is enough.
7. Confirm runtime state with `snapshot_ui` or `screenshot` before UI interaction.

## UI Interaction

- Inspect visible UI with `snapshot_ui`; use it before tapping or typing.
- Tap with `tap`, preferring `id` or `label`; use coordinates only when accessibility targeting is unavailable.
- Type with `type_text` after focusing the field.
- Use `gesture`, `swipe`, or `button` for scrolls, edge swipes, and hardware buttons.
- Capture visual state with `screenshot`.

## Logs

- Start log capture with `start_sim_log_cap`; use `captureConsole: true` when stdout/stderr matters.
- Reproduce the issue while capture is running.
- Stop capture with `stop_sim_log_cap` and summarize only relevant errors, warnings, and app-console lines.
- If the bundle ID is unknown, use `get_sim_app_path` followed by `get_app_bundle_id`.

## Debugger

- Attach with `debug_attach_sim` by bundle ID or PID.
- Add focused breakpoints with `debug_breakpoint_add`.
- Use `debug_stack`, `debug_variables`, and `debug_lldb_command` for evidence.
- Detach with `debug_detach` before handoff unless the user wants the session left active.

## Troubleshooting

- If no simulator is booted and the user asked to build/run, `build_run_sim` can boot and launch using defaults.
- If the task is inspect-only and no simulator is booted, ask before booting or changing simulator state.
- If build output is unclear, retry once with `preferXcodebuild: true` via `session_set_defaults`, then rebuild.
- If the wrong app launches, verify scheme, bundle ID, active defaults, and built app path before continuing.
- If taps miss, rerun `snapshot_ui` after layout changes and prefer accessibility IDs over coordinates.
