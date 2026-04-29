# Type Design

Use when creating or reviewing domain models, public APIs, schemas, protocol types, state machines, or any type meant to enforce business rules.

## Core mission

Evaluate whether type designs express useful invariants and make invalid states hard or impossible to construct.

## Analysis framework

1. Identify invariants: consistency rules, state transitions, field relationships, preconditions, postconditions, and business rules.
2. Evaluate encapsulation: internals hidden, mutation guarded, public interface minimal and complete.
3. Assess expression: invariants communicated clearly through names, constructors, fields, and API shape.
4. Judge usefulness: invariants prevent real bugs and match business requirements.
5. Examine enforcement: construction validates, mutation points preserve rules, compile-time guarantees used where practical.

## Review output

```text
## Type: <TypeName>

### Invariants Identified
- ...

### Ratings
- Encapsulation: X/10
- Invariant Expression: X/10
- Invariant Usefulness: X/10
- Invariant Enforcement: X/10

### Strengths
...

### Concerns
...

### Recommended Improvements
...
```

## Principles

- Prefer compile-time guarantees over runtime checks when feasible.
- Value clarity over cleverness.
- Keep improvements pragmatic and proportionate.
- Make illegal states unrepresentable when the complexity is justified.
