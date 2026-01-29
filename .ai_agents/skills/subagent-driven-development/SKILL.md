---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session, orchestrating per-task implementer/reviewer subagents.
summary: "Multi-agent system directives and coordination rules. Master reference for agent behavior."
read_when:
  - Coordinating subagents or running tmux-based agent sessions.
---

# Subagent-Driven Development

Act as an orchestrator: run coding agents, review their work, and loop until tasks are complete.

Codex-specific instructions are in `./references/codex-specific-instructions.md`. Only read if you're codex or codex-cli, read that file and follow it.

Claude-specific instructions are in `./references/claude-specific-instructions.md`. Only read if you're claude or claude-cli, read that file and follow it.

## Persistent Task Tracker (Required)

Maintain a daily task tracker so progress survives compaction.

- Create (or append to) `.ai_agents/session_context/{todaysdate}/task-tracker.md`.
- Treat the tracker as the source of truth for task status and links.
- Update it after every state change (planned -> in_progress -> review -> done/blocked).
- After compaction or handoff, re-open the tracker first to restore state.

Minimum template:
```
# Task Tracker - {todaysdate}
Last updated: {timestamp}

## Task 1: <name>
Status: planned | in_progress | review | blocked | done
Owner: orchestrator | implementer | reviewer
Links:
- Prompt: .ai_agents/session_context/{todaysdate}/{hour}/coding-agent-prompts/task-1.md
- Implementer report: .ai_agents/session_context/{todaysdate}/{hour}/coding-agent-reports/task-1-report.md
- Reviewer report: .ai_agents/session_context/{todaysdate}/{hour}/coding-agent-reports/task-1-code-review-report.md
Notes:
- <short updates>
```

## Orchestration Planning Checklist (Always Follow This)

### Step 1: Initial Analysis
- Identify the core goal and success criteria.
- List all components/subtasks needed.
- Consider data flows and dependencies between tasks.
- Note test requirements and constraints.

### Step 2: Interface Definition (Parallelization Enabler)
- Define clear public interfaces/APIs before implementation.
- Specify expected inputs/outputs and behaviors.
- Document integration points and failure modes.
- Provide mock contracts so tasks can proceed independently.

### Step 3: Test Strategy
- Enumerate required unit, integration, and end-to-end tests.
- Require TDD for new behavior or bug fixes; skip only for mechanical edits and note why.
- If any test type seems "not applicable," request explicit user authorization before skipping.
- Plan which tests can be written in parallel with implementation.

### Step 4: Parallelization Plan
- If the task is too complex for one agent, break it down further.
- Create a succinct dependency graph of tasks.
- Decide which tasks can be parallelized and which have dependencies.
- Plan execution order based on dependencies (independent tasks first).
- Avoid parallel agents that touch the same files, configuration, or interfaces.
- Spawn additional agents in parallel whenever possible.

### Step 5: Integration Strategy
- Define integration points and order.
- Identify potential conflicts.
- Assign an integration task or agent.
- Plan final review and re-test after integration.

## Core Orchestration Loop

**Define work**
- Decide what must be delegated (implementation, testing, research) and keep architecture decisions in the orchestrator.
- Create a prompt for the task.
- If the task is too big break it down into smaller sub-tasks that are manageable for the coding agent.
- Create a detailed and precise prompt for the coding agent using the prompt creation flow.
- Define clear interfaces, public signatures of functions so multiple agents can work in parallel reliably without guessing what public signatures are. This is critical when implementing backend and frontend work in parallel. You must define the interfaces and API surface and pass it to agents context.
- Include test expectations (unit/integration/e2e) and TDD requirements in the prompt.
- Add or update the task entry in the daily task tracker before dispatching the agent.
- Save the prompt in `.ai_agents/session_context/{todaysdate}/{hour}/coding-agent-prompts/` and pass it to the coding agent using `cat`.
- Spawn the coding agent. It may run for a while without any output, so be patient.

**Review the work**
- Review the agent's work. If it looks good, continue with the next task.
- If it does not look good or drifts, create another prompt and call the coding agent again to fix the issue.
- The  coding agent will not have context of your previous prompt; include sufficient context and details.
- Stay in the review step until you are satisfied.
- If the agent cannot meet requirements after 10 steps, break the loop and report to the user.
- Do not accept missing test coverage unless the user explicitly authorized skipping it.
- Update the task tracker with review status and reviewer report links after each review.

**Post-task steps**
- Update your todo list and mark the task as completed. If you're following an external task list, update its completion status.
- Update the daily task tracker with final status, links, and a short outcome note.
- Start the next task.
- Repeat until the delegated tasks are finished.

Remember: the agent has no context of this conversation, so prompts must include sufficient context and details.

## Prompt Creation Flow

- The coding agent is not great at making decisions; you must make decisions and be explicit.
- Read any needed and relevant code so you can decide on implementation details.
- Prompts must be detailed and precise so the coding agent can implement without clarifications.
- If the task is too big, break it into smaller sub-tasks and create a prompt for each.
- Include interface definitions, mock strategy, and test plan (unit/integration/e2e).
- Call out TDD requirements and any explicit authorization to skip tests.
- In the prompt, require the agent to include a summary of their work and files changed in `.ai_agents/session_context/{todaysdate}/{hour}/coding-agent-reports/task-{taskid}.md`.

## Agent Spawning Command

Use the task tool or bash tool if needed to spawn the sub-agents.


Set a long timeout since agents can take a while to complete tasks.
If needed, spin up multiple agents in parallel for truly independent tasks.

## Claude Subagent Quickstart

### CLI Basics
- Launch long-running subagents inside tmux so the session can persist. Example:

  ```bash
  tmux new-session -d -s claude-haiku 'claude --model haiku'
  tmux attach -t claude-haiku
  ```

  Once inside the session, run `/model` to confirm the active alias (`haiku` maps to Claude 3.5 Haiku) and switch models if needed.
- Need to queue instructions without attaching? Use `bun scripts/agent-send.ts --session <name> -- "your command"` to inject text into a running agent session (single Enter is sent by default).
- Always switch to the fast Haiku model upfront (`claude --model haiku --dangerously-skip-permissions …` or `/model haiku` in-session) to keep turnaround fast.
- Two modes:
  - **One-shot tasks** (single summary, short answer): run `claude --model haiku --dangerously-skip-permissions --print …` in a tmux session, wait with `sleep 30`, then read the output buffer.
  - **Interactive tasks** (multi-file edits, iterative prompts): start `claude --model haiku --dangerously-skip-permissions` in tmux, send prompts with `tmux send-keys`, and capture completed responses with `tmux capture-pane`. Expect to sleep between turns so Haiku can finish before you scrape the pane.
- Ralph’s supervisor loop launches Claude the same way (`claude --dangerously-skip-permissions "<prompt>"`) to keep the tmux automation flowing.

### One-Shot Prompts
- The CLI accepts the prompt as a trailing argument in one-shot mode. Multi-line prompts can be piped: `echo "..." | claude --print`.
- Add `--output-format json` when you need structured fields (e.g., summary + bullets) for post-processing.
- Keep prompts explicit about reading full files: “Read docs/example.md in full and produce a 2–3 sentence summary covering all sections.”

### Bulk Markdown Conversion
- Produce the markdown inventory first (`pnpm run docs:list`) and feed batches of filenames to your Claude session.
- For each batch, issue a single instruction like “Rewrite these files with YAML front matter summaries, keep all other content verbatim.” Haiku can loop over multi-file edits when you provide the explicit list.
- After Claude reports success, diff each file locally (`git diff docs/<file>.md`) before moving to the next batch.

### Ralph Integration Notes
- Ralph (see `scripts/ralph.ts`) spins up tmux sessions, auto-wakes the worker, and calls Claude as the supervisor via `claude --dangerously-skip-permissions`.
- Supervisor responses must end with either `CONTINUE`, `SEND: <message>`, or `RESTART`; Ralph parses these tokens to decide the next action.
- To start Ralph manually: `bun scripts/ralph.ts start --goal "…" [--markdown path]`. Progress is tracked in `.ralph/progress.md` by default.
- Send ad-hoc instructions to the worker session with `bun scripts/ralph.ts send-to-worker -- "your guidance"`.

## References

- For examples of interface-first parallelization, see `./references/parallelization-examples.md`.
- For guardrails and red flags, see `./references/guardrails.md`.
- For an end-to-end orchestration example, see `./references/example-workflow.md`.
