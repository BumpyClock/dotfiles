---
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git blame:*), Bash(git show:*)
description: Code review local git changes (staged or unstaged)
---

Review local git changes using `git diff`.

**Usage:**
- `/local-review` - Review all uncommitted changes (staged + unstaged)
- `/local-review --staged` - Review only staged changes
- `/local-review HEAD~3` - Review changes since 3 commits ago
- `/local-review main` - Review changes compared to main branch

## Steps

1. **Get the diff** using the appropriate git command based on arguments:
   - Default: `git diff HEAD` (all uncommitted changes)
   - With `--staged`: `git diff --staged`
   - With ref: `git diff <ref>`

2. **Quick eligibility check** (Haiku agent): Is there anything meaningful to review? Skip if:
   - No changes
   - Only whitespace/formatting changes
   - Only auto-generated files (lockfiles, etc.)

3. **Find relevant CLAUDE.md files** (Haiku agent): List paths to any CLAUDE.md files in:
   - Repository root
   - Directories containing modified files

4. **Get change summary** (Haiku agent): View the diff and return a brief summary of what changed.

5. **Launch 4 parallel Sonnet review agents**, each returning issues with reasoning:

   a. **CLAUDE.md compliance**: Check changes against relevant CLAUDE.md rules.

   b. **Bug scan**: Shallow scan for obvious bugs in the diff. Focus on real issues, ignore nitpicks. Skip things linters/typecheckers catch.

   c. **Historical context**: Use `git blame` and `git log` on modified files to understand context. Flag issues that conflict with established patterns.

   d. **Code comments compliance**: Read comments in modified files. Ensure changes don't violate guidance in comments (TODOs, warnings, invariants).

6. **Score each issue** (parallel Haiku agents): For each issue from step 5, score confidence 0-100:
   - 0: False positive, doesn't hold up to scrutiny
   - 25: Might be real, couldn't verify, or stylistic without CLAUDE.md backing
   - 50: Verified real but minor/nitpick
   - 75: Verified important, will impact functionality or violates CLAUDE.md
   - 100: Definitely real, will happen frequently

7. **Filter**: Keep only issues scoring 75+.

8. **Output the review** in this format:

---

### Local Code Review

**Changes reviewed:** `<git diff command used>`

Found N issues:

1. **<description>** (Reason: <CLAUDE.md rule / bug / historical pattern / code comment>)

   File: `path/to/file.ts` lines X-Y
   ```
   <relevant code snippet>
   ```

2. ...

---

Or if no issues:

---

### Local Code Review

**Changes reviewed:** `<git diff command used>`

No significant issues found. Checked for bugs and CLAUDE.md compliance.

---

## False positives to ignore

- Pre-existing issues not introduced by these changes
- Things linters/typecheckers catch (imports, types, formatting)
- General quality issues unless CLAUDE.md requires them
- Issues explicitly silenced (lint-ignore comments)
- Intentional functionality changes
- Lines not modified in the diff
