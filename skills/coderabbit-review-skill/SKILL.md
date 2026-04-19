---
name: coderabbit-review-skill
description: Run a codereview using coderabbit cli and review the output.
---

# CodeRabbit Review

Run `coderabbit review --agent`, wait for finish (may take a while). Slow → run background, keep working. Timeout up to 5 min for large codebases.

## CLI help
coderabbit review --help
Usage: coderabbit review [options]

AI-driven code review for the current git repository

Options:
  -V, --version            output the version number
  --plain                  Output in plain text format (non-interactive, default)
  --interactive            Start in interactive mode
  --prompt-only            Show only AI agent prompts
  --agent                  Emit structured findings for agent workflows
  -t, --type <type>        Review type: all, committed, uncommitted (default: "all")
  -f, --files <files...>   Review only the specified files
  -c, --config <files...>  Additional instructions for CodeRabbit AI (e.g., claude.md, coderabbit.yaml)
  --base <branch>          Base branch for comparison
  --base-commit <commit>   Base commit on current branch for comparison
  --dir <path>             Review only git changes inside this directory
  --no-color               Disable colored output
  --api-key <key>          API key for authentication
  -h, --help               display help for command

Examples:
  coderabbit review                           # Plain-text review of all local changes
  coderabbit review --agent                   # Emit structured findings for agents
  coderabbit review --interactive             # Full-screen terminal review UI
  coderabbit review --base main               # Compare current branch against main
  coderabbit review --type committed          # Review only committed changes
  coderabbit review --files src/index.ts      # Review only selected files
  coderabbit review --dir /path/to/repo       # Review only git changes inside that directory
  coderabbit review --prompt-only             # Print agent prompts only

Notes:
  Plain text is the default review mode.
  --interactive does not support API key authentication.
  Use coderabbit auth login --agent for agent-driven OAuth login.

## Workflow

1. **Collect + triage comments**
   - Collect ALL CodeRabbit comments, dedupe
   - Output contains **multiple prompts**, each already shaped:
   - Prioritize by `Type`:
     - **Handle ALL non-nitpick first.** Highest severity → down.
        - First: `critical`, `major`, `potential_issue`, `refactor_suggestion` (+ similar non-nitpick).
     - **Only when zero non-nitpick remain** → process `nitpick`.
     - Non-nitpick exists → **ignore nitpicks** (no impl, no bikeshed).
   - Triage each:
     - (a) valid + actionable
     - (b) valid but out-of-scope
     - (c) invalid/incorrect
     - (d) needs more info

2. **Validate w/ parallel sub-agents**
   - Per major comment/theme → spawn sub-agent. Find repo evidence (paths, symbols, snippets)
   - Sub-agent returns: verdict (valid/invalid), reasoning, exact location(s), minimal fix

3. **Produce validated findings**
   - Valid: category (bug/security/perf/style/test/docs), impacted files, risk, proposed fix
   - Invalid: brief why + repo evidence

4. **Implement fixes — valid + actionable**
   - Parallel sub-agents for independent groups (no file overlap)
   - Minimal changes; no unrelated refactor
   - Update/add tests when behavior changes

5. **Verify**
   - Narrowest tests first → broader if available
   - Format/lint on changed areas only if feasible

6. **Final output**
   - Validated comments list (valid/invalid/out-of-scope) + evidence
   - Changes by file (what/why)
   - Commands run + results (tests/lint/format)
   - Remaining items + next steps

## Constraints

- No "fixing" speculative issues w/o repo evidence
- Ambiguous fix → propose 1-2 options, user picks safest
- Blocked by missing context / conflicting reqs → stop + ask
- **Time budget**: highest-risk first
- **Scope limit**: only relevant files unless correctness demands
- **Risk tolerance**: smallest safe change; avoid API changes
- **Test strategy**: specify preferred cmds + fallbacks
- **Parallelism**: up to 4 sub-agents; no file overlap
- Run format + linters → meet code quality standards
