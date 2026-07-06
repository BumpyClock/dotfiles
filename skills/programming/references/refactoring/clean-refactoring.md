# Clean Refactoring

Use when a change reveals duplicate concepts, local adapters, obsolete owners, compatibility wrappers, parallel abstractions, or pressure to tack code beside an existing path.

Core rule: refactoring replaces the old shape with the simpler shape the codebase would want today. It should leave one concept with one clear owner and clear consumers.

## Workflow

1. Name the duplicated concept: config source, pricing rule, geometry source, state machine, data contract, renderer phase, API shape, UI state, test oracle, or derived value.
2. Find current owners and consumers before editing.
3. Treat wrappers, aliases, pass-local constants, copied structs, temporary branches, and compatibility paths as sediment until proven necessary.
4. Pick the natural owner: the module that would own the concept if designed from scratch.
5. Move consumers to that owner directly.
6. Delete or collapse the stale path in the same pass when feasible.
7. If a bridge must stay, make it tiny, name it as compatibility, and write its removal condition.
8. Verify through consumers that used to diverge, not only through the new owner module.

## Rules

- Do not let sunk cost decide architecture. Size the refactor by end-state quality, behavior risk, and reviewability, not by how much old code exists.
- Search before building a new mechanism. Reuse, consolidate near-duplicates, extract shared core, or build new deliberately after seeing what exists.
- Prefer one shared primitive over N adapters. Adapters belong at external boundaries or short-lived migrations.
- Do not preserve dev-only compatibility by default. Unshipped scaffolding should move to the clean contract immediately.
- Do not re-derive values already owned elsewhere. Export or consume the owner's computed value so checks and consumers share one source of truth.
- When divergence was the bug class, make ownership visible in tests, debug output, logs, or stats.
- Use real or asymmetric fixtures/assets for orientation, geometry, layout, ordering, and framing bugs. Symmetric placeholders can hide flipped coordinate frames or swapped axes.
- If behavior must survive, pin it with tests at the consumer surface, then change architecture underneath.
- Update docs/specs with the new invariant and owner, not a mechanical file list.
- If scope widens into unrelated behavior, slice it: land the shared contract first, then port consumers in reviewable passes.

## Smells

- Same business rule in two modules.
- Config read in many places with local defaults.
- Adapter that only renames fields between internal shapes.
- Test oracle computes the expected value by duplicating production logic.
- Compatibility wrapper with no removal trigger.
- "Temporary" branch older than the feature it supported.
- New abstraction exists for one caller and no clear boundary.

## Verification

- Consumer-level tests or focused integration checks cover paths that used to diverge.
- Old and new surfaces report or exercise the same source of truth.
- Stale owner/adapter path is deleted, or remaining bridge has explicit removal condition.
- Diff does not include unrelated cleanup.
