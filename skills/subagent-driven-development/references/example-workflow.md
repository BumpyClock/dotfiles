# Example Workflow

Use this as a reference example when running the orchestration loop in `.ai_agents/prompts/orchestrate.md`.

```
You: I'm using Subagent-Driven Development to execute this plan.

[Load orchestrator prompt: .ai_agents/prompts/orchestrate.md]
[Read plan file once: docs/plans/feature-plan.md]
[Extract all 5 tasks with full text and context]
[Create TodoWrite with all tasks]
[Create .ai_agents/session_context/{todaysdate}/task-tracker.md and list tasks with status=planned]

Task 1: Hook installation script

[Get Task 1 text and context (already extracted)]
[Create prompt file in .ai_agents/coding-agent-prompts/ using ./implementer-prompt.md]
[Update task-tracker.md: Task 1 status=in_progress, add prompt link]
[Spawn implementer subagent with: claude --model claude-sonnet-4-5-20250929 -p <prompt>]

Implementer: "Before I begin - should the hook be installed at user or system level?"

You: "User level (~/.config/superpowers/hooks/)"

Implementer: "Got it. Implementing now..."
[Later] Implementer:
  - Implemented install-hook command
  - Added tests, 5/5 passing
  - Self-review: Found I missed --force flag, added it
  - Committed
  - Wrote summary to .ai_agents/session_context/{todaysdate}/task-1.md

[Create reviewer prompt file using ./reviewer-prompt.md with full requirements, acceptance criteria, implementer report, base/head SHAs, diff/changed files, and test results]
[Dispatch combined reviewer]
Reviewer: ✅ Spec compliant, code quality approved (Strengths: Good test coverage, clean. Issues: None.)

[Confirm summary file exists]
[Update task-tracker.md: Task 1 status=done, add report links]
[Mark Task 1 complete]

Task 2: Recovery modes

[Get Task 2 text and context (already extracted)]
[Create prompt file in .ai_agents/coding-agent-prompts/ using ./implementer-prompt.md]
[Spawn implementer subagent with: claude --model claude-sonnet-4-5-20250929 -p <prompt>]

Implementer: [No questions, proceeds]
Implementer:
  - Added verify/repair modes
  - 8/8 tests passing
  - Self-review: All good
  - Committed

[Create reviewer prompt file using ./reviewer-prompt.md with full requirements, acceptance criteria, implementer report, base/head SHAs, diff/changed files, and test results]
[Dispatch combined reviewer]
Reviewer: ❌ Issues:
  - Missing: Progress reporting (spec says "report every 100 items")
  - Extra: Added --json flag (not requested)
  - Quality (Important): Magic number (100)

[Implementer fixes issues]
Implementer: Removed --json flag, added progress reporting, extracted PROGRESS_INTERVAL constant

[Reviewer reviews again]
Reviewer: ✅ Spec compliant, code quality approved

[Confirm summary file exists]
[Update task-tracker.md: Task 2 status=done, add report links]
[Mark Task 2 complete]

...

[After all tasks]
[Dispatch final code-reviewer]
Final reviewer: All requirements met, ready to merge

Done!
```
