---
name: weekly-review
description: Produce a short weekly synthesis of authored commits with highlights by bugfix, tech debt, and net-new work.
source: https://github.com/shaneholloman/cursor-plugins/tree/main/cursor-team-kit/skills/weekly-review
license: MIT
---

# Weekly Review

Use this for a weekly recap of shipped work for status updates, retros, or planning.

## Workflow

1. Determine the current git user email from repo config.
2. Resolve the review window. Default to the last 7 days; use 7-10 days only when needed to cover the work week.
3. Collect authored commits in the current repo context. Exclude merge commits.
4. Inspect diffs only enough to avoid overstating vague commit messages.
5. Group meaningful changes into 2-5 concise bullets.
6. Add a short classification paragraph covering likely bug fixes, tech debt, and net-new functionality.

## Guardrails

- Keep the recap short and executive-readable.
- Base claims only on commit history and inspected diffs.
- If git email is missing, ask the user to set it before proceeding.
- Do not include uncommitted work unless the user explicitly asks.

## Output

- Date range used.
- 2-5 bullet weekly summary.
- Brief classification paragraph: bugfix, tech debt, net-new.
