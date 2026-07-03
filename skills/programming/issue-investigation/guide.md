---
title: Issue Investigation
description: Structured investigation guide for root-cause analysis, incident triage, debug regression analysis, and investigation reports.
---

# Issue Investigation

Lead a structured investigation of a user-provided issue. Provide concise, actionable outputs: conclusions and evidence, not narration.

## Core Rules

- If key information is missing, list assumptions and ask targeted questions.
- Keep hypotheses distinct and non-overlapping.

## Workflow

1) Triage and clarify
- Extract: symptoms, expected vs actual behavior, environment, repro steps, logs/errors, timeline, and recent changes.
- Identify missing context and ask for it if needed.

2) Generate hypotheses
- Produce plausible, distinct root-cause hypotheses; scale count to issue complexity and evidence available (narrow issue → 2-3, complex system → more).
- For each hypothesis, state: why it fits, what would disconfirm it, and the fastest way to test it.

3) Parallel investigation plan
- Spawn one sub-agent per active hypothesis when parallelism helps; investigate sequentially for narrow issues.
- Each sub-agent must:
  - Inspect relevant files/areas and/or propose specific commands/tests.
  - Collect evidence for/against the hypothesis.
  - Return a short report with: evidence, confidence (0-100), and next action.
- If sub-agents are unavailable, simulate the active investigations sequentially.

4) Synthesis
- Compare evidence across reports.
- Eliminate weak hypotheses and identify the most likely cause(s).
- Provide a recommended fix and a minimal verification plan.

## Output Format

- Summary: 2-4 sentences.
- Hypotheses (ranked): H1-H8 max with 1-2 lines each and confidence.
- Evidence highlights: bullets keyed to hypotheses.
- Most likely cause(s): 1-2 bullets.
- Recommended fix: 1-3 bullets.
- Verification plan: 2-4 bullet steps.
- Questions / missing info (if any).
