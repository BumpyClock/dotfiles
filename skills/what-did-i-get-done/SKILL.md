---
name: what-did-i-get-done
description: Summarize authored commits over a user-specified time period into a concise status update.
source: https://github.com/shaneholloman/cursor-plugins/tree/main/cursor-team-kit/skills/what-did-i-get-done
license: MIT
---

# What Did I Get Done

Use this when the user asks for a short, high-signal work summary for a specific time range, such as yesterday, the last 3 days, or last week.

## Workflow

1. Resolve the requested time window into concrete dates.
2. Read commits authored by the current git user email within that range.
3. Exclude merge commits and uncommitted changes unless explicitly requested.
4. Inspect diffs only when commit messages are too vague to support a factual summary.
5. Synthesize the most important shipped changes into a concise status update.
6. Include the actual date range used.

## Guardrails

- Be extremely concise and information-dense.
- Prioritize substantial behavior, architecture, infrastructure, or workflow changes.
- Omit cosmetic-only changes unless they were the main work.
- Do not infer intent or motivation; describe changes functionally.
- If git email is missing, ask the user to set it before proceeding.

## Output

- One short status summary.
- Real date range.
- Optional 2-5 bullets for major changes only.
