# Architecture Planning

Use for hard problems that need boundaries, contracts, sequencing, or trade-off decisions before implementation.

## Workflow

1. Orient on existing project shape: stack, services, data flow, deployment targets, docs, and local constraints.
2. Clarify goals, scope, non-functional requirements, and what must not change.
3. Make significant decisions explicit with options, trade-offs, and consequences.
4. Define contracts before work starts: API shapes, data ownership, events, module boundaries, and dependency direction.
5. Sequence work into prerequisites, core changes, integration, and verification.

## ADR format

```text
## ADR: <title>
### Status: Proposed
### Context: <problem and tensions>
### Options:
1. <option A> - <pros> / <cons>
2. <option B> - <pros> / <cons>
3. <option C> - <pros> / <cons>
### Decision: <chosen option and tipping reason>
### Consequences:
- Makes easier: <what this unlocks>
- Makes harder: <what this costs>
- Revisit if: <what would change this decision>
```

## Principles

- Every new service, queue, cache, or database must justify operational cost.
- Start with the simplest design that can work.
- The best architecture is one the team can run.
- Split things that change independently. Combine things that change together.
- Do not choose technology before understanding the problem.
- Do not design for scale the system does not have.

## Failure thinking

- For every external dependency, ask what happens when it is down.
- For every write, ask what happens if it happens twice.
- For every async operation, ask what happens if it never completes.

## Output

Provide an executive summary, key decisions, boundaries/contracts, parallel workstreams, critical path, risks, and integration/testing strategy.
