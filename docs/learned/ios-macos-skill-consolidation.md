---
summary: "Why Apple platform skill content is consolidated under one parent skill and nested guides use `guide.md` instead of `SKILL.md`."
read_when:
  - Consolidating or restructuring skills that previously existed as many sibling skills.
  - Debugging why nested docs inside a parent skill still show up as separate skills.
---

# iOS macOS skill consolidation

## Decision
- Keep one live parent skill: `skills/ios-macos-development/SKILL.md`.
- Move former Apple platform skills to `skills_archive/apple-platform-skills/`.
- Vendor retained content under the parent skill as nested guides and resources.
- Rename nested `SKILL.md` files to `guide.md`.

## Why
- Skill discovery treats any nested `**/SKILL.md` as a separate live skill.
- A parent umbrella skill alone does not prevent child skills from triggering.
- Renaming nested guides preserves content and paths without leaving extra live triggers.

## Pattern
- Parent `SKILL.md` stays lean: scope, routing, common stacks.
- Nested guides keep old domain-specific content and scripts.
- Nested `agents/` metadata should not remain in the live parent tree.
- Archive original standalone skills intact before vendoring content into the parent skill.

## Pitfalls
- Leaving even one nested `SKILL.md` under the new parent reactivates that child as a separate skill.
- Copying development-repo docs wholesale can leave dead references to files not moved into the parent skill.
- Old cross-links that say \"see X skill\" should be rewritten to local guide paths when possible.
