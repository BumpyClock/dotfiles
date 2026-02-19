# Runtime Workspace

This directory is reserved for runtime artifacts only (for example `session_context/`, logs, and temporary agent outputs).

Source-of-truth assets were moved to top-level directories:

- `AGENTS.md`
- `prompts/`
- `skills/`
- `docs/`
- `agent-scripts/`

Use `bun scripts/link-dotfiles/link-dotfiles.ts --dotfiles-dir "$PWD"` to wire these into agent home directories.
