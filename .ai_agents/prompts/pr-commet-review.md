---
name: Review-PR-Comments
description: Review unresolved PR comments, validate them, implement fixes, and reply. Use subagents when available.
arguments:
  - name: PR_NUMBER
    type: string
---

# Capability check
- If your runtime supports subagents or a Task tool (for example, Claude Code), use them.
- If subagents are available, delegate git and GitHub operations to a git-workflow subagent.
- If subagents are not available (for example, Codex CLI), do the work yourself sequentially and follow the git-workflow skill.
- If repo or PR access is missing or ambiguous, ask for the repo or required permissions before proceeding.
- Lean heavily on subagents for independent tasks like validation, investigation, and implementation when possible.
- Make sure that we're on the PR branch and up to date before addressing comments. If we're not on the PR branch, switch to it safely using git-workflow skills.
- Get comments from `claude`, `codex`, or `codex-cli` on the PR, since sometimes they don't have resolved status but still need addressing.
---

Relevant skills: `git-workflow`, `programming`, `issue-investig8tor`, `systematic-debugging`, `test-driven-development`, `subagent-driven-development`, `dispatching-parallel-agents`.
Read only what you need. Prefer repo-local skills in `.ai_agents/skills/` when present; otherwise use the runtime skill registry (often `~/.claude/skills/`).

## Process
0. Spin up a subagent to fetch and normalize PR comments (and child comments, sometimes AI coding review agents leave several child comments in response to a parent comment). Agent response should be a structured list of comments with severity, id, file or line, author, comment details body, and thread link.
0.5. use the graphql api to fetch all unresolved review threads and comments for the PR, including replies. Distinguish resolved vs unresolved threads.
1. Collect unresolved PR review threads and comments for PR $PR_NUMBER, including replies. Use GitHub CLI or API so you can distinguish resolved vs unresolved threads.
2. Normalize the comments into a list with id, file or line, author, comment body, and thread link.
3. Validate each comment against current code and tests. Classify each as valid, invalid, or needs-info with evidence.
4. For valid comments, group by area and sort by severity (critical to low). If subagents are available, parallelize investigation only when tasks are independent. Implement fixes sequentially using strict TDD; follow subagent-driven-development for implementation and reviews. If a fix is large or risky, ask the user before implementing.
5. Run relevant tests and record commands and results.
6. Respond in the PR:
   - Valid: explain what changed and reference commit or code location.
   - Invalid: explain why, with evidence.
   - Needs-info: ask targeted questions.
7. Resolve a thread only after posting a reply or if we have addressed the concern expressed in the comment or deemed it resolved/invalid; if you cannot post, provide draft replies and leave unresolved.

## Output format
- Comments fetched: count and brief list
- Validation results: valid, invalid, needs-info
- Changes made: files and rationale
- Tests: commands and outcomes
- PR replies: posted or draft text
- Follow-ups or risks

