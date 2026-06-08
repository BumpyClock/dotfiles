---
summary: "Why WinUI docs use one live parent skill with former skills nested as guides."
read_when:
  - Consolidating or restructuring WinUI skills.
  - Debugging why multiple WinUI skills appear in loaded skill lists.
  - Updating WinUI setup, design, build, testing, packaging, migration, or review guidance.
---

# WinUI skill consolidation

## Decision

- Keep one live parent skill: `skills/winui/SKILL.md`.
- Move former sibling WinUI skills under `skills/winui/references/`.
- Rename nested `SKILL.md` files to `guide.md`.
- Keep helper binaries/scripts beside their guide, preserving relative workflow docs.

## Why

- Skill discovery treats any nested `**/SKILL.md` as a separate live skill.
- WinUI tasks overlap heavily: design, build, UI testing, packaging, and review often need each other.
- One router cuts prompt budget and avoids competing triggers while preserving task-specific depth.

## Pattern

- Parent `SKILL.md` owns routing and shared rules.
- Nested guides own detailed commands, checklists, and task-specific pitfalls.
- Update stale text that refers to old standalone `SKILL.md` paths after moving.
