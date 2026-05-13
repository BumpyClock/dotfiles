---
summary: "Why git-workflow skill docs use one lean router plus consolidated task guides."
read_when:
  - Consolidating workflow skills with overlapping task docs.
  - Updating git-workflow routing, safety rules, or PR/CI helper docs.
---

# Git workflow skill consolidation

## Decision

- Keep one live parent skill: `skills/git-workflow/SKILL.md`.
- Consolidate overlapping task docs into:
  - `commits-and-branches.md`
  - `pr-and-comments.md`
  - `merge-and-ci.md`
  - `worktree-management.md`
  - `add-changelog.md`
- Keep helper scripts under `skills/git-workflow/scripts/`.
- Move old overlapping docs to Trash rather than deleting directly.

## Why

- Old docs repeated branch, push, PR comment, and CI rules across many files.
- Git workflows are safety-sensitive; duplicated rules drift and create risky examples.
- Agent-facing docs should be terse contracts with commands, not long tutorials.

## Pattern

- Parent `SKILL.md` owns global safety rules and routing.
- Consolidated guides own task-specific commands and consent gates.
- Preserve scripts when they encode fragile API behavior.
- Keep destructive ops behind explicit consent.

## Pitfalls

- Leaving old docs live can cause agents to follow stale file names.
- Removing verbose sections must not remove safety gates: push, amend, branch delete, force delete, worktree ignore check, binary conflicts, CI approval.
- CI docs must distinguish GitHub Actions logs from external check URLs.
