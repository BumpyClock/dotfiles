---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session, orchestrating per-task implementer/reviewer subagents via .ai_agents/prompts/orchestrate.md.
---

# Subagent-Driven Development

Execute plans with a fresh subagent per task and one combined spec+quality review after each.

**Core principle:** Fresh subagent per task + combined review = fast, high quality.

Codex-specific guidelines are in `references/codex-specific-instructions.md`. If you're codex or codex-cli, read that file.

**IMPORTANT** Agents will take a while to write the code. Wait for the agent to finish do not prematurely stop it. If need to check if the agent is making changes, check the git diff or the changed files.

## Model Selection

Choose the right model that is likely to succeed before spawning the implementer. Cheapest is not always right cost model, since it may fail and require several retries. Consider task complexity:

- **Simple** (single-file edits, small configs, doc tweaks): `cz --dangerously-skip-permissions -p <prompt>`
- **Medium** (single-file changes, new tests, simple coding problems): `claude --dangerously-skip-permissions --model claude-sonnet-4-5 -p <prompt>`
- **Complex** (new features, cross-cutting changes, refactors, tricky debugging, medium complexity and higher problems): `claude --dangerously-skip-permissions --model claude-opus-4-5 -p <prompt>`
- **Reviews** (combined reviewer, final reviewer): `codex --yolo -m gpt-5.2-codex exec <prompt>` or `codex review`

## Rules (Tight)
- If in plan mode, develop the plan on how you would implement the given tasks using the rules below.
- Use only when: plan exists, tasks mostly independent, and you will stay in this session.
- If no plan: use dispatching-parallel-agents for independent investigations, otherwise manual execution; use executing-plans for a parallel session.
- One implementer subagent per task; do not reuse across tasks.
- Provide full task text and context; never make subagents read the plan file.
- Subagents must follow `programming` (TDD) for any code changes.
- Every task gets a combined spec+quality review with full context (requirements, acceptance criteria, plan/spec context, implementer report, base/head SHAs, diff/changed files, test results).
- Review loop until approved; stop and report failure after 10 iterations.

## Parallelization and Sequencing (Required)

1. Build a dependency map: for each task, list required decisions/outputs and touched files or modules.
2. Identify foundation tasks that unblock others (schema or public API changes, shared config, core abstractions, test harness work). Run these first, usually one at a time.
3. Create execution waves: tasks in the same wave can run in parallel; waves run in sequence.
4. Only parallelize within a wave when all are true:
   - No shared files or overlapping directories.
   - No shared interface/contract changes.
   - No shared build/test/config changes.
   - No need for results from another task to make decisions.
5. If any of the above is uncertain, default to sequential execution or merge tasks.
6. Order waves by dependency and risk: unblockers first, then leaf tasks, then integration and cleanup.

## The Process

- Read the plan once; extract all tasks with full text and context; create TodoWrite.
- Build a dependency map and execution waves (see Parallelization and Sequencing).
- For each wave: create decision-complete prompt files for the wave's tasks in `.ai_agents/session_context/{todaysdate}/{hour-based-folder-name}/coding-agent-prompts/` using `./implementer-prompt.md`.
- For each wave: spawn implementer subagents in parallel (Model Selection). If it asks questions, answer and update the prompt, then re-run.
- For each task: implementer implements, tests, commits, self-reviews, and writes summary to `.ai_agents/session_context/{todaysdate}/{hour-based-folder-name}/coding-agent-reports/task-{taskid}.md`.
- For each task: create a reviewer prompt from `./reviewer-prompt.md` with requirements, acceptance criteria, plan/spec context, implementer report, base/head SHAs, diff or changed files, and test results; dispatch reviewer.
- If review fails: implementer fixes, reviewer re-reviews; stop and report failure after 10 loops.
- Confirm summary file and mark task complete.
- After all waves: dispatch final code reviewer for entire implementation and run required tests (per the plan).

## Prompt Templates

- `./implementer-prompt.md` - Implementer subagent
- `./reviewer-prompt.md` - Combined spec compliance + code quality reviewer subagent

## Orchestrator Prompt (Required)

Treat the implementer subagent as the coding agent in that loop, and use the combined reviewer prompt.

**Do:**
- Follow Rules, Parallelization and Sequencing, and The Process.
- Use Model Selection and allow long timeouts (~30 minutes) when needed.
- Re-prompt and re-run when the implementer drifts or misses requirements.

## References

- `references/example-workflow.md` - Full end-to-end example with orchestration loop and reviews
- `references/dot-graphs.md` - Optional DOT graphs (when-to-use + process)
- `references/guardrails.md` - Advantages, red flags, and operational notes
