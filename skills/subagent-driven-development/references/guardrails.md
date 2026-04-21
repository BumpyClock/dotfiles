# Guardrails and Notes

## Red Flags

- Start implementation before interfaces are defined.
- Let implementers make architecture or product decisions.
- Run parallel implementers on the same files or shared interface surface.
- Make subagents reconstruct context from plan docs or chat history.
- Skip spec-compliance or code-quality review.
- Start code-quality review before spec-compliance passes.
- Trust implementer report without checking actual code.
- Proceed with unfixed issues or open review items.
- Accept "close enough" on requirements.
- Skip behavior tests for non-mechanical changes without approval.
- Let task tracking drift.
- Retry the same implementer with the same prompt after `BLOCKED`.
- Ignore `DONE_WITH_CONCERNS`, especially correctness or scope concerns.

## If Questions Appear

- Answer once. Be clear.
- Update the prompt if the answer changes scope or constraints.

## If Review Fails

- Send targeted fix instructions.
- Re-review after changes.
- Stop and surface blocker if loop stops converging.

## If Implementer Escalates

- `NEEDS_CONTEXT`: provide missing context and redispatch.
- `BLOCKED`: split task, upgrade from `developer-lite` to `developer`, or ask user if plan is wrong.
- `DONE_WITH_CONCERNS`: resolve correctness/scope concerns before review; note non-blocking observations.
