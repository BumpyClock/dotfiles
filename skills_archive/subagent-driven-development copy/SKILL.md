---
name: subagent-driven-development
description: "Execute approved tsq plans via subagents, aggregation reviews, integration."
source: https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development
license: MIT
---

# Subagent-Driven Development

Parallel subagent execution. Default for approved controller-owned `tsq` implementation plans.

Controller schedules; leaf subagents implement atomic tasks, aggregation owners integrate subtrees, reviewers review boundaries, implementers/integration owners fix findings. Controller owns user comms, scope decisions, blocker decisions, evidence verification, final report. Controller does not become glue code.

Inline execution allowed for tiny micro-flow fixes, urgent critical-path blockers, verification-only work, unavailable/forbidden subagents, or explicit user request.

Local-agent counterpart to cloud orchestration: `tsq` = durable task graph + scheduler, local git = shared medium, explicit handoffs = meaning, controller scheduling = loop. Do not import cloud-agent assumptions (`plan.json`, auto-clone, auto-PR, Slack coupling, API-key spawning) unless user explicitly asks.

## Node roles

| Node | Scope | Output |
| --- | --- | --- |
| Controller | Entire user goal | User comms, scheduling, scope decisions, final evidence |
| Planner | Plan/spec only | Approved `tsq` task graph + execution handoff |
| Implementer | One atomic leaf task | Code/docs/tests in owned scope + handoff report |
| Integration owner | Parent/subtree or root | Cross-task integration fixes + verification evidence |
| Reviewer | Parent/subtree or final diff | PASS/FAIL with spec + quality evidence |
| Verifier | One measurable acceptance claim | VERIFIED/NOT VERIFIED/INCONCLUSIVE evidence |

## Local Rules

- No commits unless user explicitly asks. If requested, use local `git-workflow`.
- No worktrees, branch changes, stashes, resets, or destructive git ops unless user asks.
- Parent/controller verifies evidence before saying done. Manual patches only for tiny coordinator metadata or blocked emergency work — say why.
- `tsq` = canonical workflow state. Subagent prompts include full child task payload so children don't need to fetch context.
- Workers don't coordinate with siblings. Information flows up via handoffs, down via controller/planner prompts.
- For long-running/resumable work, `tsq` is source of truth. Optionally write durable handoff summaries under `/tmp/sdd-handoffs/<root-tsq-id>/` or user-approved scratch path. Supplements `tsq`, not replacement.
- Before closing root: check late handoffs, stale `tsq` states, unresolved review/verifier findings.

## Default execution model

Use SDD by default for approved `tsq` implementation plans.

Preflight:
- Verify `plan-reviewer` approved the `tsq` parent, or controller explicitly waived plan review.
- If approval/waiver missing, stop and ask controller before dispatching implementers.

SDD executes the `tsq` dependency graph:

1. Read approved root task.
2. Read child tasks, nested subtasks, dependencies.
3. Verify plan-review approval or explicit controller waiver.
4. Select safe ready/unblocked leaf tasks.
5. Dispatch one implementer subagent per atomic leaf task.
6. When sibling leaves for a parent/subtree are implemented, integrate at that aggregation boundary.
7. Run one combined read-only reviewer for integrated parent/subtree. Reviewer checks spec compliance first, then code quality; returns PASS/FAIL with evidence.
8. Send findings to responsible implementer or aggregation/integration owner.
9. Mark parent/subtree complete only after aggregation review passes. Mark leaf complete without review only when parent aggregation review will cover it.
10. Continue bottom-up through nested task trees until root integrated.
11. Run final root integration review + smoke/live verification.
12. Use verifier agents or local `verify-this` style checks for measurable acceptance claims needing independent proof.
13. Parent/controller verifies diff, status, handoffs, aggregate review results, evidence before final report.

## Parallel queue

Parallelize ready tasks by default only when:
- `tsq block` dependencies clear,
- owned write sets disjoint,
- shared contracts stable,
- generated artifacts/config/migrations/global styles/snapshots cannot collide.

Use `tsq block` for readiness/safety dependencies. Use `tsq order` only for preferred sequencing.

Each wave:
1. Select all ready/unblocked child tasks.
2. Exclude tasks with overlapping owned files/modules or unstable shared contracts.
3. Dispatch remaining safe ready tasks concurrently.
4. Update `tsq` status as tasks start, pass, or block.
5. When blockers clear, start next wave.

## Handoff discipline

Every implementer, integration owner, reviewer, and verifier report is a handoff. Concise, structured, sufficient for parent/controller to resume without reading worker's full transcript.

Minimum handoff fields:
- role + owned scope
- status
- files changed or reviewed
- acceptance criteria covered
- commands run with exact outcomes
- smoke/live evidence or why not run
- risks, blockers, follow-ups
- durable artifact paths if created

If work spans sessions, mirror reports into scratch files; reference from `tsq` notes/status. No transient handoffs in repo docs unless user asks.

## Dispatch Rules

Every implementation subagent gets exactly one atomic `tsq` child task.

Prompt must include:
- `tsq` parent ID + child ID
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

Investigation and review subagents are read-only. Implementation subagents edit only owned scope. If owned scope insufficient, stop with `NEEDS_CONTEXT`.

Use `developer-lite` for clear 1-2 file mechanical tasks. Use `developer` for cross-module, API/schema/auth/security/concurrency/perf/new-dep/debugging/judgment work. Use `reviewer` with explicit modes: `aggregate-review` for parent/subtree boundaries, `final-integration` for root. Use separate `spec-compliance` or `code-quality` modes only when caller explicitly requests leaf-level/two-stage review or risk requires tight isolation.

Use `verify-this` workflow or verifier subagent for claims needing repeatable measurement, before/after comparison, screenshots, traces, API response diffs, perf data, or memory evidence. Reviewer findings don't substitute for verification evidence.

## Workflow

1. Read approved `tsq` root, nested child task list, dependency graph, plan/spec.
2. Verify plan-review approval or explicit controller waiver. If missing, stop and ask controller.
3. Create/update in-session task list from `tsq` task tree.
4. Dispatch safe ready leaf tasks using `implementer-prompt.md`.
5. If implementer asks questions, answer with concrete context or split/upgrade/ask user.
6. When leaf implementer reports `DONE` or acceptable `DONE_WITH_CONCERNS`, record report + verification evidence; don't auto-dispatch leaf reviewer.
7. When all ready sibling leaves/subtrees under a parent are implemented, dispatch integration owner for that parent/subtree when integration work needed.
8. Run one combined aggregate review for that parent/subtree using `aggregate-reviewer-prompt.md`.
9. If aggregate review fails, send findings to responsible implementer or aggregation/integration owner. Re-review until pass or blocker needs user/controller decision.
10. Mark reviewed parent/subtree complete only after aggregate review passes.
11. Repeat bottom-up until all nested parents/subtrees pass.
12. Dispatch root integration owner using `integration-owner-prompt.md` when root-level integration work needed.
13. Run final integration review over root integrated diff.
14. Send final issues to integration owner. Repeat until final review passes or blocker needs user/controller decision.
15. Check for late handoffs or stale `tsq` states before closing root.
16. Parent/controller verifies diff, status, handoffs, aggregate review output, verification evidence, then reports.

## Status Handling

- `DONE`: record as ready for parent/subtree aggregation review.
- `DONE_WITH_CONCERNS`: read concerns. Correctness/scope-related → address before aggregation review. Observational → note and proceed.
- `NEEDS_CONTEXT`: provide missing context, re-dispatch or resume.
- `BLOCKED`: add context, split task, upgrade model, or ask user if blocker needs product/architecture decision.

Never retry same prompt unchanged after `NEEDS_CONTEXT`, `BLOCKED`, or correctness-related `DONE_WITH_CONCERNS`.

## Review Boundaries

`agent-templates/reviewer.md` owns review criteria. This skill owns review placement + status handling.

Run reviewer loops at aggregation boundaries, not per peer leaf task by default:

1. `aggregate-review` — one combined reviewer for completed parent/subtree. Checks spec compliance first, then code quality over integrated diff + all direct child acceptance criteria.
2. `final-integration` — one root-level reviewer for full integrated diff, cross-task contracts, docs/tests, build assumptions, smoke/live verification.

For nested task trees, apply bottom-up: implement leaves, review parent/subtree once, review next parent/grandparent boundary after child subtrees pass.

Run leaf-level `spec-compliance` or `code-quality` reviewers only when caller explicitly requests, leaf is high risk (security/auth/data migration/concurrency/perf), ownership boundaries unclear, or regression needs tighter isolation.

## Verification Evidence

Before final report, parent/controller verifies:
- git diff/status
- `tsq` parent/child state
- plan-review approval or explicit controller waiver
- aggregate parent/subtree review pass results
- final integration review pass result
- verifier verdicts for measurable acceptance claims
- focused test outputs
- broader gate outputs
- smoke/live verification for user-visible behavior

If smoke/live verification not run, say why.

## Red Flags

- Starting SDD without plan-review approval or explicit controller waiver.
- Skipping aggregation-boundary review for parent/subtree with multiple implemented children.
- Dispatching reviewer agents for every peer leaf task by habit instead of integrated parent/subtree review.
- Moving to next aggregation boundary with unresolved review findings.
- Implementer self-review replacing reviewer pass.
- Parallel implementers against overlapping owned scopes or unstable shared contracts.
- Parent/controller fixing task code by habit.
- Accepting "close enough" on spec compliance.
- Trusting subagent report without parent/controller evidence check.
- Marking parent/subtree complete before aggregate review passes.

## Prompt Templates

- `implementer-prompt.md` — leaf task implementer
- `aggregate-reviewer-prompt.md` — combined parent/subtree reviewer
- `integration-owner-prompt.md` — parent/subtree or root integration owner
- `verifier-prompt.md` — independent measurable acceptance claim verifier
- `spec-reviewer-prompt.md` — legacy/tight-isolation spec-compliance reviewer (explicit request only)
- `code-quality-reviewer-prompt.md` — legacy/tight-isolation code-quality reviewer (explicit request only)
