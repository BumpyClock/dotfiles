---
name: thermo-nuclear-code-quality-review
description: "Extremely strict maintainability review: abstraction quality, giant files/file size, spaghetti conditions. Thermo-nuclear code quality audit."
disable-model-invocation: true
---

# Thermo-Nuclear Code Quality Review

Unusually strict review focused on implementation quality, maintainability, abstraction quality, codebase health.

Be **ambitious** about structure. Don't stop at local cleanup. Search for "code judo" moves: restructurings preserving behavior while making implementation dramatically simpler, smaller, more direct, more elegant.

## Team Mode for Whole-Codebase Audits

Use team/parallel mode for whole-codebase thermo-nuclear review, deep audit across subsystems, or explicit request for agents/parallel subagents.

1. Inventory subsystems, entry points, generated folders, tests, docs before dispatch.
2. Shard by subsystem/concern, not file count. Avoid overlapping write/review scopes.
3. Sub-reviewers read-only. Return high-conviction structural findings with evidence paths, why it matters, smallest cleanup path.
4. Synthesizer pass: dedupe, reject weak findings, rank by future leverage, separate genuine architectural debt from feature breadth.
5. Don't edit code unless user asks for implementation. Output backlog first.
6. Verify branch-dependent findings against current branch before including as actionable.

## Core Prompt

> Perform a deep code quality audit of the current branch's changes.
> Rethink how to structure / implement the changes to meaningfully improve code quality without impacting behavior.
> Work to improve abstractions, modularity, reduce Spaghetti code, improve succinctness and legibility.
> Be ambitious, if there is a clear path to improving the implementation that involves restructuring some of the codebase, go for it.
> Be extremely thorough and rigorous. Measure twice, cut once.

## Non-Negotiable Standards

Apply core prompt plus these rules:

0. **Be ambitious about structural simplification.** Look for reframings where whole branches/helpers/modes/conditionals/layers disappear. Prefer solutions making code feel inevitable. Assume a "code judo" move exists: re-organization using existing architecture more effectively. Prefer deleting complexity over rearranging it.

1. **File size: no PR pushes a file from <1k to >1k lines without strong reason.** Strong code-quality smell by default. Prefer extracting helpers/subcomponents/modules/abstractions. If diff crosses threshold, explicitly ask whether decomposition needed first. Waive only with compelling structural reason + clearly organized result.

2. **No random spaghetti growth.** Suspicious of ad-hoc conditionals, scattered special cases, one-off branches in unrelated flows. "Weird if statements in random places" = design problem. Push logic into dedicated abstraction/helper/state machine/policy/separate module. Call out changes making surrounding code harder to reason about.

3. **Bias toward cleaner design, not just working code.** Same behavior + cleaner structure → push for cleaner version. Don't rubber-stamp "it works" implementations leaving codebase messier. Prefer simplifications removing moving pieces over refactors spreading same complexity.

4. **Direct, boring, maintainable > hacky/magical.** Brittle/ad-hoc/"magic" behavior = code-quality problem. Skeptical of generic mechanisms hiding simple data-shape assumptions. Flag thin abstractions, identity wrappers, pass-through helpers adding indirection without clarity.

5. **Type and boundary cleanliness.** Question unnecessary optionality, `unknown`, `any`, cast-heavy code where clearer boundary could exist. Prefer explicit typed models/shared contracts over loosely-shaped ad-hoc objects. Silent fallback papering over unclear invariant → ask whether boundary should be explicit.

6. **Logic in canonical layer, reuse existing helpers.** Call out feature logic leaking into shared paths or implementation details leaking through APIs. Prefer existing canonical utilities over bespoke one-offs. Push code toward right package/service/module.

7. **Unnecessary sequential orchestration + non-atomic updates = smell.** Independent work serialized for no reason → ask about parallel. Related updates can leave state half-applied → push for atomic structure. Don't micro-optimize, but flag avoidable orchestration brittleness.

## Review Questions (per meaningful change)

- Is there a code-judo move making this dramatically simpler?
- Can this be reframed so fewer concepts/branches/helper layers needed?
- Does this improve or worsen local architecture?
- Did diff add branching complexity where better abstraction should exist?
- Did a previously cohesive module become more coupled/stateful/harder to scan?
- Is logic in right file and layer?
- Did change enlarge file/component past healthy size boundary?
- Repeated conditionals signaling missing model or helper?
- Implementation direct and legible, or relies on special cases + incidental control flow?
- Abstraction earning its keep, or just a wrapper?
- Casts/optionality/ad-hoc object shapes obscuring real invariant?
- Logic in canonical layer, or leaked across boundary?
- Orchestration more sequential/less atomic than needed?

## What to Flag Aggressively

- Complicated implementation where cleaner reframing deletes whole categories of complexity
- Refactors moving code around without reducing concepts reader must hold
- File crossing 1000 lines due to PR, especially if splittable
- New conditionals bolted onto unrelated code paths
- One-off booleans/nullable modes/flags complicating existing control flow
- Feature-specific logic leaking into general-purpose modules
- Generic "magic" handling hiding simple structure
- Thin wrappers/identity abstractions adding indirection without simplification
- Unnecessary casts/`any`/`unknown`/optional params muddying real contract
- Copy-pasted logic instead of extracted helpers
- Narrow edge-case handling in middle of already busy function
- Refactors passing tests but making code less modular/readable
- "Temporary" branching likely to become permanent debt
- Bespoke helpers where canonical utility already exists
- Logic in wrong layer/package when more central home exists
- Sequential async where independent work could be parallel
- Partial-update logic leaving state less atomic than necessary

## Preferred Remedies

- Delete whole layer of indirection rather than polishing it
- Reframe state model so conditionals disappear instead of centralized
- Change ownership boundary so feature becomes natural extension of existing abstraction
- Turn special-case logic into simpler default flow with fewer exceptions
- Extract helper or pure function
- Split large file into smaller focused modules
- Move feature-specific logic behind dedicated abstraction
- Replace condition chains with typed model or explicit dispatcher
- Separate orchestration from business logic
- Collapse duplicate branches into single clearer flow
- Delete wrappers not meaningfully clarifying API
- Reuse existing canonical helper instead of near-duplicate
- Make type boundaries more explicit so control flow gets simpler
- Move logic to package/module/layer already owning the concept
- Parallelize independent work when it simplifies orchestration
- Restructure related updates into more atomic flow

Don't stop at "maybe rename this" when real issue is structural.
Don't accept cleaner version of same messy idea when simpler idea is plausible.

## Review Tone

Direct, serious, demanding. Not rude, but don't soften major issues into mild suggestions. Code making codebase messier → say so clearly. Missed dramatic simplification opportunity → say that clearly.

Good phrases:
- `this pushes the file past 1k lines. can we decompose this first?`
- `this adds another special-case branch into an already busy flow. can we move this behind its own abstraction?`
- `this works, but it makes the surrounding code more spaghetti. let's keep the behavior and restructure the implementation.`
- `this feels like feature logic leaking into a shared path. can we isolate it?`
- `this abstraction seems unnecessary. can we just keep the direct flow?`
- `why does this need a cast / optional here? can we make the boundary more explicit instead?`
- `this looks like a bespoke helper for something we already have elsewhere. can we reuse the canonical one?`
- `i think there's a code-judo move here that makes this much simpler. can we reframe this so these branches disappear?`
- `this refactor moves complexity around, but doesn't really delete it. is there a way to make the model itself simpler?`

## Output Priority

1. Structural code-quality regressions
2. Missed dramatic simplification / code-judo opportunities
3. Spaghetti / branching complexity increases
4. Boundary / abstraction / type-contract problems
5. File-size and decomposition concerns
6. Modularity and abstraction issues
7. Legibility and maintainability concerns

Don't flood with low-value nits when larger structural issues exist. Fewer high-conviction comments > long cosmetic list.

## Approval Bar

Don't approve merely because behavior seems correct. Bar:

- No structural regression
- No missed opportunity to make implementation dramatically simpler
- No unjustified file-size explosion
- No spaghetti-growth from special-case branching
- No hacky/magical abstraction making code harder to reason about
- No unnecessary wrapper/cast/optionality churn obscuring real design
- No architecture-boundary leak or canonical-helper duplication
- No missed obvious decomposition improving maintainability

Presumptive blockers unless author justifies clearly:

- PR preserves incidental complexity when code-judo move would delete it
- PR pushes file from <1000 to >1000 lines
- PR adds ad-hoc branching tangling existing flow
- PR scatters feature checks across shared code
- PR adds unnecessary abstraction/wrapper/cast-heavy contract making design more indirect
- PR duplicates existing helper or puts logic in wrong layer when canonical home exists

If conditions not met, leave explicit actionable feedback, push for cleaner decomposition.
