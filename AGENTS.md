<behavior>
- Be direct and push back when you disagree; if my approach has problems, say so.
- When unsure about something, say you're unsure rather than guessing confidently.
- When something fails, investigate the root cause before retrying.
- Keep diffs scoped to the task: no drive-by reformats or unrelated refactors.
</behavior>


# Agent protocols

- Contact: Aditya Sharma (`@bumpyclock` / `adityaksharma@gmail.com` personal) (`adityasharma_microsoft` / `adityasharma@microsoft.com` work).
- Workspace: `~/Projects`.
- BumpyClock repos -> personal acct. Work repos -> work acct. Missing BumpyClock repo -> `git clone https://github.com/BumpyClock/<repo>.git`.
- Non-BumpyClock OSS -> `~/Projects/oss`.
- Hosts `framed` / `adityas-macbook-pro` -> SSH direct. Other hosts -> `tailscale status`.
- Put files in repo or `~/Projects/dotfiles`.
- Read `~/Projects/dotfiles/tools.md`.

<workflow>
- Use `tasque` (as needed) + in-session task/todo tools. Use `tsq` for long-horizon work, in-session task/todo tools for in-session tracking. Update tsq status as you claim, complete, or abandon tasks.
- Default mode: delegate. Main agent owns user comms, scope, plan, architecture decisions, contracts, and final evidence report.
- Research, code edits, debugging, docs, tests, reviews -> subagents by default. Parallelize independent work. Speed > token efficiency.
- Main agent may work locally for tiny tasks, urgent critical-path blockers, verification, or when delegation adds delay/conflict. 
- Subagents need owned scope + full context: task, why, files/modules, contracts, constraints, acceptance criteria, tests, deliverable format.
- PRs: use `gh pr view` / `gh pr diff`; no browser URLs. Use `gh auth switch` if acct mismatch.
- `Make note` -> use repo learned-doc convention. Prefer `docs/learned/<topic>.md` or `docs/learned/LEARNINGS.md`. If repo uses root `LEARNINGS.md`, follow. Keep learned docs evergreen: rationale, pitfalls, failure modes, architecture decisions. No transient changelog, secrets, sensitive URLs, or personal data. If repo says `no docs`, skip.
- Requested deletes -> trash. Unexpected deletes/renames -> stop + ask.
- Need upstream file -> stage in `/tmp/`, cherry-pick. Never overwrite tracked files.
- Keep files <= ~500 LOC. Split/refactor when needed. Big file -> create tracking task.
- Commits: Conventional Commits `feat|fix|refactor|build|ci|chore|docs|style|perf|test`.
- Prefer maintained libs/framework features over custom code when complexity drops. Check maintenance, adoption, docs, license, fit. New deps -> quick health check. Several good options -> propose 2-3 + rec.
- Use inherent knowledge for stable facts. Use `web_search` / `web_fetch` for current, latest, high-risk, or uncertain info.
</workflow>

## PR feedback

- Comments: `gh pr view` + `gh api .../comments --paginate`.
- Replies: cite fix + file/line. Resolve threads after fix lands.
- Merge contributor PR -> thank contributor in `CHANGELOG.md`.

## Docs / build / test

- Before coding: if repo has docs-list cmd, run it. Prefer `docs-list`, else `docs:list`, else `bin/docs-list`.
- If repo has `docs/`, open it. Follow `read_when` hints first until domain clear.
- Research early when info may be stale. Quote exact errors. Prefer 2024-2026 sources.
- Keep notes short. Add `read_when` hints for cross-cutting docs.
- If repo says `no docs`, respect repo rule. Else behavior/API change -> update docs before ship.
- Before handoff: run full available gate from success criteria: lint, typecheck, tests, docs step if present.
- CI red -> `gh run list` / `gh run view`; rerun, fix, repeat till green.
- Keep work observable: logs, panes, tails, MCP/browser tools.
- Release -> read `docs/RELEASING.md`; if missing, find best checklist.

## Git

- Safe default: `git status` / `git diff` / `git log`. Push only when user asks. Branch changes need consent.
- Destructive ops forbidden unless explicit: `reset --hard`, `clean`, `restore`, `rm`, etc.
- Remotes under `~/Projects` -> prefer HTTPS. Commit helper on PATH: `committer`.
- No amend unless asked. No repo-wide search/replace scripts. Keep edits small/reviewable.
- Avoid manual `git stash`. Auto-stash from git pull/rebase OK. If user types command like `pull and push`, that counts as consent.
- Multi-agent work -> check `git status` / `git diff` before edits.

<frontend_aesthetics>
Avoid AI-slop UI. Be opinionated, distinctive. use `ux-designer` skill.
</frontend_aesthetics>
