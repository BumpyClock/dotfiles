---
name: subagent-driven-development
description: Execute approved tsq-backed implementation plans with fresh subagents per atomic task, two-stage review gates, and subagent-owned integration.
source: https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development
license: MIT
---

# Subagent-Driven Development

Also called parallel subagent execution. Use this by default for approved controller-owned `tsq` implementation plans.

Core principle: controller schedules; subagents implement, fix review findings, and own integration. Controller owns user comms, scope decisions, blocker decisions, evidence verification, and final report. Controller does not become glue code.

Inline execution is allowed for tiny micro-flow fixes, urgent critical-path blockers, verification-only work, unavailable/forbidden subagents, or explicit user request.

## Local Rules

- Do not commit unless the user explicitly asks. If commits are requested, use local `git-workflow`.
- Do not force worktrees, branch changes, stashes, resets, or destructive git ops unless the user asks.
- Parent/controller verifies evidence before saying done, but should not integrate code except for tiny coordinator metadata or blocked emergency work. If it must patch manually, say why.
- `tsq` is canonical for workflow state. Subagent prompts still include full child task payload so children do not need to fetch context to understand the task.

## Default execution model

Use SDD by default for approved `tsq` implementation plans.

Preflight before execution:

- Verify `plan-reviewer` approved the `tsq` parent, or the controller explicitly waived plan review.
- If approval/waiver is missing, stop and ask the controller before dispatching implementers.

SDD executes the `tsq` dependency graph:

1. Read approved parent task.
2. Read child tasks and dependencies.
3. Verify plan-review approval or explicit controller waiver.
4. Select safe ready/unblocked child tasks.
5. Dispatch one implementer subagent per atomic child task.
6. Run spec-compliance review, then code-quality review per child.
7. Send findings back to the same implementer when possible.
8. Mark child complete only after review gates pass.
9. Continue ready queue until all children complete.
10. Dispatch integration owner.
11. Run final integration review and smoke/live verification.
12. Parent/controller verifies diff, status, gates, and evidence before final report.

## Parallel queue

Parallelize ready tasks by default only when:

- `tsq block` dependencies are clear,
- owned write sets are disjoint,
- shared contracts are stable,
- generated artifacts/config/migrations/global styles/snapshots cannot collide.

Use `tsq block` for readiness/safety dependencies. Use `tsq order` only for preferred sequencing.

At each execution wave:

1. Select all ready/unblocked child tasks.
2. Exclude tasks with overlapping owned files/modules or unstable shared contracts.
3. Dispatch remaining safe ready tasks concurrently.
4. Update `tsq` status as tasks start, pass, or block.
5. When blockers clear, start the next wave.

## Dispatch Rules

Every implementation subagent gets exactly one atomic `tsq` child task.

Prompt must include:

- `tsq` parent ID
- `tsq` child ID
- full child task text
- mode: implementation
- thoroughness: quick | standard | deep
- acceptance criteria
- dependency context
- owned files/modules
- forbidden files/modules
- focused verification
- smoke/live verification if user-visible
- no unrelated edits
- no branches/stashes/commits unless explicitly requested

Investigation and review subagents are read-only. Implementation subagents edit only owned scope. If owned scope is insufficient, stop with `NEEDS_CONTEXT`.

Use `developer-lite` for clear 1-2 file mechanical tasks. Use `developer` for cross-module, API/schema/auth/security/concurrency/perf/new-dep/debugging/judgment work. Use `reviewer` with explicit modes: `spec-compliance`, `code-quality`, `final-integration`.

## Workflow

1. Read the approved `tsq` parent, child task list, dependency graph, and plan/spec.
2. Verify `plan-reviewer` approval or explicit controller waiver. If missing, stop and ask the controller.
3. Create/update in-session task list from `tsq` children.
4. Dispatch safe ready child tasks using `implementer-prompt.md`.
5. If implementer asks questions, answer with concrete context or split/upgrade/ask user.
6. When implementer reports `DONE` or acceptable `DONE_WITH_CONCERNS`, run spec-compliance review using `spec-reviewer-prompt.md`.
7. If spec-compliance review fails, send findings back to same implementer when possible. Re-review until pass.
8. Run code-quality review using `code-quality-reviewer-prompt.md`.
9. If code-quality review fails, send findings back to same implementer when possible. Re-review until pass.
10. Mark task complete only after both reviews pass.
11. Repeat ready-queue waves until all child tasks pass.
12. Dispatch integration owner using `integration-owner-prompt.md`.
13. Run final integration review over integrated diff.
14. Send final issues to integration owner. Repeat until final review passes or blocker needs user/controller decision.
15. Parent/controller verifies diff, status, gate output, and verification evidence, then reports.

## Status Handling

- `DONE`: proceed to spec-compliance review.
- `DONE_WITH_CONCERNS`: read concerns. If correctness or scope related, address before review. If observational, note and proceed.
- `NEEDS_CONTEXT`: provide missing context, then re-dispatch or resume.
- `BLOCKED`: add context, split task, upgrade model, or ask user if blocker needs product/architecture decision.

Never retry same prompt unchanged after `NEEDS_CONTEXT`, `BLOCKED`, or correctness-related `DONE_WITH_CONCERNS`.

## Review Gates

`agent-templates/reviewer.md` owns review criteria. This skill owns review order and status handling.

Run gates in order:

1. `spec-compliance` — implementation matches task/spec.
2. `code-quality` — correctness, tests, maintainability, types, perf, deps.
3. `final-integration` — integrated diff, cross-task contracts, docs/tests, build assumptions.

Do not start code-quality review until spec-compliance passes. Do not start final integration until all task-level gates pass.

## Verification Evidence

Before final report, parent/controller verifies:

- git diff/status
- `tsq` parent/child state
- plan-review approval or explicit controller waiver
- task-level review pass results
- integration review pass result
- focused test outputs
- broader gate outputs
- smoke/live verification for implemented user-visible behavior

If smoke/live verification was not run, say why.

## Red Flags

- Starting SDD without plan-review approval or explicit controller waiver.
- Skipping spec-compliance or code-quality review.
- Starting code-quality review before spec-compliance passes.
- Moving to next task with unresolved review findings.
- Letting implementer self-review replace reviewer pass.
- Dispatching parallel implementers against overlapping owned scopes or unstable shared contracts.
- Making parent/controller fix task code by habit.
- Accepting "close enough" on spec compliance.
- Trusting subagent report without parent/controller evidence check.
- Marking `tsq` child complete before review gates pass.

## Prompt Templates

- `implementer-prompt.md` - task implementer
- `spec-reviewer-prompt.md` - spec-compliance reviewer
- `code-quality-reviewer-prompt.md` - code-quality reviewer
- `integration-owner-prompt.md` - final integration owner
