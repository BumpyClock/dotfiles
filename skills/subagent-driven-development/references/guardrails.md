# Guardrails and Notes

## Red Flags

- Start implementation before interfaces are defined.
- Let implementers make architecture or product decisions.
- Run parallel implementers on the same files or shared interface surface.
- Make subagents reconstruct context from plan docs or chat history.
- Skip review.
- Proceed with unfixed issues or open review items.
- Accept "close enough" on requirements.
- Skip behavior tests for non-mechanical changes without approval.
- Let task tracking drift.

## If Questions Appear

- Answer once, clearly.
- Update the prompt if the answer changes scope or constraints.

## If Review Fails

- Send targeted fix instructions.
- Re-review after changes.
- Stop and surface the blocker if the loop stops converging.
