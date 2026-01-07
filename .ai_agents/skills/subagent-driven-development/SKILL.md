---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session, orchestrating per-task implementer/reviewer subagents.
---

# Subagent-Driven Development

Act as an orchestrator: run coding agents, review their work, and loop until tasks are complete.

Codex-specific instructions are in `references/codex-specific-instructions.md`. If you're codex or codex-cli, read that file and follow it.

Claude-specific instructions are in `references/claude-specific-instructions.md`. If you're claude or claude-cli, read that file and follow it.

## Chain of Thought Process (Always Follow This)

### Step 1: Initial Analysis
- Identify the core goal
- List all components/subtasks needed
- Consider dependencies between tasks

### Step 2: Interface Definition
- Define clear interfaces for each component
- Specify expected inputs/outputs
- Document integration points

### Step 3: Evaluate Task Complexity
- If the task is too complex for one agent, break it down further
- Create a succinct dependency graph of tasks.
- Decide which tasks can be parallelized and which have dependencies on each other. 
- Plan the order of task execution based on dependencies.
- Start execution with independent tasks first and with dependencies so that dependent tasks can follow in parallel if possible.
- Spawn additional agents in parallel whenever possible

## Core Orchestration Loop

**Define work**
- Create a follow-up prompt for the task in.
- If the task is too big break it down into smaller sub-tasks that are manageable for the coding agent.
- Create a detailed and precise prompt for the coding agent using the prompt creation flow.
- Define clear interfaces, public signatures of functions so multiple agents can work in parallel reliably without guessing what public signatures are. This is critical when implementing backend and frontend work in parallel. You must define the interfaces and API surface and pass it to agents context.
- Save the prompt in `.ai_agents/session_context/{todaysdate}/{hour}/coding-agent-prompts/` and pass it to the coding agent using `cat`.
- Spawn the coding agent. It may run for a while without any output, so be patient.

**Review the work**
- Review the agent's work. If it looks good, continue with the next task.
- If it does not look good or drifts, create another prompt and call the coding agent again to fix the issue.
- The  coding agent will not have context of your previous prompt; include sufficient context and details.
- Stay in the review step until you are satisfied.
- If the agent cannot meet requirements after 10 steps, break the loop and report to the user.

**Post-task steps**
- Update your todo list and mark the task as completed. If you're following an external task list, update its completion status.
- Start the next task.
- Repeat until the delegated tasks are finished.

Remember: the agent has no context of this conversation, so prompts must include sufficient context and details.

## Prompt Creation Flow

- The coding agent is not great at making decisions; you must make decisions and be explicit.
- Read any needed and relevant code so you can decide on implementation details.
- Prompts must be detailed and precise so the coding agent can implement without clarifications.
- If the task is too big, break it into smaller sub-tasks and create a prompt for each.
- In the prompt, require the agent to include a summary of their work and files changed in `.ai_agents/session_context/{todaysdate}/{hour}/coding-agent-reports/task-{taskid}.md`.

## Agent Spawning Command

Use the task tool or bash tool to spawn agents:

```bash
claude --model claude-opus-4-5 -p "[Full context + Specific task + All interfaces + Dependencies]"
```

Set a long timeout since agents can take a while to complete tasks.
If needed, spin up multiple agents in parallel for truly independent tasks.
