---
summary: "Why brainstorming and writing-plans stay separate but use terse gate-focused docs."
read_when:
  - Updating brainstorming or writing-plans skills.
  - Refactoring process-gate skills that control design approval or implementation planning.
---

# Planning skills cleanup

## Decision

- Keep `skills/brainstorming/SKILL.md` and `skills/writing-plans/SKILL.md` as separate live skills.
- Rewrite both as terse process contracts.
- Keep visual companion as nested guide: `skills/brainstorming/visual-companion.md`.
- Keep reviewer prompt templates, but compress them.
- Keep brainstorming scripts unchanged.
- Store specs under `docs/specs/` and plans under `docs/plans/`.
- Link saved specs/plans back to appropriate `tsq` task.

## Why

- Brainstorming owns design approval before implementation.
- Writing-plans owns implementation plan quality before code.
- Merging them would blur gates and make agents skip written spec/user review.
- Process skills need hard gates, exact templates, and compact checklists more than explanation.

## Pattern

- Preserve exact copy/paste blocks where agents rely on wording.
- Parent `SKILL.md` owns sequence, gates, paths, `tsq` linkage, and handoff.
- Nested guide owns visual browser mechanics.
- Reviewer prompts only flag serious blockers, not wording/style.

## Pitfalls

- Softening the brainstorming hard gate lets agents start coding before design approval.
- Removing the written spec user-review gate lets planning start from unapproved assumptions.
- Removing plan placeholders/no-guessing rules makes worker tasks under-specified.
- Visual companion consent must stay separate from clarifying questions.
- Saving docs without `tsq` linkage makes long-horizon work hard to resume.
