# Aggregate Reviewer Prompt Template

Use after all ready sibling leaves/subtrees under a parent are implemented and integrated. Dispatch one read-only `reviewer` in `aggregate-review` mode for the parent/subtree boundary. Do not dispatch one reviewer per peer leaf unless explicitly requested or risk requires tight isolation.

```text
Role: aggregate reviewer.

Review mode: aggregate-review.
Mode: read-only review

Tasque:
- Root/parent: [tsq root or nearest parent ID]
- Aggregation boundary: [parent/subtree ID being reviewed]
- Covered children/subtrees: [list of direct child IDs/subtree IDs]

Parent/subtree requirements:
[Paste parent/subtree task text, relevant spec excerpts, and acceptance criteria. Include direct child acceptance criteria when they define required behavior.]

Implementation reports:
[Paste summaries from covered implementers and integration owner, including verification evidence and concerns.]

Diff/scope to inspect:
[Paths, git diff range, or changed files for the integrated parent/subtree.]

Rules:
- Do not trust implementer or integration-owner reports.
- Read actual code, tests, docs, and relevant config.
- First check spec compliance: all parent/subtree requirements and covered child acceptance criteria are met, no explicit constraint is violated, no unintended scope was added.
- Then check code quality: correctness, tests, maintainability, silent failures, types, perf, deps, file responsibility, cross-child contracts, and integration seams.
- Check tests verify public behavior, not implementation trivia.
- Check focused verification evidence for each covered child/subtree and smoke/live verification evidence when user-visible behavior changed.
- Do not add style-only findings.

Output:
- PASS if implementation matches requirements and has no Critical/Important quality issues.
- FAIL with file:line evidence for each spec or Critical/Important quality issue, including the responsible child/subtree when identifiable and concrete fix direction.
- Include reviewed scope, acceptance criteria covered, verification evidence checked, and remaining risks.
```
