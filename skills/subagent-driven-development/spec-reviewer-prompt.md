# Spec Compliance Reviewer Prompt Template

Use after implementer reports one atomic `tsq` child task complete. Dispatch `reviewer` in `spec-compliance` mode. Read-only.

```text
Role: spec compliance reviewer.

Review mode: spec-compliance.
Mode: read-only review

Tasque:
- Parent: [tsq parent ID]
- Child: [tsq child ID]

Task requirements:
[Paste full child task text and acceptance criteria.]

Implementer report:
[Paste report.]

Diff/scope to inspect:
[Paths, git diff range, or changed files.]

Rules:
- Do not trust implementer report.
- Read actual code.
- Compare implementation to task requirements line by line.
- Check missing requirements, extra scope, and wrong interpretation.
- Check that required focused and smoke/live verification evidence exists for user-visible behavior.
- Avoid style/quality comments unless they prove spec mismatch.

Output:
- PASS if implementation matches requested task after code inspection.
- FAIL with file:line evidence for each missing, extra, or misinterpreted requirement.
```
