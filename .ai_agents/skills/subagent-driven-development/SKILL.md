---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session, orchestrating per-task implementer/reviewer subagents via .ai_agents/prompts/orchestrate.md.
---

# Subagent-Driven Development

Execute plans with a fresh subagent per task and one combined spec+quality review after each.

**Core principle:** Fresh subagent per task + combined review = fast, high quality.

Codex-specific guidelines are in `references/codex-specific-instructions.md`. If you're codex or codex-cli, read that file.

## Model Selection

Choose the cheapest model that is likely to succeed before spawning the implementer.

- **Simple** (single-file edits, small configs, doc tweaks): `claude-zai --dangerously-skip-permissions -p <prompt>`
- **Medium** (multi-file changes, new tests): `claude --dangerously-skip-permissions --model claude-sonnet-4-5 -p <prompt>`
- **Complex** (new features, cross-cutting changes, refactors, tricky debugging): `claude --dangerously-skip-permissions --model claude-opus-4-5 -p <prompt>`
- **Reviews** (combined reviewer, final reviewer): `codex --yolo -m gpt-5.2-codex exec <prompt>` or `codex review`

## Rules (Tight)

- Use only when: plan exists, tasks mostly independent, and you will stay in this session.
- If no plan: use dispatching-parallel-agents for independent investigations, otherwise manual execution; use executing-plans for a parallel session.
- One implementer subagent per task; do not reuse across tasks.
- Provide full task text and context; never make subagents read the plan file.
- Subagents must follow `programming` (TDD) for any code changes.
- Every task gets a combined spec+quality review with full context (requirements, acceptance criteria, plan/spec context, implementer report, base/head SHAs, diff/changed files, test results).
- Review loop until approved; stop and report failure after 10 iterations.
- Parallelize only when tasks are independent and file scopes do not overlap.
- After all tasks: final reviewer + `superpowers:finishing-a-development-branch`.

## The Process

- Load orchestrator prompt: `.ai_agents/prompts/orchestrate.md`.
- Read the plan once; extract all tasks with full text and context; create TodoWrite.
- For each task: create a decision-complete prompt file in `.ai_agents/session_context/{todaysdate}/coding-agent-prompts/` using `./implementer-prompt.md`.
- For each task: spawn an implementer subagent (Model Selection). If it asks questions, answer and update the prompt, then re-run.
- For each task: implementer implements, tests, commits, self-reviews, and writes summary to `.ai_agents/session_context/{todaysdate}/task-{taskid}.md`.
- For each task: create a reviewer prompt from `./reviewer-prompt.md` with requirements, acceptance criteria, plan/spec context, implementer report, base/head SHAs, diff or changed files, and test results; dispatch reviewer.
- If review fails: implementer fixes, reviewer re-reviews; stop and report failure after 10 loops.
- Confirm summary file and mark task complete.
- After all tasks: dispatch final code reviewer for entire implementation and run `superpowers:finishing-a-development-branch`.

## Prompt Templates

- `./implementer-prompt.md` - Implementer subagent
- `./reviewer-prompt.md` - Combined spec compliance + code quality reviewer subagent

## Orchestrator Prompt (Required)

Treat the implementer subagent as the coding agent in that loop, and use the combined reviewer prompt.

**Do:**
- Run tasks in parallel only when independent and file scopes do not overlap.
- Select implementer model per task complexity and allow a long timeout (~30 minutes).
- Provide reviewers full context (requirements, acceptance criteria, plan/spec context, implementer report, base/head SHAs, diff/changed files, test results).
- Re-prompt and re-run when the implementer drifts or misses requirements.
- Require summary files in `.ai_agents/session_context/{todaysdate}/task-{taskid}.md` and keep TodoWrite up to date.

**Stop condition:**
- If the agent fails to meet requirements after 10 iterations, stop the loop and report failure.

## References

- `references/example-workflow.md` - Full end-to-end example with orchestration loop and reviews
- `references/dot-graphs.md` - Optional DOT graphs (when-to-use + process)
- `references/guardrails.md` - Advantages, red flags, and operational notes
