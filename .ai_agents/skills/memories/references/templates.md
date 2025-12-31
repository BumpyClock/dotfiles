# Templates

Use these as lightweight defaults. Omit optional sections when they add no value.

## Index template (`.ai_agents/memories/memories.md`)

```markdown
# Memories

Last reviewed: YYYY-MM-DD

## Architecture
- [Title](architecture/slug.md) — updated YYYY-MM-DD

## Preferences
- [Title](preferences/slug.md) — updated YYYY-MM-DD

## Workflow
- [Title](workflow/slug.md) — updated YYYY-MM-DD

## Tooling
- [Title](tooling/slug.md) — updated YYYY-MM-DD

## Domain
- [Title](domain/slug.md) — updated YYYY-MM-DD

## Product
- [Title](product/slug.md) — updated YYYY-MM-DD
```

## Memory template (individual file, frontmatter)

```markdown
---
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
source: user | agent
confidence: high | medium | low
tags: [tag-one, tag-two]
---

# Title

## Memory
One to three sentences that capture the durable insight.

## Scope (optional)
- Applies to: ...
- Exceptions: ...

## Evolution
- YYYY-MM-DD: Initial capture.
- YYYY-MM-DD: Updated because ...
```

## Supersession note (optional)

When superseding, add a short line in Evolution:

```markdown
- YYYY-MM-DD: Superseded by ../category/new-memory.md
```
