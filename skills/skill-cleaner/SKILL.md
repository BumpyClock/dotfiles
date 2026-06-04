---
name: skill-cleaner
description: "Audit Codex/OpenClaw skills: loaded roots, duplicate skills, unused skills, prompt-budget costs, compact descriptions."
---

# Skill Cleaner

Use when trimming skill prompt budget, finding duplicate skills, auditing enabled/disabled skill roots, or deciding which skills/plugins to remove.

## Workflow

1. Run analyzer from this skill directory or repo root:

```bash
node --experimental-strip-types skills/skill-cleaner/scripts/skill-cleaner.ts --months 3
```

Useful variants:

```bash
node --experimental-strip-types skills/skill-cleaner/scripts/skill-cleaner.ts --no-logs
node --experimental-strip-types skills/skill-cleaner/scripts/skill-cleaner.ts --months 6 --max-log-mb 800 --deep-logs
node --experimental-strip-types skills/skill-cleaner/scripts/skill-cleaner.ts --context-tokens 272000 --budget-percent 2 --no-logs
node --experimental-strip-types skills/skill-cleaner/scripts/skill-cleaner.ts --root ~/Dropbox/boxd/skills --no-logs
```

2. Read report in this order:
- `Skill Budget`: GPT-5.5 context size, 2% skills budget, Codex-budgeted usage, pre-budget full-list pressure.
- `Description candidates`: long descriptions where relaxed grammar saves prompt budget.
- `Duplicates`: same skill name or near-identical description/body across Codex, plugin cache, repo siblings, personal skill roots.
- `Unused candidates`: no recent `$skill` mention, `SKILL.md` read, or explicit skill-use trace in recent Codex/OpenClaw logs.
- `Root summary`: where skills came from, whether config marks them disabled.

3. Before deleting or editing:
- Verify kept copy exists and is loaded.
- Prefer deleting repo-local or `.ai_agents/` duplicates when Codex built-ins cover them.
- Preserve trigger nouns in descriptions: product, tool, action, object.

## Analyzer Notes

- Script mirrors Codex's model-visible line shape: `- name: description (file: path)`.
- Applies Codex-like frontmatter rules: YAML frontmatter only, default name from parent dir, single-line sanitized `name` and `description`.
- Follows Codex `core-skills/src/render.rs`: 2% of raw `context_window`, token cost `ceil(utf8_bytes / 4)`, then full descriptions → equal description truncation → omitted minimum lines.
- Reads `~/.codex/models_cache.json` for GPT-5.5 `context_window`; fallback: 272,000 tokens and 2%.
- Scans normal Codex/plugin/repo skill roots by default. Extra folders (Dropbox archives) included only with `--root <path>`.
- Realpath-dedupes roots; symlinked roots like `~/.codex/skills/agent-scripts -> ~/Projects/agent-scripts/skills` don't create false duplicates.
- Duplicate names: reports description/body similarity, suggests deletion only when bodies near copies. Keep priority: direct Codex system skills > direct Codex skills > plugin skills > personal/repo copies.
- Scans `~/.codex/history.jsonl`, ~/.pi, ~/.claude, ~/.copilot, ~/.opencode and recent `~/.codex/sessions/**/*.jsonl` by default. Add `--deep-logs` to fan out parallel sub-agents for deep, time-efficient investigations.
- Usage evidence is heuristic: `$skill`, `Use $skill`, paths like `skills/<name>/SKILL.md`, and tool calls indicating skill invocation.

## Output Policy

- Suggest first; edit only when user asks.
- If asked to apply cleanup: small grouped commits (descriptions, deletes, config disables).
- Do not delete ignored/untracked skill dirs without naming destination or confirming disposable.
