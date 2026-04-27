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
- Give each subagent fresh, curated context: full task text, local context, owned files, contracts, constraints, tests. Do not make them infer from chat history.
- Keep decisions in orchestrator. Subagents implement, test, review, research.
- Require tests for behavior changes. Skip only for clearly mechanical work or explicit approval.
- Review every implementation with separate `reviewer` passes: spec compliance first, code quality second.
- Loop till pass. If task stays stuck after repeated review/fix cycles, stop + surface blocker.
- Pick smallest capable implementer. Upgrade when signals show it is needed.
- Lint, format, test, live test instead of assuming success.

## Implementer Selection

Default to `developer-lite` for mechanical tasks:
- Clear spec and acceptance criteria.
- Touches 1-2 files.
- No shared interfaces, schema, auth, security, concurrency, perf, or cross-module state.
- Existing pattern is obvious.
- Verification command is local and cheap.

Use `developer` for judgment tasks:
- Multi-file or cross-module work.
- Public API, schema, migration, state model, auth, security, concurrency, perf, or new dependency.
- Debugging, unclear patterns, large/tangled files, or architectural tradeoffs.

Upgrade rule: if `developer-lite` returns `BLOCKED`, `NEEDS_CONTEXT`, or correctness-related `DONE_WITH_CONCERNS`, add context, narrow the task, or redispatch to `developer`. Never retry unchanged.

## Implementer Status

- `DONE`: proceed to spec-compliance review.
- `DONE_WITH_CONCERNS`: read concerns. Resolve correctness/scope concerns before review; note observations and continue.
- `NEEDS_CONTEXT`: provide missing context and redispatch.
- `BLOCKED`: assess blocker. Add context, split task, upgrade implementer, or ask user if plan is wrong.

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
- Select `developer-lite` or `developer` using Implementer Selection.

5. Review
- Dispatch `reviewer` with `Review mode: spec-compliance`, requirements, changed files, diff context, test results. Do not trust implementer report.
- After spec passes, dispatch `reviewer` with `Review mode: code-quality`.
- If review fails, send targeted fixes back through an implementer.

6. Integrate
- Merge approved work in dependency order.
- Re-run impacted tests after integration.

7. Finish
- Run final end-to-end checks for plan.
- Dispatch final `reviewer` with `Review mode: final-integration` over the full integrated diff.
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
- Required deliverable format: status (`DONE` | `DONE_WITH_CONCERNS` | `BLOCKED` | `NEEDS_CONTEXT`), summary, files changed, tests run, self-review findings, open issues.

## References

- Red flags: `./references/guardrails.md`
- Example loop: `./references/example-workflow.md`
- Parallel split patterns: `./references/parallelization-examples.md`
