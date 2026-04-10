# Agent Protocols
- Style: telegraph; drop filler/grammar; minimize tokens (global AGENTS + replies).
- Contact : Aditya Sharma (@bumpyclock / adityaksharma@gmail.com [personal]) (adityasharma_microsoft / adityasharma@microsoft.com [work]) 
- Workspace: `~/Projects`.Missing BumpyClock repo: `git clone https://github.com/BumpyClock/<repo>.git`.
- Non-BumpyClock OSS: clone to `~/Projects/oss`.
- Known hosts `"framed"` / `"adityas-macbook-pro"`: SSH there.
- Other clients: SSH there; find host/IP via `tailscale status`.
- Use `tasque` for task management/tracking.
  - Use built in task/todo tools for insession task tracking. 
  - Use tsq for long-horizon, and complex tasks so they survive compaction and session restarts. 
- Put files in repo or `~/Projects/dotfiles`.
- PRs: `gh pr view` / `gh pr diff`; no browser URLs.
  - `gh auth switch` to switch between accounts when needed (e.g. for PRs in forks).
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
- use `web_search` and `web_fetch` cli commands from `web-skill` for web search and web fetch
- use subagents whenever possible to speed up tasks. Prioritize time efficiency by delegating and doing tasks in parallel when possible. 
- read `~/Projects/dotfiles/tools.md` for available tools.

## Priorities
- Do not introduce shims, compatibility layers, or temporary bridges.
- Breaking changes are encouraged at this stage of development.
- When working on any part of this project: if you notice an architectural smell it is vital that you stop working and tell the user exactly the smell that you've noticed. 
- If you find yourself saying X is the better solution but the easier/quickest solution would be Y then stop and immediately tell the user there is an architectural smell.


## Screenshots ("use a screenshot")
- Pick newest PNG in `~/Desktop` or `~/Downloads`.
- Verify UI is correct (ignore filename).

## Docs
- Before coding: run `docs-list` command. open `docs/`, then follow links until domain is clear (`Read when` hints first).
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

## Docs
- Start: run docs list (`docs:list` script, or `bin/docs-list` here if present; ignore if not installed); open docs before coding.
- Follow links until domain makes sense; honor `Read when` hints.
- Keep notes short; update docs when behavior/API changes (no ship w/o docs).
- Add `read_when` hints on cross-cutting docs.
- Model note (2025-11-23): no `gpt-5.1-pro` / `grok-4.1` on Peter’s keys yet.
- Model preference: latest only. OK: Anthropic Opus 4.5 / Sonnet 4.5 (Sonnet 3.5 = old; avoid), OpenAI GPT-5.2, xAI Grok-4.1 Fast, Google Gemini 3 Flash.

## PR Feedback
- Active PR: `gh pr view --json number,title,url --jq '"PR #\\(.number): \\(.title)\\n\\(.url)"'`.
- PR comments: `gh pr view …` + `gh api …/comments --paginate`.
- Replies: cite fix + file/line; resolve threads only after fix lands.
- When merging a PR: thank the contributor in `CHANGELOG.md`.

## Flow & Runtime
- Use repo’s package manager/runtime; no swaps w/o approval.
- Use Codex background for long jobs; tmux only for interactive/persistent (debugger/server).

## Build / Test
- Before handoff: run full gate (lint/typecheck/tests/docs).
- CI red: `gh run list/view`, rerun, fix, push, repeat til green.
- Keep it observable (logs, panes, tails, MCP/browser tools).
- Release: read `docs/RELEASING.md` (or find best checklist if missing).
- Reminder: check `~/.profile` for missing env keys (e.g. `SPARKLE_PRIVATE_KEY_FILE`); Sparkle keys live in `~/Library/CloudStorage/Dropbox/Backup/Sparkle`.

## Git
- Safe by default: `git status/diff/log`. Push only when user asks.
- `git checkout` ok for PR review / explicit request.
- Branch changes require user consent.
- Destructive ops forbidden unless explicit (`reset --hard`, `clean`, `restore`, `rm`, …).
- Remotes under `~/Projects`: prefer HTTPS; flip SSH->HTTPS before pull/push.
- Commit helper on PATH: `committer`. Prefer it; if repo has `./scripts/committer`, use that.
- Don’t delete/rename unexpected stuff; stop + ask.
- No repo-wide S/R scripts; keep edits small/reviewable.
- Avoid manual `git stash`; if Git auto-stashes during pull/rebase, that’s fine (hint, not hard guardrail).
- If user types a command (“pull and push”), that’s consent for that command.
- No amend unless asked.
- Big review: `git --no-pager diff --color=never`.
- Multi-agent: check `git status/diff` before edits; ship small commits.

## Language/Stack Notes
- Swift: use workspace helper/daemon; validate `swift build` + tests; keep concurrency attrs right.
- TypeScript: use repo PM; run `docs:list`; keep files small; follow existing patterns.

## macOS Permissions / Signing (TCC)
- Never re-sign / ad-hoc sign / change bundle ID as “debug” without explicit ok (can mess TCC).

## Critical Thinking
- Fix root cause (not band-aid).
- Unsure: read more code; if still stuck, ask w/ short options.
- Conflicts: call out; pick safer path.
- Unrecognized changes: assume other agent; keep going; focus your changes. If it causes issues, stop + ask user.
- Leave breadcrumb notes in thread.

## Important Locations
- Blog repo: ``
- Notes/Runbooks: `~/Projects/manager/docs/` (e.g. `mac-studio.md`, `mac-vm.md`)
- Obsidian vault: ``

<frontend_aesthetics>
Avoid “AI slop” UI. Be opinionated + distinctive.

Do:
- Typography: pick a real font; avoid Inter/Roboto/Arial/system defaults.
- Theme: commit to a palette; use CSS vars; bold accents > timid gradients.
- Motion: 1–2 high-impact moments (staggered reveal beats random micro-anim).
- Background: add depth (gradients/patterns), not flat default.

Avoid: purple-on-white clichés, generic component grids, predictable layouts.
</frontend_aesthetics>
