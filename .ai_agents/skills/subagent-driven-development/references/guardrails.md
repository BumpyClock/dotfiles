# Guardrails and Notes

## Advantages

- Fresh context per task; less confusion.
- Continuous progress in one session (no handoff).
- Review checkpoints enforce spec compliance and code quality.
- Controller curates context; minimal file-reading overhead.
- Parallel-safe when tasks are independent.

**Cost:**
- Reviewer + prep adds overhead.
- Review loops add iterations but catch issues early.

## Red Flags

**Never:**
- Start implementation before interfaces are defined.
- Skip review or allow skipping spec compliance or code quality checks.
- Proceed with unfixed issues or open review items.
- Dispatch parallel implementers that edit the same files.
- Make subagents read the plan file; provide full text instead.
- Skip scene-setting context or ignore subagent questions.
- Accept "close enough" on spec compliance or quality.
- Skip review loops or replace real review with implementer self-review.
- Split review into separate steps; spec + quality must be covered together.
- Skip a test type (unit/integration/e2e) without explicit user authorization.
- Ask subagents to make architecture decisions for you.
- Let the task tracker drift; update it on every state change.

**If subagent asks questions:**
- Answer clearly and completely; add context as needed.

**If reviewer finds issues:**
- Implementer fixes, reviewer re-reviews, repeat until approved.

**If subagent fails task:**
- Dispatch a fix subagent with specific instructions; do not fix manually.
