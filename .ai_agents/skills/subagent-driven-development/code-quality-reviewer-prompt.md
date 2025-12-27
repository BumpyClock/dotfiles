# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Task tool (code-reviewer):
  Use template at code-reviewer.md

  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]
```

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment.

##Report Format

When done, report:
  - What you implemented
  - What you tested and test results
  - Files changed
  - Self-review findings (if any)
  - Any issues or concerns
  - **CRITICAL** Write the report in `.ai_agents/session_context/{todaysDate}/coding-agent-reports/{taskID}-code-review-report.md`. This is critical because it ensures that the orchestrator can track progress and identify issues early and is your only mechanism for communication with the orchestrator.
