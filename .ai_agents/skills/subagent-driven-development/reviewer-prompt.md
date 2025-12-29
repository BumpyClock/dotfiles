# Combined Spec + Code Quality Reviewer Prompt Template

Use this template when dispatching a combined reviewer subagent.

**Purpose:** Verify implementation matches requirements and is production-ready (spec compliance + code quality).

```
Task tool (code-reviewer):
  Use template at code-reviewer.md

  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: [FULL TEXT of task requirements + acceptance criteria + relevant plan/spec context]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary + key decisions]
  TEST_RESULTS: [commands + results]
  CHANGED_FILES: [list or diff summary]
  IMPLEMENTER_REPORT: [full report]

Additional instructions:
  You are reviewing spec compliance and code quality in one pass.

  CRITICAL: Do not trust the implementer report. Verify everything in code/diffs.

  Spec compliance checklist:
  - Compare implementation to requirements line by line.
  - Call out missing, extra, or misunderstood requirements.
  - Use file:line references for every issue.

  Output requirements:
  - Add a "Spec Compliance" section at the top with PASS (spec compliant) or FAIL (issues found).
  - List missing/extra/misunderstood requirements under that section.
  - Then complete the full code-reviewer.md output format (Strengths, Issues, Recommendations, Assessment).
  - If spec compliance fails, Assessment must be "No" or "With fixes".

  CRITICAL: Write the report in
  `ai_agents/session_context/{todaysdate}/{hour-based-folder-name}/coding-agent-reports/task-{taskid}-code-review-report.md`.
```
