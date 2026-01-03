---
name: dispatching-parallel-agents
description: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies
---

# Dispatching Parallel Agents

Use this to investigate multiple independent failures or domains in parallel.

[codex-specific-instructions]: When using Codex, confirm with the user if they want you to proceed with subagent-driven-development before starting. Without explicit user ask, do the work yourself.

**Core principle:** One agent per independent domain.

## Rules (Tight)

- Use only when failures/tasks are independent and do not require shared state or sequential ordering.
- If you already have a plan, use `subagent-driven-development` for execution and reviews.
- If failures might be related or require full-system context, investigate sequentially.
- One agent per domain; prompts must be focused, self-contained, and explicit about constraints and expected output.
- Agents must follow `programming` guidance and apply TDD when required by the programming skill or explicit user request.
- If investigations lead to fixes, convert them into tasks and execute via `subagent-driven-development` so review gates apply.
- Parallelize only when file scopes do not overlap.

## Workflow

1. Group failures by domain (test file/subsystem).
2. Write one prompt per domain with context (errors, files, constraints, expected output).
3. Dispatch agents in parallel.
4. Review outputs, resolve conflicts, run full tests, integrate changes.

## Prompt Template (Minimal)

- Scope: single file or subsystem
- Goal: what to fix or explain
- Constraints: what not to change
- Context: error text, failing tests, relevant files
- Output: summary + proposed fixes

## Common Mistakes

- Too broad scope -> agent gets lost
- Missing context -> wrong fix
- No constraints -> unnecessary refactor
- Overlapping file scopes -> conflicts

## Verification

- Read each summary and verify claims against code.
- Run the full test suite after integrating all changes.
