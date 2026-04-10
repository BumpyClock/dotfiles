---
name: coderabbit-review-skill
description: Run a codereview using coderabbit cli and review the output.
---

# CodeRabbit Review

Run the command `coderabbit review --agent` and wait for it to finish (it may take a while). If it's slow, run it in the background and keep working. Give it a timeout of up to 5 minutes since it can take a while on large codebases.

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

1. **Collect and triage comments**
   - Collect ALL CodeRabbit comments and de-duplicate them
    - The output will contain **multiple prompts**, each already in this shape:

    - Prioritize by `Type`:
       - **Handle ALL non-nitpick items first.** Start with highest severity and work down.
          - Focus first on: `critical`, `major`, `potential_issue`, `refactor_suggestion` (and similar non-nitpick types).
       - **Only after there are zero remaining non-nitpick items**, process `nitpick` items.
       - If any non-nitpick items exist, **ignore nitpicks for now** (do not implement, do not bikeshed).
   - Triage each comment into:
     - (a) valid + actionable
     - (b) valid but out-of-scope
     - (c) invalid/incorrect
     - (d) needs more info

2. **Validate comments with parallel sub-agents**
   - For each major comment/theme, spawn a sub-agent to find supporting evidence in the repo (file paths, symbols, concrete snippets)
   - Each sub-agent returns: verdict (valid/invalid), reasoning, exact location(s), and suggested minimal fix

3. **Produce validated findings list**
   - For each valid item: include category (bug/security/perf/style/test/docs), impacted files, risk, and proposed fix
   - For invalid items: briefly explain why, citing repo evidence

4. **Implement fixes for valid + actionable items**
   - Use parallel sub-agents for independent fix groups (don't overlap files)
   - Keep changes minimal; do not refactor unrelated code
   - Update tests or add new tests when behavior changes

5. **Verify**
   - Run the narrowest relevant tests first, then broader tests if available
   - Run format/lint only on changed areas if feasible

6. **Final output**
   - List of validated comments (valid/invalid/out-of-scope) with evidence
   - Summary of changes by file (what/why)
   - Commands run + results (tests/lint/format)
   - Any remaining items and recommended next steps

## Constraints

- Don't "fix" speculative issues without repo evidence
- If a fix is ambiguous, propose 1-2 options and let the user pick the safest default
- Stop and ask if blocked by missing context or conflicting requirements
- **Time budget**: prioritize highest-risk issues first
- **Scope limit**: Touch only relevant files unless required for correctness
- **Risk tolerance**: Prefer smallest safe change; avoid API changes
- **Test strategy**: Specify preferred commands and fallbacks
- **Parallelism**: Use up to 4 sub-agents; do not overlap files
- Run formatting and linters to ensure code quality standards are met
