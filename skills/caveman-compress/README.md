<p align="center">
  <img src="https://em-content.zobj.net/source/apple/391/rock_1faa8.png" width="80" />
</p>

<h1 align="center">caveman-compress</h1>

<p align="center">
  <strong>shrink memory file. save token every session.</strong>
</p>

---

A Claude Code skill that compresses project memory files (`CLAUDE.md`, todos, preferences) with AI judgment directly — so every session loads fewer tokens automatically.

Claude read `CLAUDE.md` on every session start. If file big, cost big. Caveman make file small. Cost go down forever.

## What It Do

```
/caveman:compress CLAUDE.md
```

```
CLAUDE.md          ← compressed (Claude reads this — fewer tokens every session)
CLAUDE.original.md ← human-readable backup (you edit this)
```

Original never lost. Read and edit `.original.md`.

Need another compression pass later? Manually copy edited backup content back to original filename, rename or remove old `.original.md`, then run skill again so it can create a fresh backup safely.

## What It Preserve

- Code blocks
- Inline code
- URLs, file paths, commands, flags
- Headings, tables, list nesting
- XML / HTML prompt tags
- Template placeholders like `{{task}}` and `${INPUT}`
- Versions, IDs, numbers, proper nouns

Compress prose only. Structure stay exact.

## Why AI, not scripts

Old helper scripts used rigid detection + validation heuristics. Good for simple prose. Bad for complex prompt files, mixed prose/code docs, nested tables, XML-tagged instructions, placeholder-heavy templates.

Live behavior now lives in [`SKILL.md`](./SKILL.md). Model reads file directly, freezes structure-heavy regions, compresses prose between them, then self-reviews before writing.

## Security

See [SECURITY.md](./SECURITY.md). Short version: live skill path is instruction-only. No helper subprocesses. No local compression scripts required.

## Install

In this repo, skill files live at:

```bash
skills/caveman-compress/
```

## Usage

```
/caveman:compress <filepath>
```

Examples:
```
/caveman:compress CLAUDE.md
/caveman:compress docs/preferences.md
/caveman:compress todos.md
```

If user gives inline text instead of a filepath, skill can compress inline and return text without writing files.

### What files work

| Type | Compress? |
|------|-----------|
| `.md`, `.txt`, `.markdown`, `.rst` | ✅ Yes |
| Extensionless natural language | ✅ Yes |
| `.py`, `.js`, `.ts`, `.json`, `.yaml` | ❌ Skip (code/config) |
| `*.original.md` | ❌ Skip (backup files) |

## How It Work

```
/caveman:compress CLAUDE.md
        ↓
read file directly
        ↓
freeze structure-heavy regions
        ↓
compress prose only
        ↓
self-review preserved regions
        ↓
write compressed → CLAUDE.md
write original   → CLAUDE.original.md
```

If file looks ambiguous or structure-heavy, skill favors less compression over risky edits.

Inline-text mode skips file I/O entirely: compress text, return result, no backup file.

## What Is Preserved

Caveman compress natural language. It never touch:

- Code blocks (` ``` ` fenced or indented)
- Inline code (`` `backtick content` ``)
- URLs and links
- File paths (`/src/components/...`)
- Commands (`npm install`, `git commit`)
- Technical terms, library names, API names
- Headings (exact text preserved)
- Tables (structure preserved, cell text compressed)
- XML / HTML prompt tags
- Template placeholders
- Dates, version numbers, numeric values

## Why This Matter

`CLAUDE.md` loads on **every session start**. A 1000-token project memory file costs tokens every single time you open a project. Over 100 sessions that's 100,000 tokens of overhead — just for context you already wrote.

Caveman usually cuts prose hard while keeping instructions intact. Same meaning. Less waste.

```
┌────────────────────────────────────────────┐
│  TOKEN SAVINGS PER FILE    █████       45% │
│  SESSIONS THAT BENEFIT     ██████████ 100% │
│  INFORMATION PRESERVED     ██████████ 100% │
│  SETUP TIME                █            1x │
└────────────────────────────────────────────┘
```

## Part of Caveman

This skill is part of the [caveman](https://github.com/JuliusBrussee/caveman) toolkit — making Claude use fewer tokens without losing accuracy.

- **caveman** — make Claude *speak* like caveman (cuts response tokens ~65%)
- **caveman-compress** — make Claude *read* less (cuts context tokens ~45%)
