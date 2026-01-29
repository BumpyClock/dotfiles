Work style: telegraph; noun-phrases ok; drop grammar; min tokens.

# Agent Protocols
- Workspace: ~/Projects. Missing BumpyClock repo: clone https://github.com/BumpyClock/<repo>.git.
- 3rd-party/OSS (non-BumpyClock): clone under ~/Projects/oss.
- "MacBook" / "Mac Studio" => SSH there; find hosts/IPs via tailscale status.
- Files: repo or ~/Projects/agent-scripts.
- PRs: use gh pr view/diff (no URLs).
- "Make a note" => edit AGENTS.md (shortcut; not a blocker). Ignore CLAUDE.md.
- No ./runner. Guardrails: use trash for deletes.
- Need upstream file: stage in /tmp/, then cherry-pick; never overwrite tracked.
- Bugs: add regression test when it fits.
- Keep files <~500 LOC; split/refactor as needed.
- Commits: Conventional Commits (feat|fix|refactor|build|ci|chore|docs|style|perf|test).
- Subagents: read docs/subagent.md.
- Editor: code <path>.
- CI: gh run list/view (rerun/fix til green).
- Prefer end-to-end verify; if blocked, say what's missing.
- New deps: quick health check (recent releases/commits, adoption).
- Slash cmds: ~/.codex/prompts/.
- Web: search early; quote exact errors; prefer 2024–2025 sources; fallback Firecrawl (pnpm mcp:*) / mcporter.
- Oracle: run npx -y @steipete/oracle --help once/session before first use.
- Style: telegraph. Drop filler/grammar. Min tokens (global AGENTS + replies).


## Screenshots (“use a screenshot”)
- Pick newest PNG in `~/Desktop` or `~/Downloads`.
- Verify it’s the right UI (ignore filename).
- Size: `sips -g pixelWidth -g pixelHeight <file>` (prefer 2×).
- Optimize: `imageoptim <file>` (install: `brew install imageoptim-cli`).
- Replace asset; keep dimensions; commit; run gate; verify CI.

## Docs
- Start: run docs list (`docs:list` script, or `bin/docs-list` here if present; ignore if not installed); open docs before coding.
- Follow links until domain makes sense; honor `Read when` hints.
- Keep notes short; update docs when behavior/API changes (no ship w/o docs).
- Add `read_when` hints on cross-cutting docs.
- Model note (2025-11-23): no `gpt-5.1-pro` / `grok-4.1` on Peter’s keys yet.
- Model preference: latest only. OK: Anthropic Opus 4.5 / Sonnet 4.5 (Sonnet 3.5 = old; avoid), OpenAI GPT-5.2, xAI Grok-4.1 Fast, Google Gemini 3 Flash.

# Core
- Prefer existing, well-maintained libraries/framework features over custom code when they materially reduce complexity.
  - Evaluate options by: maintenance cadence, community adoption, docs quality, license, and compatibility with the project's stack.
  - When multiple good options exist, propose 2–3 with clear pros/cons and a recommendation.
  - Prefer the latest versions of libraries unless there are compatability concerns. 

# Learnings (per-repo)
- Maintain a `LEARNINGS.md` at the repository root (create if missing).
- On start: read `LEARNINGS.md` to avoid repeating ineffective approaches.
- After notable progress or a new failure mode: append a short entry
- Keep entries concise. Never include secrets, sensitive URLs, or personal data.

# Skills / modes (if supported by the runtime)
- Use "programming" only when actively writing/modifying code.
- Use "ux-designer" when implementing or changing user-facing UI/UX (provide brief UX rationale).
- Use "subagent-driven-development" for larger changes to preserve context and parallelize safely.
- If skills/modes aren’t available in the environment, follow the intent of the above rules and state what you’re doing instead.
