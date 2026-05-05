---
name: subagent-driven-development
description: Execute implementation plans with fresh subagents per task, two-stage review gates, and subagent-owned integration. Use when a plan has independent or mostly independent tasks and the user/runtime permits subagents.
source: https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development
license: MIT
---

# Subagent-Driven Development

Execute a plan by dispatching a fresh implementer subagent per task, then reviewing that task in two stages: spec compliance first, code quality second. After task work is complete, dispatch a dedicated integration-owner subagent to integrate the full diff, run gates, and fix cross-task issues.

Core principle: controller schedules; subagents implement, fix review findings, and own integration. Controller does not become glue code.

## Local Rules

- Use this only when the user asked for subagent-driven execution or current instructions explicitly permit subagents.
- Do not commit unless the user explicitly asks. If commits are requested, use local `git-workflow`.
- Do not force worktrees, branch changes, stashes, resets, or destructive git ops unless the user asks.
- Parent/controller still owns user comms, scope decisions, blocker decisions, and final evidence report.
- Parent/controller verifies evidence before saying done, but should not integrate code except for tiny coordinator metadata or blocked emergency work. If it must patch manually, say why.

## When To Use

Use when:
- An implementation plan exists.
- Tasks have clear acceptance criteria.
- Tasks are independent or can be serialized safely.
- Subagents can own files/modules without conflict.

Do not use when:
- Work is tiny enough that delegation adds delay.
- The next action is a critical-path blocker the controller must resolve.
- Tasks share unstable public contracts that still need architecture decisions.
- Runtime/user instructions do not permit subagents.

## Workflow

1. Read plan once.
2. Extract every task with full text, dependencies, owned files/modules, acceptance criteria, and verification commands.
3. Create/update in-session task list.
4. For each task, dispatch implementer using `implementer-prompt.md`.
5. If implementer asks questions, answer with concrete context or split/upgrade/ask user.
6. When implementer reports `DONE` or acceptable `DONE_WITH_CONCERNS`, run spec review using `spec-reviewer-prompt.md`.
7. If spec review fails, send findings back to same implementer when possible. Re-review until pass.
8. Run code-quality review using `code-quality-reviewer-prompt.md`.
9. If quality review fails, send findings back to same implementer when possible. Re-review until pass.
10. Mark task complete only after both reviews pass.
11. After all tasks pass, dispatch integration owner using `integration-owner-prompt.md`.
12. Run final integration review over the integrated diff.
13. Send final issues to integration owner. Repeat until final review passes or blocker needs user decision.
14. Parent/controller verifies diff, status, and gate output, then reports evidence.

## Dispatch Rules

- Paste full task text. Do not make subagents read the plan file as their primary source.
- Include scene-setting context: why task exists, how it fits, dependencies, contracts, and expected tests.
- Assign owned files/modules. State that other agents may be working and they must not revert unrelated edits.
- Prefer serial implementation. Parallelize only when write sets are disjoint and shared contracts are stable.
- Use `developer-lite` for clear 1-2 file mechanical tasks.
- Use `developer` for cross-module, API/schema/auth/security/concurrency/perf/new-dep/debugging/judgment work.
- Use `reviewer` in `spec-compliance`, then `code-quality`, then `final-integration` modes.

## Status Handling

- `DONE`: proceed to spec review.
- `DONE_WITH_CONCERNS`: read concerns. If correctness or scope related, address before review. If observational, note and proceed.
- `NEEDS_CONTEXT`: provide missing context, then re-dispatch or resume.
- `BLOCKED`: add context, split task, upgrade model, or ask user if blocker needs product/architecture decision.

Never retry same prompt unchanged after `NEEDS_CONTEXT`, `BLOCKED`, or correctness-related `DONE_WITH_CONCERNS`.

## Review Gates

Spec compliance review checks:
- Missing requirements.
- Extra scope.
- Wrong interpretation.
- Claims not backed by code.

Code quality review checks:
- Correctness, tests, maintainability, types, perf, deps.
- File responsibility and contract clarity.
- Whether new code made files too large or tangled.

Final integration review checks:
- Cross-task regressions.
- Contract drift.
- Missing docs/tests.
- Broken build assumptions.
- Individually approved tasks still working together.

## Red Flags

- Skipping spec or quality review.
- Starting code-quality review before spec review passes.
- Moving to next task with unresolved review findings.
- Letting implementer self-review replace reviewer pass.
- Dispatching parallel implementers against same files.
- Making parent/controller fix task code by habit.
- Accepting "close enough" on spec compliance.
- Trusting subagent report without parent/controller evidence check.

## Prompt Templates

- `implementer-prompt.md` - task implementer
- `spec-reviewer-prompt.md` - spec compliance reviewer
- `code-quality-reviewer-prompt.md` - code quality reviewer
- `integration-owner-prompt.md` - final integration owner
