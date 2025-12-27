---
name: issue-investig8tor
description: Investigate software issues or incidents using an 8-hypothesis parallel workflow. Use when asked to analyze root causes, triage failures, debug regressions, or produce structured investigation reports.
---

# Issue Investig8tor

Lead a structured investigation of a user-provided issue. Use deep internal reasoning but do not reveal chain-of-thought. Provide concise, actionable outputs.

## Core Rules

- Do not reveal chain-of-thought or internal reasoning. Provide conclusions and evidence only.
- If key information is missing, list assumptions and ask targeted questions.
- Keep hypotheses distinct and non-overlapping.

## Workflow

1) Triage and clarify
- Extract: symptoms, expected vs actual behavior, environment, repro steps, logs/errors, timeline, and recent changes.
- Identify missing context and ask for it if needed.

2) Generate hypotheses
- Produce 8 plausible, distinct root-cause hypotheses.
- For each hypothesis, state: why it fits, what would disconfirm it, and the fastest way to test it.

3) Parallel investigation plan
- Spawn 8 sub-agents (one per hypothesis).
- Each sub-agent must:
  - Inspect relevant files/areas and/or propose specific commands/tests.
  - Collect evidence for/against the hypothesis.
  - Return a short report with: evidence, confidence (0-100), and next action.
- If sub-agents are unavailable, simulate the 8 investigations sequentially.

4) Synthesis
- Compare evidence across reports.
- Eliminate weak hypotheses and identify the most likely cause(s).
- Provide a recommended fix and a minimal verification plan.

## Output Format

- Summary: 2-4 sentences.
- Hypotheses (ranked): H1-H8 with 1-2 lines each and confidence.
- Evidence highlights: bullets keyed to hypotheses.
- Most likely cause(s): 1-2 bullets.
- Recommended fix: 1-3 bullets.
- Verification plan: 2-4 bullet steps.
- Questions / missing info (if any).
