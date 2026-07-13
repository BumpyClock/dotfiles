---
summary: "Why web-development guidance is a focused programming reference and former standalone web skills are archived."
read_when:
  - Consolidating web or frontend guidance into programming.
  - Deciding which web guidance should stay live or move to archive.
---

# Web skill consolidation

## Decision
- Keep general coding workflow in live `skills/programming` skill.
- Keep only durable web-specific guidance in `skills/programming/references/web-development.md`.
- Link reference from `skills/programming/SKILL.md`; load it only for browser-rendered UI or web behavior.
- Archive standalone `skills/web-development` tree intact under `skills_archive/web-development`.

## Why
- Web work follows same debugging, tests, code quality, and evidence gates as other production code.
- Standalone web workflow duplicated `programming` and added too much default direction.
- Small reference preserves novel browser concerns: semantics, input modes, layout stability, reduced motion, and rendered verification.
- Framework and tool catalogs age quickly. Repo conventions and current project tooling are better sources of truth.

## Pattern
- Parent skill owns workflow and verification policy.
- Domain reference adds only constraints not already covered by parent or language reference.
- Archive old standalone skill intact before removing it from live discovery.

## Pitfalls
- Copying whole archived guides back into live tree recreates duplication and stale tool advice.
- Turning taste preferences or fixed animation timings into universal rules over-steers varied products.
- Treating diagnostic scores as proof weakens rendered and behavioral verification.
