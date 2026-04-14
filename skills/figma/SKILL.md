---
name: figma
description: Umbrella index for Figma-related skills. Use this entrypoint when a task mentions Figma, FigJam, `use_figma`, Code Connect, screen generation in Figma, design-system generation in Figma, creating a new Figma file, translating Figma designs into code, or generating Figma-to-code rules. Routes to the most specific `figma-*` skill under this directory.
---

# Figma Skill Index

Use this skill as the router when a task involves Figma canvas edits, file creation, screen generation, design-system work, Code Connect, or translating designs into code.

## Skill routing (`read_when` hints)
- `figma-create-new-file/SKILL.md` - `read_when`: Need blank design or FigJam file before other Figma work.
- `figma-use/SKILL.md` - `read_when`: Need to call `use_figma`, inspect a file programmatically, or create/edit/delete nodes, variables, components, auto-layout, fills, or bindings.
- `figma-generate-design/SKILL.md` - `read_when`: Need to build or update full page, screen, or multi-section layout in Figma from code or description. Load with `figma-use`.
- `figma-generate-library/SKILL.md` - `read_when`: Need to build or update design system in Figma from codebase. Load with `figma-use`.
- `figma-implement-design/SKILL.md` - `read_when`: Need to translate Figma design into production code in repo.
- `figma-code-connect/SKILL.md` - `read_when`: Need to create or update `.figma.ts` or `.figma.js` mappings.
- `figma-create-design-system-rules/SKILL.md` - `read_when`: Need project-specific Figma-to-code rules for Claude, Codex, Cursor, or similar agents.

## Composition guidance
- Start with the most specific workflow skill; add `figma-use` whenever any step requires `use_figma`.
- Common stacks:
  - `figma-create-new-file` -> `figma-use`
  - `figma-generate-design` + `figma-use`
  - `figma-generate-library` + `figma-use`
  - `figma-implement-design` + `figma-code-connect` (only when mapping is also requested)
