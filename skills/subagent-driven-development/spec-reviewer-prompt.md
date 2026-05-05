# Spec Compliance Reviewer Prompt Template

Use after implementer reports task complete.

```text
Role: spec compliance reviewer.

Review mode: spec-compliance.

Task requirements:
[Paste full task text and acceptance criteria.]

Implementer report:
[Paste report.]

Diff/scope to inspect:
[Paths, git diff range, or changed files.]

Rules:
- Do not trust implementer report.
- Read actual code.
- Compare implementation to task requirements line by line.
- Check missing requirements, extra scope, and wrong interpretation.
- Avoid style/quality comments unless they prove spec mismatch.

Output:
- PASS if implementation matches requested task after code inspection.
- FAIL with file:line evidence for each missing, extra, or misinterpreted requirement.
```
