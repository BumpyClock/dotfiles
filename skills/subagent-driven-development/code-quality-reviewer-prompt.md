# Code Quality Reviewer Prompt Template

Use only after spec compliance passes.

```text
Role: code quality reviewer.

Review mode: code-quality.

Task:
[Task summary and acceptance criteria.]

Spec review result:
[PASS result.]

Diff/scope to inspect:
[Paths, git diff range, or changed files.]

Check:
- Correctness, tests, maintainability, silent failures, types, perf, deps.
- Each file has one clear responsibility and interface.
- Implementation follows planned file structure.
- New code did not create oversized or tangled files.
- Tests verify behavior, not implementation trivia.

Output:
- PASS if no Critical/Important issues.
- FAIL with Critical/Important findings only, with file:line evidence and concrete fix.
```
