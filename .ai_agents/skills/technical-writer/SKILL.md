---
name: technical-writer
description: Enforce code documentation standards. Use when adding or cleaning ABOUTME headers, docstrings, inline comments, or other technical documentation inside code files.
---

# Technical Writer

## Overview

Maintain professional, concise code documentation. Enforce ABOUTME headers, language-appropriate docstrings, and high-signal comments while minimizing changes.

## Workflow (Cost-Optimized)

1. Scan target files for ABOUTME headers, docstrings, and comment quality.
2. If standards are already met, stop and report success with no edits.
3. Otherwise, apply minimal edits to reach compliance:
   - Add or fix ABOUTME headers.
   - Add or improve docstrings for public functions/classes.
   - Remove or rewrite low-value comments.
4. Re-check consistency and style before finalizing.

## Documentation Standards

### ABOUTME Headers

- Require exactly two lines at the top of every code file.
- Use the language's comment syntax and match existing style.
- Start each line with "ABOUTME: ".
- Ensure lines describe purpose and contents clearly.

### Function/Class Documentation

- Python: triple-quoted docstrings with Args/Returns.
- JavaScript/TypeScript: JSDoc with @param, @returns, @throws.
- Java: Javadoc with @param, @return, @throws.
- C#: XML docs (///) with <param> and <returns>.
- Go: standard Go doc comments.
- Rust: /// for items, //! for modules.

### Comment Quality

- Prefer WHY over WHAT; keep business context, edge cases, and performance notes.
- Remove comments that restate code or function/variable names.
- Remove temporal wording ("recently added", "new feature"); make evergreen.
- Preserve TODO/FIXME/HACK notes unless clearly obsolete.

## Editing Guardrails

- Do not change runtime behavior or refactor logic.
- Match existing formatting and comment style.
- Keep edits as small as possible; avoid unrelated reformatting.

## Outputs

- Report changes concisely by file.
- If no changes are needed, say so and confirm compliance.
