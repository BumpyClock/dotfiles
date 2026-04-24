# Communication style
From `~/.ai_agents/personalities` use `styles\explanatory` and `eridani`


# Agent protocols
- Contact: Aditya Sharma (`@bumpyclock` / `adityaksharma@gmail.com` personal) (`adityasharma_microsoft` / `adityasharma@microsoft.com` work).
- Workspace: `~/Projects`.
- BumpyClock repos -> personal acct. Work repos -> work acct. Missing BumpyClock repo -> `git clone https://github.com/BumpyClock/<repo>.git`.
- Non-BumpyClock OSS -> `~/Projects/oss`.
- Hosts `framed` / `adityas-macbook-pro` -> SSH direct. Other hosts -> find via `tailscale status`.
- Put files in repo or `~/Projects/dotfiles`.
- Read `~/Projects/dotfiles/tools.md`.

## Workflow
- Use `tasque` (as needed) + in-session task/todo tools. Use `tsq` for long-horizon work, in-session task/todo tools for in-session tracking.
- Prefer subagents. Delegate and Parallelize independent work as much as possible. Token efficiency is secondary speed is paramount.
- PRs: use `gh pr view` / `gh pr diff`; no browser URLs. Use `gh auth switch` if acct mismatch.
- `Make note` -> use repo learned-doc convention. Prefer `docs/learned/<topic>.md` or `docs/learned/LEARNINGS.md`. If repo already uses root `LEARNINGS.md`, follow repo convention. If repo says `no docs`, skip.
- Deletes -> trash.
- Need upstream file -> stage in `/tmp/`, cherry-pick. Never overwrite tracked file.
- Keep files <= ~500 LOC. Split/refactor when needed. Big file -> create tracking task.
- Commits: Conventional Commits `feat|fix|refactor|build|ci|chore|docs|style|perf|test`.
- Prefer end-to-end verification. If blocked, state missing piece.
- Prefer maintained libs/framework features over custom code when complexity drops. Check maintenance, adoption, docs, license, fit. For new deps, do quick health check. If several good options exist, propose 2-3 + recommendation.
- Inherent knowledge good but use `web_search` / `web_fetch` for latest information.

## Coding discipline
- Bias coding decisions toward caution over speed; trivial tasks still use judgment.
- Before coding: state assumptions. Multiple interpretations -> present options + recommendation. Unclear -> read more, then ask.
- Push back when a simpler approach exists or reqs imply overbuild.
- Minimum code that solves req. No speculative features, single-use abstractions, unrequested config, or impossible-case handling.
- If impl grows large, simplify. 200 LOC that can be 50 -> rewrite.
- Surgical edits only. Every changed line should trace to user req.
- No adjacent cleanup, drive-by formatting, or unrelated refactor. Mention unrelated dead code; do not delete.
- Match existing style even when suboptimal.
- Remove only unused imports/vars/fns made unused by own changes.
- Define success criteria for non-trivial work. Brief plan with verify step per item.
- Bugs -> reproduce with regression test when apt, then fix.
- Refactors -> verify before/after when feasible.

## Priorities
- Fix root cause, not band-aid.
- No shims, compat layers, temp bridges.
- Breaking changes OK.
- Architectural smell -> stop, tell user exact smell.
- If unsure, read more code. Still stuck -> ask with short options.
- Call out conflicts. Pick safer path.
- Unrecognized changes -> assume other agent unless blocking. Focus own changes. If conflicting, stop + ask.
- Leave breadcrumb notes in thread.

## PR feedback
- Comments: `gh pr view` + `gh api .../comments --paginate`.
- Replies: cite fix + file/line. Resolve threads only after fix lands.
- Merge contributor PR -> thank contributor in `CHANGELOG.md`.

## Flow / runtime
- Use repo package manager/runtime. No swaps without approval.
- Use Codex background for long jobs. Use `tmux` only for interactive/persistent work.

## Docs / build / test
- Before coding: if repo has docs-list cmd, run it. Prefer `docs-list`, else `docs:list`, else `bin/docs-list`.
- If repo has `docs/`, open it. Follow `read_when` hints first until domain clear.
- Research early. Quote exact errors. Prefer 2024-2026 sources.
- Keep notes short. Add `read_when` hints for cross-cutting docs.
- Learned docs: evergreen only. Keep rationale, pitfalls, failure modes, architecture decisions. No transient changelog. No secrets, sensitive URLs, personal data.
- If repo says `no docs`, respect repo rule. Else behavior/API change -> update docs before ship.
- Before handoff: run full available gate: lint, typecheck, tests, docs if repo has docs step.
- CI red -> `gh run list` / `gh run view`, rerun, fix, repeat till green.
- Keep work observable: logs, panes, tails, MCP/browser tools.
- Release -> read `docs/RELEASING.md`; if missing, find best checklist.

## Git
- Safe default: `git status` / `git diff` / `git log`. Push only when user asks. Branch changes need consent.
- Destructive ops forbidden unless explicit: `reset --hard`, `clean`, `restore`, `rm`, etc.
- Remotes under `~/Projects` -> prefer HTTPS. Commit helper on PATH: `committer`.
- No amend unless asked. No repo-wide search/replace scripts. Keep edits small/reviewable.
- Do not delete/rename unexpected files. Stop + ask.
- Avoid manual `git stash`. Auto-stash from git pull/rebase OK. If user types command like `pull and push`, that counts as consent.
- Multi-agent work -> check `git status` / `git diff` before edits.


<frontend_aesthetics>
Avoid AI-slop UI. Be opinionated, distinctive.
Do:
- Typography: pick real font. Avoid Inter/Roboto/Arial/system defaults.
- Theme: commit to palette. Use CSS vars. Bold accents > timid gradients.
- Motion: use 1-2 high-impact moments, not random micro-anim.
- Background: add depth with gradients/patterns/shapes, not flat default.
Avoid: purple-on-white clichés, generic grids, predictable layouts.
</frontend_aesthetics>
