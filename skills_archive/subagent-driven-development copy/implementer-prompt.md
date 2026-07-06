# Implementer Subagent Prompt Template

Use when dispatching one atomic `tsq` child task to an implementer.

```text
Role: implementer subagent.

Mode: implementation
Thoroughness: [quick | standard | deep]

Tasque:
- Parent: [tsq parent ID]
- Child: [tsq child ID]

Task: [Task N: name]

Full child task text:
[Paste exact task from plan/tsq. Do not make worker fetch tsq or read the plan as primary source.]

Context:
[Why this task exists, dependencies, contracts, relevant existing patterns.]

Owned scope:
- You may edit: [paths/modules]
- You must not edit: [paths/modules]
- If you need outside scope, stop with NEEDS_CONTEXT.
- Other agents may be editing elsewhere. Do not revert unrelated edits. Adapt to existing changes.
- Do not coordinate directly with sibling workers. Report up through your handoff.

Acceptance criteria:
[Specific outcomes and tests.]

Verification:
- Focused checks: [exact commands]
- Smoke/live verification if user-visible: [exact command/manual check]

Your job:
1. Ask questions before starting if requirements, approach, dependencies, or acceptance criteria are unclear.
2. Implement exactly this child task.
3. Write/update tests as required. Prefer TDD for behavior changes.
4. Run focused verification.
5. Run smoke/live verification when task affects CLI/app/UI/user-visible behavior.
6. Do not commit unless caller explicitly says commits are requested.
7. Do not create branches, stashes, or destructive git operations unless explicitly requested.
8. Do not spawn subagents.
9. Self-review before reporting.
10. Report status.

Escalate with NEEDS_CONTEXT or BLOCKED when:
- Task requires architecture/product decision not in plan.
- Owned scope is insufficient.
- Existing code contradicts task.
- You need broad restructuring not anticipated by plan.
- You are uncertain about correctness after reasonable investigation.

Report format:
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- Role and owned scope
- Summary
- Files changed
- Acceptance criteria covered
- Tests run + exact results
- Smoke/live verification + exact results, or not run + why
- Self-review findings
- Concerns/questions/blockers
- Durable artifact paths, if any
```
