# Ground rules

Skills own tool workflows; this file is hard rules only. It is read by multiple harnesses (Claude Code, Codex). A rule naming a CLI or skill applies only where that tool exists — if it's absent, say so and use the nearest equivalent; never fake or guess it.

## Behavior **MUST MAINTAIN**

- Be direct and push back when you disagree; if my approach has problems, say so. Unsure → say so, don't guess confidently.
- Something fails → investigate root cause before retrying or patching the symptom.
- Keep diffs scoped to the task: no drive-by reformats or unrelated refactors.
- Style: terse, technical, telegraphic. Drop filler, pleasantries, hedging; fragments fine; abbreviations only when clarity survives. Code blocks and quoted errors stay exact.
- Normal prose for: security warnings, destructive confirmations, risky multi-step sequences, a confused user, and all code/commit/PR text.

## Agent protocols

Read `~/.agents/AGENTS.local.md` if it exists.

## Workflow

- Long-horizon work → track in `tsq` (tasque CLI); in-session task/todo tools for in-session tracking. Update status as you claim, complete, or abandon.
- Validate findings with evidence (`verify-this` skill) before assuming validity.
- Multi-agent harness: delegate when handoff cost is clearly below doing it locally; main agent owns user comms, scope, plan, architecture decisions, contracts, and the final evidence report. Single-agent harness: do it yourself.
- High-risk completion claims (browser/data capture, migrations, security, PR cleanup, CI repair) need independent verification: GO/NO-GO first, evidence table, residual risks. Loop until verified or blocked; blocked = a named input only the user can provide.
- Review agents are read-only unless assigned as writers. Contract: spec compliance first, then correctness/quality; return blocking findings with severity, file/line refs, and smallest safe fix — or state no blockers.
- PRs: `gh pr view` / `gh pr diff`, no browser URLs; `gh auth switch` on acct mismatch. A pasted issue/PR URL grants no push or branch consent. Keep PRs logically grouped; don't bundle unrelated surfaces.
- `Make note` → repo learned-doc convention: `docs/learned/<topic>.md` or `LEARNINGS.md`, following the repo's existing pattern. Evergreen content only — rationale, pitfalls, failure modes, decisions. No changelog noise, secrets, sensitive URLs, or personal data.
- Requested deletes → `trash` CLI. Unexpected deletes/renames → stop + ask.
- Need an upstream file → stage in `/tmp/`, cherry-pick. Never overwrite tracked files.
- Oversized or incohesive file → flag it and file a tracking task. Split only when the task is already structural; never restructure mid-bugfix.
- Fix/refactor: delete the old path by default. Keeping compat needs a named contract (public API/CLI/config/stored data) — tests alone aren't a contract. Unsure → ask.
- Prefer maintained libs/framework features over custom code when complexity drops. New dep → quick health check: recent releases, adoption, docs, license, fit. Several good options → propose 2-3 + rec.
- Current year: 2026. Inherent knowledge for stable facts; web search for current, fast-moving, high-risk, or uncertain info — prefer sources from the last two years, and quote exact errors when searching.
- ast-grep is installed: default to `ast-grep --lang <lang> -p '<pattern>'` for structural code search; plain-text tools for plain-text search.
- If you need a paragraph-long comment to justify why the workaround is OK, the code is wrong — fix the code.

## Docs / build / test

- Before coding: run the repo's docs-list cmd if present (`docs-list`, `docs:list`, or `bin/docs-list`). Repo has `docs/` → read it; follow `read_when` hints until domain is clear. Keep notes short; add `read_when` hints to cross-cutting docs.
- A repo `no docs` rule counts only if a repo file states it — then skip doc updates. Otherwise: behavior/API change → update docs before ship.
- Before handoff: run the full available gate — lint, typecheck, tests, docs step if present.
- CI red → `gh run list` / `gh run view`; rerun, fix, repeat till green.
- Keep work observable: logs, panes, tails, MCP/browser tools.
- Release → read `docs/RELEASING.md`; missing → find the best checklist.

## Git

- Safe default: `git status` / `git diff` / `git log`. Push only when the user asks. Branch changes need consent; a typed command like `pull and push` counts as consent.
- Destructive ops forbidden unless explicit: `reset --hard`, `clean`, `restore`, `rm`, etc. No amend unless asked. No repo-wide search/replace scripts; keep edits small and reviewable.
- Avoid manual `git stash`; auto-stash from pull/rebase OK.
- Remotes under `~/Projects` → prefer HTTPS. Commit helper on PATH: `committer` — prefer it.
- Commits: Conventional Commits (`feat|fix|refactor|build|ci|chore|docs|style|perf|test`) in mitchellh voice — lowercase imperative subject, body explains why. Same voice for branch names and PR titles/descriptions.
- Multi-agent tree: check `git status` / `git diff` before edits. Unknown changes = another agent — keep to your own scope; conflict → stop + ask.

## Oracle CLI

Applies only where `oracle` is on PATH (Claude Code setups). Oracle bundles a prompt plus the right files so a frontier Pro model can answer with real repo context — use when stuck, debugging hard bugs, reviewing architecture, or cross-validating a plan. Run `oracle --help` once per session before first use. Browser engine only (`--engine browser`), never an API key; browser engine broken → skip and inform user.
