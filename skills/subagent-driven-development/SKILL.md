---
name: subagent-driven-development
description: Use when executing a defined implementation plan with multiple mostly-independent tasks in the current session. Orchestrate implementer and reviewer subagents, parallelize safe work, keep architecture and integration in the orchestrator.
---

# Subagent-Driven Development

Role: orchestrator. Decompose, dispatch, review, integrate, verify.

## Orchestrator Owns

- Plan decomposition.
- Interfaces, contracts, acceptance criteria.
- Architecture and product decisions.
- Dependency ordering.
- Integration.
- Final verification.

## Core Rules

- Use `tasque` for durable tracking.
- Split by ownership. Parallel agents should not edit the same files or interfaces.
- Define interfaces and acceptance before dispatch.
- Give each subagent the full task text and local context. Do not make subagents hunt through plan files.
- Keep decisions in orchestrator. Subagents implement, test, review, research.
- Require tests for behavior changes. Skip only for clearly mechanical work or explicit approval.
- Review every implementation with a separate reviewer agent.
- Loop until pass. If the task stays stuck after repeated review/fix cycles, stop and surface the blocker.
- Pick the smallest capable agent.

## Flow

1. Analyze
- Identify goal, success criteria, constraints, dependencies, shared surfaces, test needs.
- Break work into small tasks with clean ownership.

2. Define contracts
- Lock public interfaces, data shapes, integration order, non-goals.
- Add enough detail for independent execution.

3. Track
- Create or update `tsq` tasks.
- Model blockers explicitly.
- Mark active work `in_progress`; close only after review and verification.

4. Dispatch implementer
- Assign one owned task.
- Include task, context, owned files, contracts, constraints, tests, deliverables.
- Tell the agent to ask questions early and avoid autonomous architecture changes.

5. Review
- Dispatch a separate reviewer with requirements, changed files, diff context, test results.
- Reviewer checks spec compliance first, then code quality and test coverage.
- If review fails, send targeted fixes back through an implementer.

6. Integrate
- Merge approved task work in dependency order.
- Re-run impacted tests after integration.

7. Finish
- Run final end-to-end checks for the plan.
- Close `tsq` items with outcome notes.
- Report blockers, residual risk, and follow-up work.

## Prompt Contract

- Full task statement. Paste it.
- Why it exists.
- Exact acceptance criteria.
- Owned files or module boundary.
- Interfaces or contracts to honor.
- Constraints and non-goals.
- Test expectations.
- Required deliverable format: summary, files changed, tests run, open issues.

## References

- Red flags: `./references/guardrails.md`
- Example loop: `./references/example-workflow.md`
- Parallel split patterns: `./references/parallelization-examples.md`
