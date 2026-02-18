# Ralph/Ouroboros Loop Script Research

Date: 2026-02-17

## Sources reviewed

- https://github.com/iannuttall/codex-ralph-loop
- https://github.com/garysieling/ralf
- https://github.com/garysieling/ralf/blob/master/ralf.py
- https://mkdev.me/posts/how-i-make-codex-work-on-big-tasks-with-my-ralph-loop

## Reusable patterns

- Run `codex exec` in JSONL mode by default (`--json`) so downstream parsing is reliable.
- Persist per-iteration artifacts (JSONL logs and last-message snapshots) for debugging and replay.
- Keep durable iteration state in a small JSON file and circuit-break at `max_iterations`.
- Add explicit stop conditions from model output (`no beads available` or similar sentinel text).
- Detect rate/usage limit responses and sleep/retry instead of hard-failing immediately.
- Print compact previews from recent structured events rather than dumping full logs.
- Resolve command paths explicitly on Windows (`.cmd`/shim resolution) to avoid `ENOENT`.

## What we applied in this repo

- Main loop entrypoint is now `scripts/ralph-loop/ouroboros.ts`.
- Provider plumbing is explicit via `--provider` (currently implemented: `codex`).
- Loop internals are split into core/provider modules:
  - `scripts/ralph-loop/core/*` for CLI, config, engine, runner, beads, state, and terminal UI
  - `scripts/ralph-loop/providers/*` for provider adapters/registry
- Config loading now supports:
  - Global config: `~/.ouroboros/config.json`
  - Project config: `~/.ouroboros/projects/<derived-git-root-key>.json`
  - Merge precedence: `CLI > project > global > provider defaults`
- Project key is always derived from git root path, and startup fails fast if no git root is available.
- Codex runs as `codex exec --json --output-last-message <file> -`.
- Per-iteration JSONL and last-message files are written under provider log dir defaults.
- Live stream output uses an in-place terminal renderer with per-agent rolling preview windows (`--preview` lines each).
- Parallel startup is staged: agent N+1 launches only after an already-started agent emits first response (or exits).
- Beads integration is live:
  - Pulls snapshots via `bd list --json --all --limit 0`
  - Shows remaining/open/in-progress/blocked/closed summary
  - Shows top remaining beads
  - Tracks and shows per-agent picked bead IDs/titles when referenced in live output
