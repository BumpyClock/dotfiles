---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
source: https://github.com/obra/superpowers/tree/main/skills/writing-plans
license: MIT
---

# Writing Plans

Create implementation plan from approved spec/requirements before code. Plan must let skilled engineer with near-zero repo context build safely.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

- User path preference wins.

## Local rules

- Follow stricter repo/user git policy.
- In dotfiles, do not create commits unless user explicitly asks.
- Use `subagent-driven-development` only when runtime and user instructions permit.
- If subagents unavailable/inappropriate or user instructions forbid them, plan inline implementation with checkpoints.
- If working in an isolated worktree, follow local git workflow instructions.
- If referenced Superpowers skills unavailable, map locally:
  - implementation/debugging → `programming`
  - frontend/web → `web-development`
  - git/GitHub → `git-workflow`

## Scope check

If spec covers independent subsystems, suggest separate plans. Each plan must produce working, testable software on its own.

Do not bury decomposition inside one mega-plan.

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

## Task granularity

Each step should be one small action, about 2-5 minutes.

Prefer TDD loop when possible:

- write failing test
- run and confirm failure
- implement minimum code
- run and confirm pass
- commit only if requested

## Plan document header

Every plan MUST start with this header:

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** Prefer `subagent-driven-development` for execution when available and permitted by user/runtime. Task implementers own task work and review fixes; integration owner owns final integration. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task structure

Use exact file paths, complete code, exact commands, expected output.

````markdown
### Task N: [Component Name]

**Files:**

- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

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

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit if requested**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## No placeholders

These are plan failures. Never write them:

- `TBD`, `TODO`, `implement later`, `fill in details`
- `Add appropriate error handling`
- `Add validation`
- `Handle edge cases`
- `Write tests for the above` without actual test code
- `Similar to Task N` — repeat code because tasks may be read out of order
- Steps that describe code changes without showing how
- References to undefined types, functions, methods, props, commands, files

## Required detail

Every plan needs:

- Exact file paths.
- Complete code in code-changing steps.
- Exact commands with expected output.
- Tests/verification for each behavior, with enough test-design detail for someone weak at test design.
- Docs/changelog steps when behavior/API/user flow changes.
- DRY, YAGNI, TDD where useful.
- Commits only when requested by user.

## Self-review

After writing plan, review against spec. This is mandatory.

1. Spec coverage — every requirement maps to task(s). Add missing tasks.
2. Placeholder scan — remove failures listed above.
3. Type/signature consistency — names used later match definitions earlier.
4. Buildability — implementer can follow without repo lore or guessing.

Fix issues inline. No need to re-review from scratch.

## Plan reviewer prompt

If runtime and user instructions permit subagents, use `skills/writing-plans/plan-document-reviewer-prompt.md` after plan is written. Otherwise run same checklist inline.

## Task tracking

After saving plan, link it to the appropriate `tsq` task. Use same task the spec was linked to when possible.

```bash
# Use current/parent feature task. If unsure which task, ask.
tsq note <task-id> "Plan: docs/plans/YYYY-MM-DD-<feature-name>.md"
tsq planned <task-id>
```

If plan supersedes previous task spec/plan, add note explaining replacement. Do not create a new `tsq` task just to attach the plan unless no appropriate task exists and user wants one.

Reviewer is advisory to catch serious implementation blockers only.

## Execution handoff

After saving plan, offer exactly:

**"Plan complete and saved to `docs/plans/<filename>.md`. Linked to `tsq` task `<task-id>`. Two execution options:**

**1. Subagent-Driven (recommended when available and permitted)** - Use `subagent-driven-development`: fresh subagent per task, spec review, code-quality review, integration-owner pass

**2. Inline Execution** - Execute tasks in this session with checkpoints when subagents are unavailable, inappropriate, or not permitted

**Which approach?"**

If user chooses subagent-driven and runtime/user instructions permit, invoke local `subagent-driven-development`.

If subagents are unavailable/not permitted or user chooses inline, use normal implementation workflow with checkpoints.
