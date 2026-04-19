# Security

## Current model

`caveman-compress` is instruction-only now. Live behavior is defined in [`SKILL.md`](./SKILL.md), not by helper scripts.

Compression happens through normal agent behavior:

- filepath mode: read/write only the user-requested file plus sibling backup
- inline mode: compress user-provided text in memory and return it without file writes

No helper subprocess, no local validator loop, no custom CLI required.

## What the skill does

- In filepath mode, reads only file user explicitly points to
- Compresses prose directly with model judgment
- Preserves structure-heavy regions exactly
- In filepath mode, writes compressed result back to same path
- In filepath mode, saves sibling `.original.md` backup before overwrite
- In filepath mode, stops if backup already exists
- In inline mode, returns compressed text without creating files

## What the skill does NOT do

- Does not rely on helper scripts; live behavior is in `SKILL.md`
- Does not spawn subprocesses or shell commands for compression
- In filepath mode, does not scan outside requested path
- Does not silently overwrite existing backups
- Does not compress code/config files
- Does not rewrite code blocks, inline code, URLs, paths, commands, headings, table structure, prompt tags, or placeholders

## Why this is safer for complex files

Old scripted flow depended on brittle heuristics and validator regexes. That approach could damage prompt-heavy files with nested structure, XML-like tags, placeholder syntax, or mixed prose/code regions.

Current skill pushes preservation judgment into the model instructions themselves. When a region is ambiguous, the skill prefers leaving it alone over forcing more compression.

## Scope limits

- Natural-language files only
- Reject `*.original.md`
- Reject oversized files before rewrite
- Backup required before overwrite
- Inline mode returns text only; no file writes

## Reporting a vulnerability

If you believe you found a genuine security issue, open a GitHub issue with label `security`.
