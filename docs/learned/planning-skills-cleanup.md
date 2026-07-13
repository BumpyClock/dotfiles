---
summary: "Why brainstorming stays a terse gate-focused skill and hands off to the planner agent."
read_when:
  - Updating the brainstorming skill or planner agent template.
  - Refactoring process-gate skills that control design approval or implementation planning.
---

# Planning skills cleanup

## Decision

- Keep `skills/brainstorming/SKILL.md` as a terse process contract owning design approval.
- Implementation planning moved from the `writing-plans` skill (now `skills_archive/writing-plans/`) to the `planner` agent template (`agent-templates/planner.md`). Brainstorming hands off to `planner` after its HARD-GATE is satisfied.
- Visual companion server/scripts removed; replaced by self-contained interactive HTML files (see "Interactive visuals" section in SKILL.md). No nested `visual-companion.md` guide anymore.
- Keep reviewer prompt templates compressed (`spec-document-reviewer-prompt.md`).
- Store exported specs under `docs/specs/`; `tsq` parent task is primary spec home when SDD-backed/durable.

## Why

- Brainstorming owns design approval before implementation; planner owns plan quality before code.
- Merging them would blur gates and make agents skip written spec/user review.
- Process skills need hard gates, exact templates, and compact checklists more than explanation.

## Pattern

- Gates fixed, ceremony elastic. Three tiers (micro/standard/complex) mirror planner's trivial/standard/complex circuit-breaker. Standard tier keeps both HARD-GATE approvals but batches questions, allows a single approach when one is obviously right, uses whole-doc approval, and skips the spec-gate subagent. Fixed ceremony counts (exactly 2-3 approaches, per-section approvals, one question per message) caused strawman alternatives and round-trip bloat on medium tasks.

- Preserve exact copy/paste blocks where agents rely on wording.
- `SKILL.md` owns sequence, gates, paths, `tsq` linkage, and handoff — state each gate condition once (HARD-GATE block), reference it elsewhere instead of restating.
- Reviewer prompts only flag serious blockers, not wording/style.

## Pitfalls

- Softening the brainstorming hard gate lets agents start coding before design approval.
- Removing the written spec user-review gate lets planning start from unapproved assumptions.
- Visual companion consent must stay separate from clarifying questions (its own message).
- Saving docs without `tsq` linkage makes long-horizon work hard to resume.
- Stale cross-refs: when archiving a skill this one hands off to, update the handoff target here and in SKILL.md — dead refs (`writing-plans`, `visual-companion.md`) survived one consolidation pass unnoticed.
