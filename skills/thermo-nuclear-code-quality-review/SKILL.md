---
name: thermo-nuclear-code-quality-review
description: "Extremely strict maintainability review: abstraction quality, giant files/file size, spaghetti conditions. Thermo-nuclear code quality audit."
disable-model-invocation: true
---

# Thermo-Nuclear Code Quality Review

Strict maintainability review. Behavior working is not enough. Push for structure that makes code smaller, clearer, more direct, and easier to reason about without changing behavior.

## Scope

Review implementation quality, abstraction quality, modularity, file health, type/boundary clarity, orchestration, and codebase direction. Output backlog/review findings first. Do not edit code unless user asks.

For whole-codebase audits: inventory subsystems/entry points/generated dirs/tests/docs; shard by subsystem/concern, not file count; avoid overlapping write/review scopes; keep sub-reviewers read-only; synthesize, dedupe, reject weak findings, rank by future leverage; separate architectural debt from feature breadth; verify branch-dependent findings against current branch.

## Standards

- Be ambitious about structural simplification. Look for code-judo moves where existing architecture makes branches/helpers/modes/layers disappear.
- Prefer deleting complexity over rearranging it. Deletion beats extraction when both preserve behavior and clarity.
- No PR should push a file from <1k to >1k lines without strong reason. Ask for decomposition unless structure clearly justifies size.
- No spaghetti growth: ad-hoc conditionals, scattered special cases, flags, nullable modes, and one-off branches in busy flows are design smells.
- Cleaner design beats "it works." Do not approve refactors that move complexity without deleting concepts.
- Direct/boring/maintainable beats hacky/magical/generic. Thin wrappers, identity abstractions, pass-through helpers, and generic magic must earn keep.
- Type/boundary clarity matters. Question unnecessary optionality, `unknown`, `any`, casts, ad-hoc object shapes, and silent fallbacks hiding invariants.
- Logic belongs in canonical owner. Flag feature logic leaking into shared paths, implementation details leaking through APIs, wrong layer/package, or duplicate helper where canonical utility exists.
- Orchestration should be simple and atomic. Flag unnecessary sequential async and partial-update flows when parallel/transactional shape is clearer.
- New/existing abstraction is okay only when it removes more complexity than it adds or moves logic to canonical owner.
- Do not flatten into one file/function; ownership boundaries and file health still matter.

## Review Questions

- Is there a reframing that deletes whole categories of complexity?
- Did diff improve or worsen local architecture?
- Did cohesive module become more coupled/stateful/harder to scan?
- Is logic in right file/layer/package?
- Did file/component cross healthy size boundary?
- Are repeated conditionals signaling missing model/helper?
- Is abstraction earning its keep?
- Are casts/optionality/ad-hoc shapes obscuring invariant?
- Is orchestration more sequential or less atomic than needed?

## Tags

Use tags for narrow over-engineering findings:

- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled logic stdlib covers. Name API.
- `native:` dependency/custom code platform/framework/DB/browser/OS covers. Name feature.
- `yagni:` abstraction/config/layer with one impl/caller or no proven need.
- `shrink:` same behavior with fewer concepts/lines. Show smaller replacement when concise.

Complexity-only pass: one finding per line; include `net: -N lines possible` when meaningful and cheap. Nothing useful to cut → `Lean already. Ship.`

## Flag Aggressively

- Cleaner reframing deletes branches/helpers/modes/layers.
- Refactor moves code around without reducing concepts.
- File crosses 1000 lines due to PR.
- New conditionals bolt onto unrelated/busy paths.
- One-off booleans, nullable modes, flags complicate flow.
- Feature logic leaks into general-purpose modules.
- Generic magic hides simple structure.
- Thin wrappers/pass-through helpers add indirection without clarity.
- Casts/`any`/`unknown`/optional params muddy contract.
- Copy-paste replaces helper/canonical utility.
- Narrow edge-case logic lands in busy function.
- Tests pass but modularity/readability worsens.
- Temporary branch likely becomes permanent debt.
- Sequential async or partial updates add avoidable brittleness.

## Preferred Fixes

- Delete indirection instead of polishing it.
- Reframe state model so conditionals disappear.
- Move logic to canonical owner.
- Turn special cases into default flow with fewer exceptions.
- Extract focused helper/pure function when it reduces complexity.
- Split large file into focused modules.
- Put feature-specific logic behind dedicated boundary.
- Replace condition chains with typed model/dispatcher.
- Separate orchestration from business logic.
- Collapse duplicate branches.
- Reuse canonical helper.
- Make boundary types explicit.
- Parallelize independent work when it simplifies orchestration.
- Make related updates atomic.

## Output Priority

1. Structural regressions.
2. Missed dramatic simplification.
3. Spaghetti/branching growth.
4. Boundary/abstraction/type-contract issues.
5. File-size/decomposition concerns.
6. Modularity/ownership problems.
7. Legibility/maintainability issues.

Fewer high-conviction findings beat long nit lists. Findings should state location, problem, why it matters, and smallest safer fix.

## Approval Bar

Do not approve while these remain unjustified:

- Incidental complexity preserved when clear simplification exists.
- File grows from <1k to >1k lines.
- Ad-hoc branching tangles existing flow.
- Feature checks scatter across shared code.
- Wrapper/cast/optionality churn makes design more indirect.
- Logic duplicates helper or sits in wrong layer.
- Obvious decomposition would improve maintainability.

Tone: direct, serious, demanding. Do not soften major issues. Say when code makes codebase messier.
