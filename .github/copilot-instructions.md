---
applyTo: '**'
---
# Agent Protocols
- Style: telegraph; drop filler/grammar; minimize tokens (global AGENTS + replies).
- Workspace: `~/Projects`.
- Missing BumpyClock repo: `git clone https://github.com/BumpyClock/<repo>.git`.
- Non-BumpyClock OSS: clone to `~/Projects/oss`.
- Known hosts `"framed"` / `"adityas-macbook-pro"`: SSH there.
- Other clients: SSH there; find host/IP via `tailscale status`.
- Use `tasque` for task management/tracking.
- Put files in repo or `~/Projects/dotfiles`.
- PRs: `gh pr view` / `gh pr diff`; no browser URLs.
- "Make a note": update `LEARNINGS.md` (shortcut; not blocking).
- No `./runner`.
- Deletes go to trash.
- Need upstream file: stage in `/tmp/`, then cherry-pick; never overwrite tracked files.
- Bugs: add regression test when appropriate.
- Keep files <= ~500 LOC; split/refactor as needed; suggest refactors proactively; delete/archive unused files.
- If you find a large file, create a tracking task.
- Commits: Conventional Commits (`feat|fix|refactor|build|ci|chore|docs|style|perf|test`).
- Subagents: default to agent teams + parallel subagents; delegate + parallelize aggressively to go faster + preserve context.
- Editor: `code <path>`.
- CI: `gh run list` / `gh run view`; rerun/fix until green.
- Prefer end-to-end verification; if blocked, state what is missing.
- New deps: quick health check (recent releases/commits, adoption).
- Slash commands: `~/.codex/prompts/` (Codex) or `~/.claude/prompts/` (Claude).


## Screenshots ("use a screenshot")
- Pick newest PNG in `~/Desktop` or `~/Downloads`.
- Verify UI is correct (ignore filename).

## Docs
- Before coding: open `docs/`, then follow links until domain is clear (`Read when` hints first).
- Learned docs: maintain `docs/learned/LEARNINGS.md` (create if missing); split by topic into `docs/learned/<topic>.md`; add `read_when` hints for cross-cutting docs.
- Research: search early; quote exact errors; prefer 2024-2026 sources; fallback Brave Search; save findings in `docs/learned/<topic>.md`.
- Keep notes short; before coding, read/search `docs/` + `docs/learned/<topic>.md`.
- Docs quality: if behavior/API changes, update docs before ship.
- Learned entry rules: evergreen/durable only (architecture decisions, rationale, pitfalls, failure modes); no transient changelog entries ("added X", "fixed Y", "renamed Z"); never include secrets, sensitive URLs, or personal data.

# External libs/frameworks
- Prefer existing, well-maintained libraries/framework features over custom code when they materially reduce complexity.
  - Evaluate options by maintenance cadence, adoption, docs quality, license, and stack compatibility.
  - If multiple good options exist, propose 2-3 with clear pros/cons and a recommendation.
  - Prefer latest library versions unless compatibility concerns.


# Skills / modes
- Use `programming` only when actively writing/modifying code.
- Use `ux-designer` when implementing/changing user-facing UI/UX (add brief UX rationale).
