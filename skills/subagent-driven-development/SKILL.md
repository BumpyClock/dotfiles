---
name: subagent-driven-development
description: Execute approved tsq-backed implementation plans with fresh subagents per atomic leaf task, aggregation-boundary review loops, and subagent-owned integration.
source: https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development
license: MIT
---

# Subagent-Driven Development

Also called parallel subagent execution. Use this by default for approved controller-owned `tsq` implementation plans.

Core principle: controller schedules; leaf subagents implement atomic tasks, aggregation owners integrate subtrees, reviewers review completed parent/subtree boundaries, and responsible implementers/integration owners fix findings. Controller owns user comms, scope decisions, blocker decisions, evidence verification, and final report. Controller does not become glue code.

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

1. Read approved root task.
2. Read child tasks, nested subtasks, and dependencies.
3. Verify plan-review approval or explicit controller waiver.
4. Select safe ready/unblocked leaf tasks.
5. Dispatch one implementer subagent per atomic leaf task.
6. When sibling leaves for a parent/subtree are implemented, integrate their work at that aggregation boundary.
7. Run one combined read-only reviewer for the integrated parent/subtree. The reviewer checks spec compliance first, then code quality, and returns one PASS/FAIL with evidence.
8. Send findings back to the responsible implementer or aggregation/integration owner when possible.
9. Mark a parent/subtree complete only after its aggregation review passes, or mark a leaf complete without review only when its parent aggregation review will cover it.
10. Continue bottom-up through nested task trees until the root is integrated.
11. Run final root integration review and smoke/live verification.
12. Parent/controller verifies diff, status, aggregate review results, and evidence before final report.

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

Use `developer-lite` for clear 1-2 file mechanical tasks. Use `developer` for cross-module, API/schema/auth/security/concurrency/perf/new-dep/debugging/judgment work. Use `reviewer` with explicit modes: `aggregate-review` for parent/subtree boundaries and `final-integration` for the root. Use separate `spec-compliance` or `code-quality` modes only when the caller explicitly requests leaf-level/two-stage review or risk requires tight isolation.

## Workflow

1. Read the approved `tsq` root, nested child task list, dependency graph, and plan/spec.
2. Verify `plan-reviewer` approval or explicit controller waiver. If missing, stop and ask the controller.
3. Create/update in-session task list from the `tsq` task tree.
4. Dispatch safe ready leaf tasks using `implementer-prompt.md`.
5. If implementer asks questions, answer with concrete context or split/upgrade/ask user.
6. When a leaf implementer reports `DONE` or acceptable `DONE_WITH_CONCERNS`, record its report and verification evidence; do not automatically dispatch a leaf reviewer.
7. When all ready sibling leaves/subtrees under a parent are implemented, dispatch an integration owner for that parent/subtree when integration work is needed.
8. Run one combined aggregate review for that parent/subtree using `aggregate-reviewer-prompt.md`.
9. If aggregate review fails, send findings to the responsible implementer or aggregation/integration owner when possible. Re-review that same parent/subtree until pass or blocker needs user/controller decision.
10. Mark the reviewed parent/subtree complete only after aggregate review passes.
11. Repeat bottom-up until all nested parents/subtrees pass.
12. Dispatch root integration owner using `integration-owner-prompt.md` when root-level integration work is needed.
13. Run final integration review over the root integrated diff.
14. Send final issues to integration owner. Repeat until final review passes or blocker needs user/controller decision.
15. Parent/controller verifies diff, status, aggregate review output, and verification evidence, then reports.

## Status Handling

- `DONE`: record as ready for its parent/subtree aggregation review.
- `DONE_WITH_CONCERNS`: read concerns. If correctness or scope related, address before parent/subtree aggregation review. If observational, note and proceed.
- `NEEDS_CONTEXT`: provide missing context, then re-dispatch or resume.
- `BLOCKED`: add context, split task, upgrade model, or ask user if blocker needs product/architecture decision.

Never retry same prompt unchanged after `NEEDS_CONTEXT`, `BLOCKED`, or correctness-related `DONE_WITH_CONCERNS`.

## Review Boundaries

`agent-templates/reviewer.md` owns review criteria. This skill owns review placement and status handling.

Run reviewer loops at aggregation boundaries, not per peer leaf task by default:

1. `aggregate-review` — one combined reviewer for a completed parent/subtree. The prompt checks spec compliance first, then code quality over the integrated diff and all direct child acceptance criteria.
2. `final-integration` — one root-level reviewer for the full integrated diff, cross-task contracts, docs/tests, build assumptions, and smoke/live verification.

For nested task trees, apply this bottom-up: implement leaves, review their parent/subtree once, then review the next parent/grandparent boundary after its child subtrees pass.

Only run leaf-level `spec-compliance` or `code-quality` reviewers when the caller explicitly requests it, the leaf is high risk (security/auth/data migration/concurrency/perf), ownership boundaries are unclear, or a regression needs tighter isolation.

## Verification Evidence

Before final report, parent/controller verifies:

- git diff/status
- `tsq` parent/child state
- plan-review approval or explicit controller waiver
- aggregate parent/subtree review pass results
- final integration review pass result
- focused test outputs
- broader gate outputs
- smoke/live verification for implemented user-visible behavior

If smoke/live verification was not run, say why.

## Red Flags

- Starting SDD without plan-review approval or explicit controller waiver.
- Skipping aggregation-boundary review for a parent/subtree with multiple implemented children.
- Dispatching reviewer agents for every peer leaf task by habit instead of reviewing the integrated parent/subtree.
- Moving to the next aggregation boundary with unresolved review findings.
- Letting implementer self-review replace reviewer pass.
- Dispatching parallel implementers against overlapping owned scopes or unstable shared contracts.
- Making parent/controller fix task code by habit.
- Accepting "close enough" on spec compliance.
- Trusting subagent report without parent/controller evidence check.
- Marking a parent/subtree complete before its aggregate review passes.

## Prompt Templates

- `implementer-prompt.md` - leaf task implementer
- `aggregate-reviewer-prompt.md` - combined parent/subtree reviewer
- `integration-owner-prompt.md` - parent/subtree or root integration owner
- `spec-reviewer-prompt.md` - legacy/tight-isolation spec-compliance reviewer only when explicitly requested
- `code-quality-reviewer-prompt.md` - legacy/tight-isolation code-quality reviewer only when explicitly requested
