# Memories

## Overview

Persist durable project knowledge in `{project_dir}/.ai_agents/memories/` with a single index file and categorized memory files. Keep memories short, accurate, and easy to evolve. Store metadata in YAML frontmatter.

## Workflow

1. Identify a candidate memory
   - Accept explicit requests ("save this", "remember this", "add a memory").
   - Propose saving when a new, durable, high-leverage memory appears.
2. Validate durability
   - Save only stable knowledge that will help in future sessions.
   - Skip ephemeral tasks, temporary states, or details that are likely to change soon.
   - Avoid secrets or sensitive data; ask the user if unsure.
3. Search for related memories
   - Check `memories.md` and scan existing files for similar content.
4. Decide how to store
   - **Update**: adjust an existing memory.
   - **Merge**: consolidate duplicates into one memory.
   - **Supersede**: mark the old memory as superseded and add the new one.
   - **Create**: add a new memory if no close match exists.
5. Confirm when uncertain
   - If the memory is ambiguous, conflicting, or possibly outdated, ask the user to confirm or override.
6. Write the memory
   - Use the template in `references/templates.md` (frontmatter required).
   - Include created/updated timestamps and an evolution note.
7. Update the index
   - Add or update the link in `memories.md` with the latest date.
8. Trim periodically
   - When explicitly asked or when the index grows large, propose a review to merge, supersede, or delete low-value memories.

## Storage layout

- Root index: `.ai_agents/memories/memories.md`
- Categories (create as needed):
  - `architecture/`
  - `preferences/`
  - `workflow/`
  - `tooling/`
  - `domain/`
  - `product/`

Prefer the most specific category. If none fit, create a new category and add it to the index.

## Update rules

- Always search for similar memories before creating a new file.
- Keep one source of truth per idea; avoid duplicates.
- When changing meaning, record the old state in the Evolution section instead of keeping parallel files.
- If the user contradicts an existing memory, ask to confirm whether to override or mark as superseded.
- When using scripts, rely on similarity checks to propose update vs supersede.

## Templates

Use `references/templates.md` for the memory and index formats.

## Scripts

Use `scripts/memories.py` to keep format and index consistent.

Common commands:
- `python3 .ai_agents/skills/memories/scripts/memories.py init`
- `python3 .ai_agents/skills/memories/scripts/memories.py add --title "..." --category architecture --memory "..."`
- `python3 .ai_agents/skills/memories/scripts/memories.py find --query "api"`
- `python3 .ai_agents/skills/memories/scripts/memories.py index`
- `python3 .ai_agents/skills/memories/scripts/memories.py review --stale-days 180`
- `python3 .ai_agents/skills/memories/scripts/memories.py supersede --old architecture/old.md --title "..." --category architecture --memory "..."`
