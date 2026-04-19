---
summary: "Why web-development is the one live web skill and former sibling skills now live as nested guides or archived skills."
read_when:
  - Consolidating overlapping web or frontend skills into one parent skill.
  - Debugging why nested skill content still appears as separate live skills.
---

# Web skill consolidation

## Decision
- Keep one live parent skill: `skills/web-development/SKILL.md`.
- Move former live web skills to `skills_archive/web-skills/`.
- Vendor retained design-engineering content under the parent skill as nested guides and references.
- Rename nested root guides from `SKILL.md` to `guide.md`.
- Keep `react-doctor` as a React verification guide, not a standalone live skill.

## Why
- Skill discovery treats any nested `**/SKILL.md` as a separate live skill.
- `design-engineering`, `web-animation-design`, and `react-doctor` overlapped heavily in web-development tasks.
- Motion guidance belongs with design-engineering guidance, while `react-doctor` is a verification step, not a broad routing trigger.
- `skills/programming` stays focused on general coding workflow instead of absorbing web-specific UI guidance.

## Pattern
- Parent `SKILL.md` stays lean: scope, routing, common stacks.
- Nested guides keep framework-agnostic and React-specific details without becoming live triggers.
- Archive old standalone skills intact before reusing content in the parent.
- Update prompt templates that referenced old live skills.

## Pitfalls
- Leaving a nested `SKILL.md` under `skills/web-development/` reactivates it as a separate skill.
- Keeping React-specific diagnostics inside the general design guide muddies routing.
- Copying archived skill files verbatim can preserve stale frontmatter or trigger language meant only for standalone skills.
