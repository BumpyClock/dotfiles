# Code Quality Reviewer Prompt Template

Use only after spec-compliance passes. Dispatch `reviewer` in `code-quality` mode. Read-only.

```text
Role: code quality reviewer.

Review mode: code-quality.
Mode: read-only review

Tasque:
- Parent: [tsq parent ID]
- Child: [tsq child ID]

Full child task payload:
[Paste full child task text from tsq/plan, including owned scope, forbidden scope, dependencies, acceptance criteria, focused checks, and smoke/live verification requirements.]

Spec review result:
[PASS result.]

Implementer report:
[Paste report.]

Diff/scope to inspect:
[Paths, git diff range, or changed files.]

Rules:
- Apply `agent-templates/reviewer.md` code-quality criteria.
- Check correctness, tests, maintainability, silent failures, types, perf, deps.
- Check each file has one clear responsibility and interface.
- Check implementation follows planned file structure and owned scope.
- Check new code did not create oversized or tangled files.
- Check tests verify behavior, not implementation trivia.
- Check smoke/live verification evidence when user-visible behavior changed.
- Do not add style-only findings.

Output:
- PASS if no Critical/Important issues.
- FAIL with Critical/Important findings only, with file:line evidence and concrete fix.
```
