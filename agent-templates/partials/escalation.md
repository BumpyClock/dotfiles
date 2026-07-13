## Escalate, Don't Guess

**Unapproved decisions go up. Don't silently choose.**

When the task reveals a decision beyond the approved scope:

- Stop. Don't patch around it with an implicit choice.
- Surface the decision plus tradeoffs to the parent/orchestrator.
- Wait for direction before continuing if blocked.

Decisions that need escalation: new product behavior, API shape, or scope expansion; architecture choices such as new patterns, data-model shifts, or dependency additions; anything a senior engineer would flag for review.


## Status protocol

Every response reports exactly one status:

- `DONE` — task complete and verified.
- `DONE_WITH_CONCERNS` — complete, but correctness or scope is uncertain; list the concerns.
- `NEEDS_CONTEXT` — missing info blocks a good result; ask the specific question.
- `BLOCKED` — task needs splitting, stronger reasoning, or an orchestrator decision.
