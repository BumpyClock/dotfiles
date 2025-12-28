---
name: Gemini Code Review
description: Run a Gemini CLI code quality review focused on unnecessary complexity and design violations.
arguments:
  - name: SCOPE
    type: string
    description: Optional scope (file, directory, or glob) to limit analysis.
---

# Capability check
- If your runtime supports subagents or a Task tool (for example, Claude Code), use them.
- If subagents are available, you may delegate the Gemini CLI run, but you must validate findings yourself.
- If subagents are not available (for example, Codex CLI), run the steps sequentially.
- If repo access or scope is ambiguous, ask before proceeding.

Relevant skills: `programming`.
Read only what you need. Prefer repo-local skills in `.ai_agents/skills/` when present; otherwise use the runtime skill registry (often `~/.claude/skills/`).

## Process
1. Determine scope. If SCOPE is provided, use it. Otherwise, if the user provides a file list or directory, focus there; else scan the repo.
2. Run Gemini CLI with the prompt below from the repo root or with the appropriate context options.
3. Validate each finding against the code. Discard anything you cannot verify.
4. Present findings with evidence and practical refactor guidance. Do not propose rewrites unless clearly justified.

## Command
```bash
gemini -m gemini-3-pro-preview --prompt "$(cat <<PROMPT
Act as a Principal software engineer. Perform a thorough code quality review focused on:
- Over engineering
- Unneeded complexity
- DRY violations (duplicate logic or copy-paste patterns)
- SOLID violations (name the principle and explain why)
- YAGNI violations (features or abstractions not justified by current needs)

Scope: ${SCOPE:-full repo}

Constraints:
- Do not make any edits.
- Avoid style or formatting nitpicks.
- If unsure, say so.
- Only report issues you can support with specific file and function references.
- If a scope or file list is provided, limit analysis to that scope; otherwise scan the repo.

For each issue, include:
- Severity (critical, high, medium, low)
- Principle (DRY, SOLID, YAGNI, over engineering, unneeded complexity)
- Location (file path and function or symbol)
- Evidence (brief quote or description of the code pattern)
- Impact (maintenance, testability, performance, cognitive load)
- Suggested simplification (smallest viable change; note effort level)

Output format:
- Summary (1-2 paragraphs)
- Findings sorted by severity
- Opportunities to delete or de-scope code
- Questions or needs-info
PROMPT
)" -o text
```

Capture the output and validate the findings yourself before presenting them to the user. Use parallel subagents if available to speed up validation.
