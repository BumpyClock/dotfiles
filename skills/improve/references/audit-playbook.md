# Audit Playbook

What to look for, per category. Each subagent (or direct audit pass) gets the relevant section plus the **Finding format** at the bottom. Adapt depth to repo size — a 2K-line CLI gets a lighter pass than a 500K-line monorepo.

A finding is only a finding with evidence. "Probably has N+1 queries somewhere" is not a finding; `orders/api.ts:142 issues one query per order item inside a loop` is.

---

## Run the tools first

Before any reading pass, run whatever applies from this table (all read-only; skip tools that aren't installed rather than installing them). Machines have near-perfect recall on mechanical patterns; the model's job is judging their output — is this dead code load-bearing? is this duplication harmful? — and finding what tools can't.

| Purpose | Commands (pick per ecosystem) |
|---|---|
| Churn hotspots | `git log --format= --name-only \| sort \| uniq -c \| sort -rn \| head -30` — cross with file size/complexity; high churn × high complexity = audit here first |
| Dead code / unused exports | `knip`, `ts-prune`, `vulture` (Python), `deadcode` (Go); unused deps: `depcheck`, `cargo udeps` |
| Duplication | `jscpd --min-tokens 50 <src>` (works across languages) |
| Structural bug patterns | `ast-grep --lang <lang> -p '<pattern>'` — empty catch blocks, floating promises, non-null assertions, `as any` casts, `@ts-ignore` |
| Latent strictness | `tsc --noEmit --strict` on a non-strict repo — each new error is a candidate finding |
| Lint at max signal | repo's linter in check mode; if config is lax, one pass with recommended rules for the delta |
| Vulnerable deps | `npm audit` / `pip-audit` / `cargo audit` — critical/high only |
| Coverage | test suite with `--coverage` if cheap — measure the coverage shape, don't guess it |

Tool output is leads, not findings — every hit still gets the evidence/impact/confidence treatment below.

---

## 1. Correctness / Bugs

The highest-trust category — real bugs found by reading, not speculation.

- Error handling: swallowed exceptions, empty catch blocks, `catch (e) { console.log(e) }` on critical paths, missing error states in UI code.
- Async hazards: unawaited promises, race conditions on shared state, missing cancellation/cleanup (stale closures in React effects, listeners never removed).
- Null/undefined flows: non-null assertions (`!`) on values that can be null, optional chaining hiding a value that must exist, unchecked array indexing.
- Boundary conditions: off-by-one, empty-collection handling, timezone/locale assumptions, integer overflow in counters/IDs.
- State machines: impossible-state combinations representable in types, status enums with unhandled branches (look for `default:` that silently no-ops).
- Concurrency: check-then-act on shared resources, missing transactions around multi-write operations, idempotency of retried operations (webhooks, queues).
- Type escape hatches: `any` / `as` casts / `@ts-ignore` clusters — each one is a place the compiler was overruled.
- Resource leaks: unclosed handles, connections, subscriptions; missing `finally`.
- Missing timeouts: network calls, subprocess spawns, and lock acquisitions with no deadline — one slow dependency hangs the caller forever.
- Unbounded memory: whole-file/whole-table loads where streaming or pagination belongs, caches and maps that only grow, accumulating listeners/buffers.
- Retry hazards: retries without backoff/jitter (thundering herd), retrying non-idempotent operations, no retry cap.
- Money/precision: float arithmetic on currency, rounding at the wrong step, sum-of-rounded vs. rounded-sum drift.
- Cache invalidation: mutation paths that skip invalidating the cache their read path populates.

Anti-rule: don't report behavior as a bug solely because a helper's *name* implies a broader contract than its callers need — check the call sites before claiming the contract is violated.

## 2. Security

Report only what's evidenced in the code. Do not generate exploit code in plans — describe the fix.

**Handling rule:** never copy a secret value into a finding or plan — those files get committed. Reference the `file:line` and credential type only ("Stripe live key at `config.ts:12`"), and the fix sketch always includes rotation, not just removal (a committed secret is burned even after deletion).

**By-design is not a finding:** standard platform conventions are intentional behavior — honoring `https_proxy`/`NO_PROXY`, reading `~/.netrc`, an explicitly local dev tool shelling out to configured package managers. Flag these only when the *implementation* adds risk beyond the convention itself.

- Secrets: hardcoded keys/tokens/passwords, secrets in committed `.env` files, secrets logged or persisted in event/history stores.
- Injection: string-built SQL/shell commands, React's dangerous HTML inner property with user data, `eval`/`Function` on dynamic input, path traversal on user-supplied filenames.
- AuthN/Z: endpoints/server actions missing auth checks, authorization checked client-side only, IDOR (object access by ID without ownership check), missing CSRF protection on state-changing routes.
- Input validation: API boundaries trusting request bodies (no schema validation), file-upload handling (type/size/path), mass assignment from request objects.
- Dependencies: run the ecosystem's audit command (`npm audit`, `pip-audit`, `cargo audit`) in read-only mode; flag critical/high with known exploits, not the noise floor.
- Headers/config: CORS wildcard with credentials, missing CSP where it matters, cookies without `HttpOnly`/`Secure`/`SameSite`, debug/verbose modes reachable in production config.
- Data exposure: PII in logs, stack traces returned to clients, internal error details in API responses.

## 3. Performance

Look for the algorithmic and architectural wins, not micro-optimizations.

**Quantify or downgrade.** A perf finding without a number is LOW confidence and gets an "investigate" plan, not a "fix" plan. Pull the multiplier from what the repo gives you: row counts implied by the data model or seed data, payload bytes, calls-per-render, pagination defaults, loop bounds ("order list issues 1+N queries; fixtures seed ~200 orders → ~201 queries per page load"). Fix plans for perf findings must include a before/after measurement step in their done criteria — a fix that can't be measured can't be verified.

- N+1 patterns: query/fetch per item inside loops or per list-row rendering; missing batching or dataloader.
- Wrong complexity: nested scans over the same collection, repeated `find`/`filter` inside hot loops where a Map keyed lookup belongs.
- Caching gaps: identical expensive computations or fetches repeated per request/render; missing memoization at clear function boundaries; no HTTP/data-layer caching on stable data.
- Payload size: over-fetching (select *, full objects where IDs suffice), missing pagination on unbounded lists, large JSON shipped to clients.
- Frontend (if applicable): bundle composition (heavyweight deps for trivial use), missing code-splitting on rarely-hit routes, unoptimized images/fonts, client-side fetching for data available at render time, render waterfalls. For React/Next.js, defer to the repo's framework conventions and any installed best-practices guidelines.
- Backend: synchronous work that belongs in a queue, missing indexes implied by query patterns (flag for verification — don't claim without schema evidence), connection-per-request patterns where pooling exists.
- Build/CI: slow CI from missing caching, redundant pipeline steps, test suites that could parallelize.

## 4. Test Coverage

The goal is not a percentage — it's *which untested code is dangerous*.

- Map the critical paths (money, auth, data mutation, the feature the repo exists for) and check which have zero or trivial coverage.
- Modules with high churn (git log) + no tests = top refactor risk; flag as "characterization tests first" candidates.
- Existing test quality: tests that assert nothing meaningful, heavy mocking that tests the mocks, snapshot tests nobody reads, flaky patterns (real timers, real network, order dependence).
- Missing test layers: unit-only suites with zero integration coverage on API boundaries, or the inverse (slow E2E for what a unit test would catch).
- Verification infrastructure: is there a one-command way to know the codebase works? If not, that's finding #1 and a prerequisite plan for any risky change.

## 5. Tech Debt & Architecture

- Duplication: the same logic re-implemented in 3+ places (search for near-identical functions/components); divergent copies that have drifted.
- Layering violations: UI importing from data layer internals, circular dependencies, "utils" modules that became a junk drawer with high fan-in.
- Dead code: unexported-and-unused modules, feature flags fully rolled out but still branching, commented-out blocks with no explanation, deps in the manifest no longer imported.
- God objects/modules: files an order of magnitude larger than the repo median that everything touches; functions with double-digit parameters or deep conditional nesting.
- Inconsistent patterns: three ways of doing data fetching / error handling / styling in the same repo — pick the winner (the one the team converged on most recently) and plan the consolidation.
- Abstraction mismatches: premature abstractions with a single implementation, or missing abstractions where the same change always requires touching N files in lockstep.

## 6. AI Slop & Generated-Code Debt

LLM-generated code that landed without cleanup. Studies find 52–78% of generated code carries at least one smell, skewed toward long methods and globally-complex control flow (models optimize local token plausibility; individually-reasonable segments compound into complex functions). Each pattern is usually widespread once present — report the **pattern class** with 2–5 exemplar locations plus an estimated site count, not one finding per site.

- Comment slop: comments narrating the next line (`// increment counter`), changelog comments (`// updated to fix bug`), docstrings restating the signature, section-banner comments in short files.
- Defensive slop: try/catch around code that can't throw, null checks on values the types guarantee, validation of internally-produced data, redundant type guards after narrowing.
- Abstraction slop: single-use helpers and pass-through wrappers, shadow modules (thin layers that forward to another path without hiding real complexity), interfaces/base classes with exactly one implementation, config options nothing reads, "manager"/"handler"/"utils" layers with one caller.
- Naming slop: `enhanced`, `improved`, `V2`, `Final`, `comprehensive`, `Advanced` in identifiers; near-duplicate parallel functions from separate generation sessions that never got merged.
- Compat slop: backwards-compat shims, re-exports, and fallback branches for callers or states that never existed — check git history; if the "legacy" path never had users, it's slop. Watch for **dead legacy paths kept alive only by their own tests**: obsolete validators, schemas, adapters, and feature flags whose sole caller is the test suite.
- Silencing band-aids: broad lint/type disables, `any`/type-ignore casts, sleeps and arbitrary timeouts, path mutation hacks, fake success returns, checks removed to make the build pass — report when simplification (not restoration) is the honest fix.
- Manual registries: hand-maintained lists (exports, routes, plugin tables, switch dispatchers) that duplicate a source of truth the code could derive — every addition now requires a lockstep edit someone will forget.
- Test slop: tests that assert mock behavior, snapshot dumps nobody reviews, tests that cannot fail (asserting the value they just set), tests that mirror implementation internals or pin accidental private structure instead of behavior. Doc slop: README bloat, emoji-header docs, generated docs restating the code.
- Structural: methods far above repo-median length, deep nesting, cognitive complexity outliers — corroborate with the duplication/complexity tools from "Run the tools first".

**Every slop finding must name a concrete maintenance or runtime cost** in the cited files, and the preferred fix is deletion, consolidation, or reuse of an existing local pattern — never a new abstraction.

**Do not report**: file size alone, explicitly generated files, normal framework boilerplate, domain modules that merely look large, style taste, naming preference, broad architecture opinions, or speculative cleanup. Slop-hunting without these guardrails produces slop findings.

Planning rule: slop batches into **one plan per pattern class**, mechanical steps, done criterion a `grep`/`ast-grep` query returning zero matches. Ideal work for cheap executors.

## 7. Dependencies & Migrations

- Major-version lag on core framework/runtime (not every minor bump — the ones with real cost to staying behind: EOL, security-fix cutoffs, ecosystem incompatibility).
- Deprecated APIs in use that have announced removal timelines.
- Abandoned dependencies (no release in years, archived repos) on critical paths.
- Duplicate dependencies solving the same problem (two date libs, two HTTP clients).
- Lockfile/manifest drift, version pinning inconsistencies across a monorepo.
- For each migration candidate, estimate blast radius (files touched) — that drives effort and whether to recommend it at all.

## 8. DX & Tooling

- Missing or broken: typecheck script, lint config, formatter, pre-commit hooks, editorconfig.
- Slow feedback loops: dev-server or test startup measured in minutes, no watch mode, CI without caching.
- Onboarding friction: README setup steps that are wrong/incomplete, undocumented required env vars, no `.env.example`.
- Missing `CLAUDE.md`/`AGENTS.md` — for repos where agents will execute the plans, this is high-leverage: recommend one and include its outline as a plan.
- Error messages/logging: unstructured logs on services, missing request IDs/correlation, debugging requiring code changes.

## 9. Docs

Lowest default priority — only flag where absence has a concrete cost:

- Public API surface (published packages) without reference docs.
- Architectural decisions nobody can reconstruct (why X over Y) for actively-contested areas.
- Stale docs that are actively wrong (worse than missing) — setup instructions, API examples that no longer compile.

## 10. Direction — features & where to take this next

Forward-looking: not what's broken, but what this codebase wants to become. **Grounding rule:** every suggestion must cite evidence from the repo itself — a suggestion that could apply to any project in the category ("add dark mode", "add AI") is noise, not a finding. Sources of grounded direction signal:

- **Unfinished intent**: TODO/FIXME clusters around one theme, feature flags never rolled out, stubbed or half-built modules, commented-out feature code, abandoned mid-feature work visible in git history.
- **Stated-but-undelivered**: README/docs/roadmap promises with no corresponding code, CLI flags or config options that are no-ops, issue templates for features that don't exist.
- **Surface asymmetries**: one-directional pairs (export without import, create without bulk-create, webhooks out but not in), entities with CRUD minus one, a public API that internal code clearly needed and hand-rolled around.
- **The adjacent possible**: capabilities the existing architecture makes disproportionately cheap — a plugin system one interface away, a public API one route file from the existing service layer, an integration the data model already supports.
- **Friction worth productizing**: things users of this project evidently do by hand around it (visible in docs, examples, issues) that the project could absorb.

Direction findings use the standard format with two adaptations: **Impact** is product/user value (who wants this and why now), and **Confidence** reflects how grounded the evidence is — not certainty that it's the right call. Strategy belongs to the maintainer; the advisor's job is grounded options with honest trade-offs. Effort estimates here are coarser; say so. Plans for selected direction findings are usually a *design/spike plan* (investigate, prototype, define the API, list open questions) rather than a build-everything plan — scope them that way.

---

## Finding format

Every finding, from every category and every subagent, comes back in this shape:

```markdown
### [CATEGORY-NN] Short imperative title

- **ID**: stable slug `<category>-<primary-file-basename>-<short-slug>` (e.g. `bug-api-unawaited-retry`). Reused verbatim across runs so triage decisions and rejections stick to it.
- **Evidence**: `path/file.ts:123-127` — one-sentence description, plus a **verbatim quote (≤3 lines) copied exactly from those lines**. (Repeat per location; 2–5 strongest locations, note "and ~N similar sites" if widespread.) Quotes are mechanically validated against the repo after the audit — a finding whose quote doesn't match the file at the cited lines is dropped.
- **Impact**: What goes wrong / what's being paid because of this. Concrete: "every order-list render issues 1+N queries", not "suboptimal".
- **Failure scenario**: the concrete input/state → wrong output/crash, stated so it could be turned into a test. If you can't write one, the finding is LOW confidence at best. (Non-bug categories: the concrete situation where the cost is paid — "any new endpoint author copies this pattern", "page load on a 200-order account".)
- **Why tests miss it**: the nearest existing test(s) and why they don't catch this. Included tests are first-class evidence of intended behavior — if a test contradicts the suspected bug, skip the finding or downgrade to LOW and explain the conflict.
- **Effort**: S (hours) / M (a day-ish) / L (multi-day) — for the *fix*, including tests.
- **Risk**: What the fix could break; LOW/MED/HIGH plus one line why.
- **Confidence**: HIGH (read the code, certain) / MED (strong signal, needs verification) / LOW (smell, needs investigation). LOW-confidence findings may be reported but get an "investigate" plan, not a "fix" plan.
- **Fix sketch**: 1–3 sentences. Not the plan — just enough to judge effort honestly.
```

When the same root-cause pattern appears in multiple files, emit **one finding with multiple evidence refs**, not N copies — sibling duplicates inflate the table and fragment the fix.

## Prioritization rubric

Order findings by **leverage = impact ÷ effort, discounted by confidence and fix-risk**. Tiebreakers:

1. Anything that unblocks other findings (verification baseline, characterization tests) floats up.
2. Security findings with HIGH confidence float above equivalent-leverage non-security findings.
3. Prefer findings whose fix has a clean verification story — executor models succeed at those.
4. "Not worth doing" is a valid verdict; record it with one line of reasoning so the user knows it was considered.
