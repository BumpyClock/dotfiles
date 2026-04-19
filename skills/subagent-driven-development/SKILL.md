---
name: subagent-driven-development
description: Use when executing a defined implementation plan with multiple mostly-independent tasks in the current session. Orchestrate implementer and reviewer subagents, parallelize safe work, keep architecture and integration in the orchestrator.
---

# Subagent-Driven Development

Role: orchestrator. Split, dispatch, review, integrate, verify.

## Orchestrator Owns

- Plan split.
- Interfaces, contracts, acceptance criteria.
- Architecture + product decisions.
- Dependency order.
- Integration.
- Final verification.

## Core Rules

- Use `tasque` for durable tracking.
- Split by ownership. Parallel agents must not edit same files or interfaces.
- Define interfaces + acceptance before dispatch.
- Give each subagent full task text + local context. Give subagents plan files for context if helpful.
- Keep decisions in orchestrator. Subagents implement, test, review, research.
- Require tests for behavior changes. Skip only for clearly mechanical work or explicit approval.
- Review every implementation with separate reviewer agent.
- Loop till pass. If task stays stuck after repeated review/fix cycles, stop + surface blocker.
- Pick smallest capable agent.
- Lint , format, test, live test instead of assuming success.

## Flow

1. Analyze
- Identify goal, success criteria, constraints, deps, shared surfaces, test needs.
- Break work into small tasks with clear ownership.

2. Define contracts
- Lock public interfaces, data shapes, integration order, non-goals.
- Add enough detail for independent execution.

3. Track
- Create or update `tsq` tasks.
- Model blockers explicitly.
- Mark active work `in_progress`; close only after review + verification.

4. Dispatch implementer
- Assign one owned task.
- Include task, context, owned files, contracts, constraints, tests, deliverables.
- Tell agent ask questions early. Avoid autonomous architecture changes.

5. Review
- Dispatch a separate reviewer with requirements, changed files, diff context, test results.
- Reviewer checks spec compliance first, then code quality + test coverage.
- If review fails, send targeted fixes back through an implementer.

6. Integrate
- Merge approved work in dependency order.
- Re-run impacted tests after integration.

7. Finish
- Run final end-to-end checks for plan.
- Close `tsq` items with outcome notes.
- Report blockers, residual risk, follow-up work.

## Prompt Contract

- Full task statement. Paste it.
- Why task exists.
- Exact acceptance criteria.
- Owned files or module boundary.
- Interfaces or contracts to honor.
- Constraints + non-goals.
- Test expectations.
- Required deliverable format: summary, files changed, tests run, open issues.

## References

- Red flags: `./references/guardrails.md`
- Example loop: `./references/example-workflow.md`
- Parallel split patterns: `./references/parallelization-examples.md`
