---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
source: https://github.com/obra/superpowers/tree/main/skills/writing-plans
license: MIT
---

# Writing Plans

Create implementation plans from approved specs/requirements before code. Plans must let skilled engineers or agents with near-zero repo context build safely.

## Local rules

- Follow stricter repo/user git policy.
- In dotfiles, do not create commits unless user explicitly asks.
- Use `subagent-driven-development` by default for approved controller-owned plans.
- For SDD handoffs created from this skill, run reviewer loops at aggregation boundaries, not per peer leaf task. If a task has children, implement safe ready children first, integrate their work under the parent/subtree, then run one combined read-only `reviewer` for that parent/subtree covering both spec compliance and code quality. Apply this recursively for nested task trees, bottom-up. Only dispatch leaf-level reviewers when the caller explicitly asks, risk requires tight isolation, or stricter repo policy requires it.
- Inline execution is allowed for tiny micro-flow fixes, urgent critical-path blockers, verification-only work, unavailable/forbidden subagents, or explicit user request.
- If working in an isolated worktree, follow local git workflow instructions.
- If referenced Superpowers skills unavailable, map locally:
  - implementation/debugging → `programming`
  - frontend/web → `web-development`
  - git/GitHub → `git-workflow`

## Scope check

If spec covers independent subsystems, suggest separate plans. Each plan must produce working, testable software on its own.

Do not bury decomposition inside one mega-plan.

## Tasque source of truth

Use `tsq` as the source of truth for SDD-backed or durable implementation planning.

For controller-owned planned implementation:

1. Create or reuse a `tsq` parent task.
2. Attach approved spec/requirements to the parent task.
3. Decompose work into small atomic child tasks.
4. Encode readiness dependencies with `tsq block`.
5. Encode preferred sequencing with `tsq order`.
6. Attach final implementation plan to the parent task.
7. Mark parent planned.

Tiny micro-flow fixes, urgent blockers, one-off verification, and child-planner drafts do not need new `tsq` tasks unless caller asks or passes a parent ID.

Never claim a path, task ID, dependency, or `tsq` state that was not actually created.

## Repo artifacts

`tsq` is canonical for implementation workflow state.

Repo plan/spec files are optional exports. Write them only when:

- user asks for a saved doc,
- repo convention requires one,
- `tsq` is unavailable.

Product/API/user docs are still required when behavior changes.

## File structure first

Before tasks, map files to create/modify and each file responsibility.

Rules:

- Clear boundaries, clear interfaces.
- One file = one main responsibility where practical.
- Files that change together should live together.
- Split by responsibility, not technical layer by default.
- Follow existing repo patterns.
- If touched file is unwieldy, plan focused split only when it serves current goal.
- Do not add unrelated refactors.

This file map drives task decomposition.

## Atomic task decomposition

Decompose plans into small, atomic child tasks.

Each child task must have:

- one owned scope,
- clear files/modules,
- acceptance criteria,
- focused verification command,
- smoke/live verification when user-visible behavior changes,
- dependencies encoded in `tsq`, not hidden in prose.

Prefer more small tasks over fewer large tasks. Large one-shot tasks fail more often and reduce safe parallelism.

Parallelize ready tasks by default only when:

- `tsq block` dependencies are clear,
- owned write sets are disjoint,
- shared contracts are stable,
- generated artifacts/config/migrations/global styles/snapshots cannot collide.

Use `tsq block` for readiness/safety dependencies. Use `tsq order` only for preferred sequencing.

## Task granularity

Each step should be one small action, about 2-5 minutes.

Prefer TDD loop when possible:

- write failing test
- run and confirm failure
- implement minimum code
- run and confirm pass
- run smoke/live verification when user-visible behavior changes
- commit only if requested

## Plan document header

Every plan MUST start with this header:

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** Execute approved controller-owned plans with `subagent-driven-development` by default. Task implementers own atomic leaf tasks; reviewer loops run at parent/subtree aggregation boundaries, not per peer leaf task, with one combined read-only reviewer checking spec compliance and code quality for the integrated subtree. Integration owner owns final root integration. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task structure

Use exact file paths, verified code shapes, exact commands, and expected output. Include complete code only when verified from repo context or provided by caller. Otherwise use exact patch-level instructions with named symbols, target behavior, assertions, and investigation steps.

````markdown
### Task N: [Component Name]

**Tasque:** `<parent-id>` / `<child-id>` for SDD-backed or durable plans. For inline/non-durable plans, omit this section or write `Tasque: not used — <reason>`. Never fabricate IDs.

**Owned scope:**

- May edit: `exact/path/or/module`
- Must not edit: `exact/path/or/module`

**Files:**

- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Dependencies:**

- Blocks: `<none | child-id>`
- Blocked by: `<none | child-id>`
- Ordered after: `<none | child-id>`

**Acceptance criteria:**

- [Specific observable outcome]
- [Specific regression that must stay fixed]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run focused verification**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Run smoke/live verification when user-visible**

Run: `exact command or manual check`
Expected: PASS / observed expected behavior

- [ ] **Step 6: Commit if requested**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

Adjust steps to fit the repo, but keep each step one action.

## No placeholders

These are plan failures. Never write them:

- `TBD`, `TODO`, `implement later`, `fill in details`
- `Add appropriate error handling`
- `Add validation`
- `Handle edge cases`
- `Write tests for the above` without actual test intent and code shape
- `Similar to Task N` — repeat code because tasks may be read out of order
- Steps that describe code changes without code or exact patch-level direction
- References to undefined types, functions, methods, props, commands, files
- Fabricated code blocks, commands, APIs, paths, or `tsq` IDs

## Required detail

Every plan needs:

- Exact file paths.
- Owned files/modules per child task.
- Complete code only when verified from repo context; otherwise exact patch-level direction.
- Exact commands with expected output.
- Tests/verification for each behavior, with enough test-design detail for someone weak at test design.
- Smoke/live verification for user-visible behavior.
- Docs/changelog steps when behavior/API/user flow changes.
- DRY, YAGNI, TDD where useful.
- Commits only when requested by user.

## Self-review

After writing plan, review against spec. This is mandatory.

1. Spec coverage — every requirement maps to task(s). Add missing tasks.
2. Placeholder scan — remove failures listed above.
3. Type/signature consistency — names used later match definitions earlier.
4. Buildability — implementer can follow without repo lore or guessing.
5. Test coverage — every task has tests verifying its behavior.
6. Task decomposition — tasks are small, focused, and independently reviewable.
7. Atomicity — tasks are small enough for one subagent to own safely.
8. Owned scope — every atomic child has clear may-edit and must-not-edit boundaries.
9. Dependencies — readiness blockers use `tsq block`; preference order uses `tsq order`.
10. Parallel safety — ready tasks have disjoint owned scopes and stable shared contracts.
11. Verification — focused checks and smoke/live checks are present where needed.
12. Scope control — plan does not add unrequested behavior.

Fix issues inline. No need to re-review from scratch.

## Plan review gate

After writing the plan into `tsq`, dispatch `plan-reviewer` for controller-owned planned implementation.

Pass:

- `tsq` parent task ID
- plan text/spec attached to parent
- child task list
- dependency graph
- constraints or ignored areas, if any

Iterate only on blocking issues. Re-run until `Status: Approved`.

If blocker needs product/API/scope decision, `tsq` state is invalid, or reviewer cannot run, stop and ask the caller/controller. Do not start implementation until approved or explicitly waived by controller.

Plan-reviewer must verify:

- task decomposition is atomic enough,
- dependencies are explicit in `tsq`,
- ready tasks can be parallelized safely,
- owned scopes are clear,
- review loops run at parent/subtree aggregation boundaries instead of per peer leaf task, with one combined reviewer pass covering both spec compliance and code quality for each integrated subtree unless the caller explicitly requested leaf-level or two-stage review,
- verification includes smoke/live checks where needed.

If this skill is being followed inside a `planner` subagent, do not dispatch review. Return the plan and tell the caller/controller to run `plan-reviewer`.

## Execution handoff

After plan-reviewer approves a controller-owned planned implementation, invoke `subagent-driven-development` by default.

Inline execution is allowed for:

- tiny micro-flow fixes,
- urgent critical-path blockers,
- verification-only work,
- unavailable/forbidden subagents,
- explicit user request.

Do not show an execution-choice prompt when SDD clearly applies. Start SDD with reviewer loops at aggregation boundaries. For each parent/subtree, dispatch safe ready leaf implementers, integrate their outputs, then run one combined reviewer over the integrated subtree. The combined reviewer prompt must check spec compliance first, then code quality, and return one PASS/FAIL with evidence. Report:

```text
Plan-reviewer approved `tsq` parent `<id>`. Starting SDD: dispatching safe ready leaf tasks concurrently where write sets are disjoint and shared contracts are stable, then reviewing integrated parent/subtree boundaries with one combined reviewer per aggregation point.
```
