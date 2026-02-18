
# Agent Protocols
- Workspace: ~/Projects. Missing BumpyClock repo: clone https://github.com/BumpyClock/<repo>.git.
- 3rd-party/OSS (non-BumpyClock): clone under ~/Projects/oss.
- "MacBook" / "Mac Studio" => SSH there; find hosts/IPs via tailscale status.
- Files: repo or ~/Projects/agent-scripts.
- PRs: use gh pr view/diff (no URLs).
- "Make a note" => edit LEARNINGS.md (shortcut; not a blocker).
- No ./runner. Guardrails: use trash for deletes.
- Need upstream file: stage in /tmp/, then cherry-pick; never overwrite tracked.
- Bugs: add regression test when it fits.
- Keep files <~500 LOC; split/refactor as needed. Proactively offer refactor suggestions; delete/archive unused files.
- Commits: Conventional Commits (feat|fix|refactor|build|ci|chore|docs|style|perf|test).
- Subagents: read "~/.ai_agents/docs/subagent.md".
- Editor: code <path>.
- CI: gh run list/view (rerun/fix til green).
- Prefer end-to-end verify; if blocked, say what's missing.
- New deps: quick health check (recent releases/commits, adoption).
- Slash cmds: ~/.codex/prompts/.
- Web: search early; quote exact errors; prefer 2024–2026 sources; fallback Firecrawl (pnpm mcp:*) / mcporter. 
   - Save search results and findings in docs/learned/<topic>.md so that learnings persist compaction.
   - Read / search docs & docs/learned/<topic>.md before coding.
- Style: telegraph. Drop filler/grammar. Min tokens (global AGENTS + replies).
- Use parallel subagents / agent teams to perform tasks faster and preserve context. See subagent.md for details.

## Screenshots (“use a screenshot”)
- Pick newest PNG in `~/Desktop` or `~/Downloads`.
- Verify it’s the right UI (ignore filename).


## Docs
- Start: open docs before coding.
- Follow links until domain makes sense; honor `Read when` hints.
- Keep notes short; update docs when behavior/API changes (no ship w/o docs).
- Add `read_when` hints on cross-cutting docs.


# Core
- Prefer existing, well-maintained libraries/framework features over custom code when they materially reduce complexity.
  - Evaluate options by: maintenance cadence, community adoption, docs quality, license, and compatibility with the project's stack.
  - When multiple good options exist, propose 2–3 with clear pros/cons and a recommendation.
  - Prefer the latest versions of libraries unless there are compatability concerns. 

# Learnings (per-repo)
- Maintain a `LEARNINGS.md` at the repository root (create if missing).
- On start: read `LEARNINGS.md` to avoid repeating ineffective approaches.
- After notable progress or a new failure mode: append a short entry.
- Keep entries **evergreen and durable** — record architectural decisions, design rationale, pitfalls, and failure modes that will stay relevant.
- **Do NOT** add transient changelog entries ("added X feature", "fixed Y bug", "renamed A to B"). Those belong in git commits and release notes, not learnings.
- Periodically consolidate: merge related entries, drop anything that's now obvious or captured elsewhere (e.g. in the repo's spec/docs).
- Keep entries concise. Never include secrets, sensitive URLs, or personal data.

# Skills / modes
- Use "programming" only when actively writing/modifying code.
- Use "ux-designer" when implementing or changing user-facing UI/UX (provide brief UX rationale).

