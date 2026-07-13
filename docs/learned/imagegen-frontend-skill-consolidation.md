---
summary: "Why mobile and web frontend image direction share one live skill with mode-specific output contracts."
read_when:
  - Updating frontend image-generation guidance.
  - Consolidating skills that share visual direction but require different deliverables.
---

# Frontend imagegen skill consolidation

## Decision
- Keep one live skill: `skills/imagegen-frontend`.
- Route between mobile and web modes inside one concise `SKILL.md`.
- Archive original mobile and web skills intact under `skills_archive/`.

## Why
- Both skills enforce same premium, readable, non-generic visual direction.
- Separate long option catalogs duplicated palette, typography, consistency, imagery, and anti-slop rules.
- Deliverables still differ: mobile needs one image per screen and coherent app flow; web needs one horizontal image per section and coherent page funnel.

## Pattern
- Share design-bible, legibility, palette, and anti-AI rules.
- Keep mode-specific count, framing, platform, flow, and composition contracts explicit.
- Preserve archived source skills for history; do not expose them as live nested `SKILL.md` files.

## Pitfalls
- A generic unified count rule can accidentally turn mobile flows into collages or web pages into tall screenshots.
- Moving archived `SKILL.md` files below live `skills/` would reactivate old triggers.
- Reintroducing large style catalogs would undo consolidation without improving output quality.
