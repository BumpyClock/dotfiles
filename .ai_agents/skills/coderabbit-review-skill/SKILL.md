---
name: coderabbit-review-skill
description: Run a codereview using coderabbit cli and review the output.
---

# CodeRabbit Review

Run the command `coderabbit --prompt-only > .ai_agents/coderabbit_output.txt` and wait for it to finish (it may take a while). If it's slow, run it in the background and keep working. Give it a timeout of up to 5 minutes since it can take a while on large codebases.

Redirect its output to a file, e.g., `coderabbit --prompt-only > .ai_agents/coderabbit_output.txt`. Read the file once the command completes. If the file already exists, delete it first to avoid confusion.

the coderabbit cli is installed and available in PATH.

## Workflow

1. **Collect and triage comments**
   - Collect ALL CodeRabbit comments and de-duplicate them
    - The output will contain **multiple prompts**, each already in this shape:

       ============================================================================
       File: <path>
       Line: <line number or range>
       Type: <critical|major|potential_issue|refactor_suggestion|nitpick|...>

       Prompt for AI Agent:
       <one paragraph, specific instruction>
       ============================================================================

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

## Optional arguments

ultrathink
