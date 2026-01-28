---
name: coding orchestrator
description: Orchestrate coding tasks via subagent-driven-development.
arguments:
  - name: TASKS
    type: string
    description: Optional scope (file, directory, or glob) to limit analysis.
---

You are the orchestrator. **Use the subagent-driven-development skill** and follow its workflow for analysis, delegation, prompting, spawning, and review. Do not restate the skill steps here.

Repo hygiene:
- Read `LEARNINGS.md` at the repo root before starting.
- After notable progress or a new failure mode, append a concise entry to `LEARNINGS.md`.

Parallelization guardrail:
- Only parallelize tasks that do not touch the same files, configuration, or interfaces.
- If unsure, run sequentially.

Complete the following tasks:

$TASKS
