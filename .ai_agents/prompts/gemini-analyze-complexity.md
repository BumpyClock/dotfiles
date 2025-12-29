---
name: Gemini Analyze Complexity
description: Analyze the codebase for time complexity bottlenecks using Gemini CLI.
arguments:
  - name: SCOPE
    type: string
    description: Optional scope (file, directory, or glob) to limit analysis.
---

Analyze the complexity of the codebase using Gemini CLI to identify time complexity bottlenecks and suggest improvements in the following scope (if provided): $SCOPE.

## Process
1. Determine scope. If SCOPE is provided, use it. Otherwise, if the user provides a file list or directory, focus there; else scan the repo.
2. Run Gemini CLI with the prompt below from the repo root or with the appropriate context options.
3. Validate each reported bottleneck against the code. Discard anything you cannot verify.
4. Present findings with evidence and trade-offs. Do not propose unnecessary optimizations.

## Command
```bash
gemini -m gemini-3-pro-preview --prompt "$(cat <<PROMPT
Act as a senior software engineer. Analyze the provided code for time complexity (Big O).

Scope: $SCOPE

Goals:
- Identify current time complexity and the specific loops or operations that cause bottlenecks.
- Suggest a refactor that reduces Big O when feasible.
- Explain trade-offs: space usage, readability, and risk.

Constraints:
- Do not make any edits.
- If unsure, say so.
- Only report issues you can support with specific file and function references.
- If a scope or file list is provided, limit analysis to that scope; otherwise scan the repo.

Output format:
- Summary (1-2 paragraphs)
- Bottlenecks list (severity, file path, function or symbol, current Big O, reason, suggested improvement, trade-offs)
PROMPT
)" -o text
```

Capture the output and validate the findings yourself before presenting them to the user.
