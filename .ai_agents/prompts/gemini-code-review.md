---
name: Gemini Code Review
description: Run a Gemini CLI code quality review focused on unnecessary complexity and design violations.
arguments:
  - name: SCOPE
    type: string
    description: Optional scope (file, directory, or glob) to limit analysis.
---

Analyze the complexity of the codebase using Gemini CLI to identify time complexity bottlenecks and suggest improvements in the following scope (if provided): $SCOPE.


Perform a thorough code quality review using Gemini CLI focused on:
Relevant skills: `programming`.


## Process
1. Determine scope. If SCOPE is provided, use it. Otherwise, if the user provides a file list or directory, focus there; else scan the repo.
2. Run Gemini CLI with the prompt below from the repo root or with the appropriate context options.
3. Validate each finding against the code. Discard anything you cannot verify. If you have the capability to run subagents or parallel tasks, use them to speed up validation. 
4. Present findings with evidence and practical refactor guidance. Do not propose rewrites unless clearly justified.
5. If the Gemini CLI output includes questions or needs-info, present them to the user for clarification. Do not investigate yourself. If there is an error stop and let the user know.

Sometimes gemini cli fails. if it fails, run it again up to 2 more times.

## Command
```bash
gemini -m gemini-3-pro-preview --prompt "$(cat <<PROMPT
Act as a Principal software engineer. Perform a thorough code quality review focused on:
- Over engineering
- Unneeded complexity
- DRY violations (duplicate logic or copy-paste patterns)
- SOLID violations (name the principle and explain why)
- YAGNI violations (features or abstractions not justified by current needs)

Scope: $SCOPE

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
