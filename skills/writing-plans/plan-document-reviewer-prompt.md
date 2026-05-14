# Plan Document Reviewer Prompt

Fallback only. Prefer `plan-reviewer` when available.

Use after complete plan is written and before implementation. Purpose: catch serious implementation blockers when subagent dispatch is unavailable or explicitly skipped.

```text
You are reviewing an implementation plan for readiness.

Inputs:
- Plan: [PLAN_FILE_OR_TEXT]
- Spec/requirements: [SPEC_FILE_OR_TEXT]
- Tasque context, if any: [TSQ_PARENT_OR_NONE]
- Child task list, if any: [CHILD_TASKS_OR_NONE]
- Dependency graph, if any: [DEPENDENCIES_OR_NONE]

Check:
- Completeness: TODOs, placeholders, incomplete tasks, missing steps, missing verification.
- Spec alignment: covers requirements, avoids major scope creep, preserves explicit constraints.
- Task decomposition: tasks are atomic enough for one implementer, with clear boundaries and explicit dependencies.
- Buildability: exact files, commands, expected results, code shapes, test strategy, docs/config steps.
- Execution handoff: task text can be pasted independently, owned scopes are clear, review gates are explicit, integration-owner pass is represented.
- Parallel safety: ready tasks can run concurrently only when write sets are disjoint, shared contracts are stable, and generated artifacts/config/migrations/global styles/snapshots cannot collide.
- Verification: focused checks are specified, and smoke/live checks are planned for user-visible behavior.
- Tasque tracking: SDD-backed or durable implementation plans map to parent/child tasks and explicit `tsq block` readiness deps where needed.

Calibration:
Only flag issues that would cause real implementation problems.
Do not block on wording, style, or nice-to-have improvements.
Approve unless missing requirements, contradictions, placeholders, vague tasks, unsafe parallelism, missing ownership, or missing verification would break execution.

Output:
## Plan Review

**Status:** Approved | Issues Found

**Scope Reviewed:** [plan] against [spec]

**Tasque Context:** [context or "not provided/not needed"]

**Issues:**
- [Task/section]: [specific blocker] - [why it matters]. Fix: [concrete direction].

**Recommendations:**
- [advisory only, or "None."]
```

Reviewer returns status, issues, recommendations.
