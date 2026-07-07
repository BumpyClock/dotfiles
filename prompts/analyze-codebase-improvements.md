---
description: "Analyze the codebase for high-value improvements using the code-review skill (audit mode)"
argument-hint: "[scope] [focus-areas] [nuclear]"
---

# Codebase Improvement Analysis

Invoke the `code-review` skill and follow it exactly. Analysis only; do not change code.

**Scope / Focus / Mode (optional):** "$ARGUMENTS"

- Parse arguments into scope (paths/globs/dirs), focus areas, and mode per the skill's Inputs section.
- Default: whole repo, focus `all`, mode `audit`.
- If arguments include `nuclear` (or `strict`/`thermo`), run the skill's nuclear mode.
- Use subagents for independent analysis passes when useful; shard by subsystem or concern per the skill's workflow.
- Report findings in the skill's output format for the chosen mode.

## Usage Examples

```text
/analyze-codebase-improvements
/analyze-codebase-improvements src architecture duplication
/analyze-codebase-improvements src time-complexity
/analyze-codebase-improvements prompts docs comments
/analyze-codebase-improvements tests deps
/analyze-codebase-improvements src nuclear
```
