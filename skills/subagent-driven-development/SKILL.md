---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session, orchestrating per-task implementer/reviewer subagents.
summary: "Multi-agent system directives and coordination rules. Master reference for agent behavior."
read_when:
  - Coordinating subagents or running tmux-based agent sessions.
---

# Subagent-Driven Development

Role: orchestrator. Run coding agents, review work, loop until complete.

- Pick right agent size. `developer-lite` for easy/medium. `developer` for hard.

## Persistent Task Tracker (Required)

Maintain daily task tracker; survives compaction.

- Use `tasque` for persistent task list.
- Each sub-agent: claim task, mark in progress.
- When done + reviewed + acceptable: mark done.
- If user tasks you to finish: get details from `tasque`.

## Orchestration Planning Checklist (Always Follow This)

### Step 1: Initial Analysis
- Identify core goal + success criteria.
- List components/subtasks.
- Consider data flows + dependencies.
- Note tests + constraints.

### Step 2: Interface Definition (Parallelization Enabler)
- Define public interfaces/APIs before implementation.
- Specify inputs/outputs/behaviors.
- Document integration points + failure modes.
- Provide mock contracts so tasks proceed independently.

### Step 3: Test Strategy
- Enumerate unit/integration/e2e tests.
- Require TDD for new behavior or bug fixes; skip only for mechanical edits and note why.
- If any test type "not applicable": request explicit user authorization before skipping.
- Plan tests that can be written in parallel.

### Step 4: Parallelization Plan
- If too complex for one agent: break down further.
- Create succinct dependency graph.
- Decide parallelizable vs dependent tasks.
- Plan order by dependencies (independent first).
- Avoid parallel agents touching same files/config/interfaces.
- Spawn additional agents in parallel whenever possible.

### Step 5: Integration Strategy
- Define integration points + order.
- Identify conflicts.
- Assign integration task/agent.
- Plan final review + re-test after integration.

## Core Orchestration Loop

**Define work**
- Decide what to delegate (impl/testing/research); keep architecture decisions in orchestrator.
- Create task prompt.
- If too big: split into smaller sub-tasks.
- Create detailed, precise prompt using prompt creation flow.
- Define clear interfaces/public function signatures for parallel work. Critical for backend+frontend parallelization. Pass API surface in context.
- Include test expectations (unit/integration/e2e) + TDD requirements.

**Review the work**
- Review agent output. If good: proceed.
- If not good or drifts: create new prompt, call agent to fix.
- Agent lacks previous prompt context; include sufficient context + details.
- Stay in review until satisfied.
- If agent cannot meet requirements after 10 steps: break loop, report to user.
- Do not accept missing tests unless user explicitly authorized skipping.
- Update task tracker with review status + reviewer report links after each review.

**Post-task steps**
- Update todo list; mark task completed. If external task list: update completion status.
- Update daily task tracker with final status, links, short outcome note.
- Start next task.
- Repeat until delegated tasks finished.

Remember: agent has no context of this conversation; prompts must include sufficient context + details.

## Prompt Creation Flow

- Agent not great at decisions; you decide, be explicit.
- Read needed code to decide implementation details.
- Prompts must be detailed + precise; avoid clarifications.
- If task too big: split; prompt per sub-task.
- Include interface definitions, mock strategy, test plan (unit/integration/e2e).
- Call out TDD requirements + explicit authorization to skip tests.

## References

- Interface-first parallelization examples: `./references/parallelization-examples.md`.
- Guardrails + red flags: `./references/guardrails.md`.
- End-to-end orchestration example: `./references/example-workflow.md`.