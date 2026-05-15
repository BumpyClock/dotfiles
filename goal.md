## Objective

Run a thorough cleanup, dead-code, architecture, test, docs, and performance audit on any software project. Identify high-value opportunities:

- dead code
- unreachable or unused files, symbols, exports, routes, jobs, scripts, config, flags, deps, assets, docs, and tests
- YAGNI and needless architecture
- SOLID/design-boundary violations where relevant to project paradigm
- duplication and repeated domain concepts
- stale docs/comments
- weak tests that block safe cleanup
- time-complexity and performance wins
- dependency, build, packaging, CI, release, and runtime drift

Analysis only unless user explicitly asks for edits. Do not reset, clean, stash, delete, rename, reformat, or modify files. Respect dirty worktree.

Success = a ranked, evidence-backed cleanup backlog that answers:

- what can be deleted now
- what can be simplified now
- what needs tests, telemetry, owner confirmation, or staged rollout before cleanup
- what was investigated and rejected as false positive or low value

Treat "AI slop" as a triage lens, not an authorship accusation. Flag code as AI-slop-like only when it creates a cleanup opportunity and concrete evidence exists: one-off generic wrappers, interfaces with one implementation, fake configurability, hallucinated docs/tests, obvious comments, duplicated local implementations, broad edge-case machinery without product need, inconsistent style near adjacent code, or unused config/assets introduced with no runtime path.

## Ground Rules

- Read project instructions first: `AGENTS.md`, `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`, `docs/`, package docs, and any assistant-specific guidance.
- If repo has a docs-list command, run it before analysis.
- Respect repo-specific exclusions, generated code, vendored code, build output, lockfiles, snapshots, caches, migrations, generated SDKs, and third-party source.
- Treat prior reports and artifact folders as context only, not source of truth.
- Do not report findings without verifying current code.
- Prefer deletion and simplification over new abstraction.
- Drop speculative, taste-only, or style-only findings.
- Flag uncertainty instead of overstating it.
- For suspected dead code, search static references, runtime registration, tests, docs, config, build scripts, reflection/dynamic import paths, CLI entrypoints, plugin hooks, and public API boundaries.
- For perf claims, distinguish algorithmic complexity, allocation/I/O overhead, network/DB round trips, startup/build time, bundle size, and runtime hot paths.
- Do not install tools, change dependency graphs, run autofix, or apply analyzer suggestions without explicit user permission.
- Do not infer dead code from one command. Tool output is a lead; verified reachability is evidence.
- Do not label code AI-generated unless the repo metadata proves it. Use "AI-slop-like cleanup signal" for pattern-based findings.

## Cleanup Taxonomy

Classify every candidate into one or more categories:

- reachability dead code: files, symbols, exports, packages, routes, jobs, scripts, assets, configs, flags, docs, or tests with no verified live path
- unreachable statements: branches, functions, cases, handlers, or workflows that cannot execute from known entrypoints
- orphan runtime surface: public APIs, routes, CLIs, plugins, migrations, env vars, feature flags, queues, cron jobs, dashboards, or alerts not wired to current runtime
- needless abstraction: wrappers, adapters, interfaces, factories, base classes, hooks, services, or layers with no current variability or reuse
- duplication and drift: repeated logic, repeated domain concepts, forked helpers, parallel components, stale fixtures, or inconsistent naming/API shapes
- weak verification: tests/docs/comments that describe behavior not enforced by code or tests, generic assertions, skipped/deleted tests, stale snapshots, or missing regression coverage
- dependency/tooling waste: unused deps, overlapping deps, stale scripts, redundant CI steps, unpinned risky tools, bundle/build bloat, or release drift
- performance waste: repeated scans, N+1 I/O, avoidable allocations, repeated parsing/serialization, startup/build bottlenecks, missing indexes, or bad cache boundaries

## Project And Tool Discovery

Before spawning analysis agents:

1. Map repo shape:
   - languages
   - frameworks
   - package managers
   - build/test/lint/typecheck commands
   - monorepo workspaces
   - services/apps/libraries/packages
   - runtime entrypoints
   - import/dependency graph roots
   - call graph or handler graph where tools support it
   - public APIs
   - generated/noise dirs
   - storage/backends
   - CI/release paths
2. Read manifests, workspace files, dependency files, build config, runtime config, CI config, release config, and package metadata.
3. Prefer project-native commands. Do not swap package managers or toolchains.
4. Use ecosystem-specific analyzers when the repo already has them or when they clearly improve confidence. Pick tools with judgment based on the detected stack; do not hard-code this prompt to one language's tooling.
5. If a useful analyzer is missing, recommend it with a short reason instead of installing it without permission.

## Fast Code Path Mapping Tools

Before deeper analysis, build a fast map of code paths. Prefer repo-installed tools. If missing, recommend commands; do not install without permission.

Layer maps because no single tool sees all code paths:

- text map: `rg`, `fd`, `git ls-files`, `tokei`/`cloc` for files, symbols, TODOs, imports, routes, env keys, flags, commands, and generated/noise dirs
- syntax map: `ast-grep`/`sg`, Semgrep, Tree-sitter queries for syntax-aware matches such as route definitions, handler registrations, generic wrappers, one-method interfaces, broad try/catch blocks, TODO comments, and repeated component shapes
- symbol map: language servers, compiler indexes, code-intelligence indexes, or Universal Ctags for definitions, references, exported symbols, and public API surface
- import graph: dependency graph tools, package-manager graph commands, compiler metadata, and build-system graph commands for module/package relationships
- call/reachability graph: reachability analyzers, CodeQL, language/compiler call graphs, framework route manifests, job DAGs, DI containers, plugin registries, and runtime telemetry where available
- runtime/config graph: CI workflow `needs`, Docker/compose/k8s manifests, env schemas, feature flags, queue/job registration, cron schedules, migrations, route files, OpenAPI/GraphQL schemas, and deployment manifests

Tool limits:

- `ast-grep` is best for quick structural search and recurring code-shape detection. It is not a type checker or full reachability analyzer.
- Tree-sitter is best for fast parsing and custom AST queries across many languages. It does not understand runtime wiring by itself.
- Ctags/LSP/SCIP indexes are best for jump-to-definition and find-references style maps. They may miss framework magic, generated code, dynamic import, reflection, and external consumers.
- Import graph tools are best for dependency edges, orphans, circular deps, and layering checks. They do not prove runtime use.
- CodeQL/Semgrep are best for semantic/static-analysis rules and known bad patterns. Findings still need repo-context verification.

Minimum path-map output before Wave 1:

- entrypoints and graph roots
- public/boundary surfaces
- top-level import/dependency graph summary
- route/job/plugin/config registration surfaces
- generated/noise exclusions
- dynamic/runtime mechanisms that can hide references
- missing tools that would materially improve confidence

## Tool Selection Principles

Use best-fit tools based on detected stack and repo conventions. Let agents choose ecosystem-specific tools after discovery instead of following a fixed cookbook.

- Prefer tools already configured in repo over introducing new ones.
- Prefer project-native build, lint, typecheck, test, package, and dependency commands.
- Prefer graph/reachability tools for deletion claims; syntax tools alone are not enough.
- Prefer analyzers that understand project config, workspace boundaries, generated files, and framework conventions.
- Prefer profilers, benchmarks, query plans, bundle reports, or telemetry for performance claims.
- Prefer CI reports and existing dashboards for flake/build/runtime parity claims.
- Always explain tool limits, false-positive risk, missing config, and missing analyzer coverage.

## Evidence Standard

Every finding must include:

- file path and symbol/function/type/module/config/doc
- category and live path status: live, test-only, config-only, generated, external-public, unresolved, or likely dead
- exact reason
- evidence commands or code references
- entrypoints, graph roots, or runtime registrations checked
- false-positive gates passed and remaining uncertainty
- smallest viable cleanup
- decision: delete now, simplify now, needs tests, needs telemetry, needs owner confirmation, track later, or reject
- impact
- effort
- confidence
- regression risk
- verification path
- AI-slop-like signal, if applicable, stated as a pattern with evidence rather than an authorship claim

For time-complexity/perf findings also include:

- current complexity or cost model
- bottleneck
- lower-cost option
- expected complexity/cost after change
- tradeoff
- worth-doing verdict
- benchmark/profiling path

## False-Positive Gates

Before reporting unused/dead code, check:

- public API exports, package entrypoints, CLI commands, route registration, plugin discovery, reflection, dynamic imports, dependency injection, serialization, migrations, templates, generated code, feature flags, build tags, platform tags, test-only paths, docs examples, and external consumers.
- production vs test-only use. Test-only use can still indicate stale production code, but label it precisely.
- multi-platform and multi-config builds. Run or reason across relevant build tags, OS targets, feature flags, editions, profiles, or workspaces.
- generated and vendored files. Usually exclude; if generated source is checked in, audit generator instead.
- framework conventions: file-system routes, static assets, templates, i18n files, GraphQL/OpenAPI schemas, test fixtures, codegen inputs, and metadata files.
- dynamic runtime features: reflection, decorators, metaprogramming, dependency injection containers, plugin registries, string-based imports, env-selected implementations, and optional integrations.
- CI/deploy surfaces: GitHub Actions `needs`, matrix builds, Docker/Kubernetes manifests, release scripts, env vars, secrets names, cron jobs, queue names, and cloud resource references.
- external contract surfaces: package exports, SDK APIs, CLI commands, webhook payloads, migration history, DB schemas, analytics events, and documented examples.

## Scoring And Prioritization

Rank findings with consistent scores. Use 1-5 unless the repo defines a better rubric.

- Impact: maintenance drag, correctness risk, performance cost, security/dependency risk, build/runtime cost, user-facing risk.
- Effort: smallest viable PR size, migration complexity, test cost, rollout cost, owner coordination.
- Confidence: number and quality of independent evidence sources, analyzer precision, runtime proof, verifier agreement.
- Regression risk: public surface, runtime criticality, dynamic references, weak tests, data/storage coupling.
- Urgency: active churn, flaky CI, security exposure, release blocker, cost growth, or repeated AI-slop-like pattern.

Decision buckets:

- Delete now: no live path, low regression risk, verification command exists.
- Simplify now: needless abstraction or duplication with clear equivalent behavior and focused tests.
- Add tests first: cleanup is likely right but behavior lacks regression coverage.
- Need runtime proof: static analysis cannot see dynamic/plugin/reflection/runtime use.
- Need owner confirmation: public API, customer contract, migration/data, or production-only path.
- Track later: true issue but low impact or high coordination cost.
- Reject: false positive, style-only, speculative, or not worth churn.

Optional WSJF for large backlogs: `WSJF = (business_value + time_criticality + risk_reduction) / effort`. Sort by severity first, then WSJF. Security/dependency/runtime parity blockers can outrank WSJF.

## Wave 0: Coordinator Boot

Coordinator:

1. Check git status and record dirty/untracked files. Do not touch them.
2. Read repo/agent instructions and canonical docs.
3. Map repo shape, languages, test commands, runtime entrypoints, storage/backends, major services, packages, public APIs, and CI.
4. Build the fast code path map from text, syntax, symbol, import, call/reachability, and runtime/config layers.
5. Identify generated/noise areas and explicit exclusions.
6. Select ecosystem/repo-specific tools and commands. Note which are available vs missing.
7. Spawn Wave 1 lens agents in parallel.
8. Main job = merge, challenge, rank. Do not duplicate subagent work.

## Wave 1: Lens Agents

Spawn independent agents. Each must stay inside exclusions and return max 15 findings.

Each Wave 1 agent must return:

- findings with evidence and decision bucket
- commands/tools used
- tool limits and false-positive risks
- false-positive checks performed
- rejected claims worth mentioning
- missing tests, telemetry, owner confirmation, or runtime proof needed

### 1. Dead Code / Deps Agent

Scope: whole repo except exclusions.

Find unused files, symbols, exports, routes, jobs, CLI commands, interfaces, config, flags, deps, assets, scripts, workflows, packages, stale tests, and orphan docs.

Separate unused-symbol findings from unreachable-code findings. Use repo-appropriate dead-code/dependency tools when available. Verify static-tool output manually before reporting.

Required checks:

- graph roots and entrypoints
- production vs test-only reachability
- config/runtime/deploy references
- dynamic import/reflection/plugin/DI paths
- external/public API boundaries
- analyzer false-positive notes

### 2. Architecture / YAGNI / Design Agent

Scope: whole repo.

Find needless abstractions, leaky boundaries, interface bloat, over-layering, duplicated domain concepts, inappropriate inheritance/composition, unnecessary indirection, and abstractions with one caller or no variability.

Judge against the repo's paradigm. Do not force OO/SOLID framing onto functional, data-oriented, or script-style code where it does not fit.

For each abstraction finding, answer:

- what current variability exists
- number of call sites or implementations
- simpler direct shape
- behavior/test risk
- why now vs leave alone

### 3. Complexity / Maintainability Agent

Scope: whole repo.

Find oversized files/functions/classes/modules, confusing control flow, high coupling, repeated logic, difficult-to-change hotspots, and naming/API contracts that obscure intent.

Use metrics if available: cyclomatic/cognitive complexity, LOC, churn, dependency graph fan-in/fan-out.

### 4. Time-Complexity / Performance Agent

Scope: whole repo.

Find nested scans, repeated DB/API calls, N+1 patterns, avoidable allocations, repeated parsing/serialization, sync/blocking work on hot paths, missing indexes, expensive startup/build steps, bundle bloat, bad cache boundaries, and pathological algorithms.

Each finding must include current complexity, bottleneck, better complexity, tradeoff, and worth-doing verdict.

Prefer profiling, benchmark, query-plan, and production telemetry evidence when available. If unavailable, mark as static-analysis suspicion.

### 5. Tests / Docs / Comments Agent

Scope: tests, docs, comments, examples, CI, fixtures.

Find stale docs/comments, missing docs for public APIs or operational behavior, weak coverage around risky code, flaky/slow tests, missing regression tests, stale fixtures/snapshots, and test gaps that block safe cleanup.

Flag hallucinated or low-value tests/docs when claims are not grounded in code, commands, examples, config keys, API paths, or executable assertions.

### 6. Runtime / Config / Deployment Parity Agent

Scope: runtime entrypoints, env/config, storage/backends, migrations, deployment, CI, release, feature flags, platform-specific code.

Find config drift, local/prod mismatch, backend divergence, migration risk, environment assumptions, platform-specific breakage, missing test matrix coverage, and deployment-only dead paths.

Adapt scope to project type. For libraries, focus on public API compatibility and package metadata. For apps/services, focus on runtime behavior and deployment.

### 7. AI-Slop-Like Pattern Agent

Scope: whole repo, using the code path map and local project conventions.

Find cleanup opportunities that look like overgeneration or prompt-shaped code:

- generic wrappers around already-good APIs
- one-method interfaces, one-impl factories, one-caller helpers, unnecessary base classes
- fake flexibility: config/env/flags/options with no real alternate path
- duplicated local implementations of common behavior instead of established helpers/libs
- broad defensive branches for edge cases not represented in product behavior, tests, or docs
- obvious comments, commented-out code, or comments that narrate syntax instead of constraints
- tests with generic assertions, no boundary/negative cases, or assertions unrelated to behavior
- docs/examples that mention nonexistent commands, config, APIs, env vars, or flows
- files whose style, naming, or architecture sharply diverges from adjacent code without reason

Do not infer authorship. Report only the cleanup opportunity and concrete repo evidence.

## Wave 1 Synthesis Gate

Coordinator:

1. Merge Wave 1 findings.
2. Deduplicate by underlying issue, not by file.
3. Build hotspot map.
4. Challenge weak evidence.
5. Score impact, effort, confidence, regression risk, and urgency.
6. Assign decision bucket.
7. Select Wave 2 modules only where deeper analysis can change priority or confidence.

Hotspot criteria:

- same file/module flagged by 2+ agents
- high-risk runtime path
- public API or external contract
- high LOC/churn/coupling
- storage/backend/deployment parity area
- perf-sensitive path
- many interfaces/adapters or plugin points
- weak tests blocking cleanup
- large dependency or build cost
- repeated AI-slop-like pattern across unrelated modules
- rejected findings cluster around one tool limitation or dynamic runtime mechanism

Do not spawn one-agent-per-dir blanket scans.

## Wave 2: Module Deep Dives

For each hotspot, spawn one module agent with:

- exact path scope
- relevant Wave 1 findings to validate/refute
- questions to answer
- output max 10 findings
- confirmed vs rejected Wave 1 claims
- tests/commands needed to safely clean it up

Deep-dive prompts should be project-specific after Wave 1 reveals hotspots.

## Wave 3: Adversarial Verifier

Spawn verifier after Wave 2.

Verifier task:

- Try to disprove top 20 findings.
- Check cited files, symbols, commands, and tool outputs.
- Reject weak evidence, duplicate claims, stale artifact claims, and style-only claims.
- Confirm smallest viable cleanup and regression risk.
- Identify false-positive risks from dynamic/runtime behavior.
- Add confidence adjustments.

## Final Report Contract

Produce final report:

# Codebase Cleanup Audit

## Executive Summary

2-4 sentences. Biggest themes only.

## Project Map

- languages/frameworks
- package managers/toolchains
- entrypoints
- tests/build/lint commands
- generated/noise exclusions
- tools used or recommended

## Fast Code Path Map

- graph roots and entrypoints
- public/boundary surfaces
- import/dependency graph summary
- call/reachability graph summary where available
- route/job/plugin/config registration surfaces
- dynamic/runtime mechanisms that limit static confidence
- missing tools that would materially improve confidence

## Scoring Rubric

- score definitions used for impact, effort, confidence, regression risk, and urgency
- decision buckets used
- any hard blockers or project-specific prioritization rules

## Top 10 Cleanup Opportunities

Each:

- `[impact | effort | confidence | risk | decision]` title
- Category
- Files/Symbols
- Evidence
- Live path status
- False-positive checks
- Smallest viable cleanup
- Why now
- Regression risk
- Verification path
- AI-slop-like signal, if relevant

## Quick Wins

Low-risk deletions, dep removals, stale docs, obvious simplifications.

## AI-Slop-Like Cleanup Signals

Pattern-based cleanup opportunities only. Do not claim authorship unless repo metadata proves it.

## Strategic Refactors

Needs design/plan before code.

## Time-Complexity / Performance Wins

Include current complexity, bottleneck, better complexity, tradeoff, worth-doing verdict, and benchmark/profiling path.

## Deletion / De-scope Candidates

Likely removable code/config/deps/docs, with false-positive risks called out.

## Dependency / Build / Tooling Cleanup

Unused deps, over-broad features, redundant tooling, slow build/test steps, stale scripts, CI simplification.

## Test / Docs Gaps

Coverage/doc updates needed before safe cleanup.

## Rejected / Low-Confidence Findings

Important claims checked and dropped, with reason.

## Suggested Execution Order

Small PR sequence. Prefer deletion first, then tests, then refactors, then perf changes needing benchmarks.

## Research Notes Behind This Prompt

- Dead-code prompts online emphasize aggressive but verified reachability checks and broad symbol/file/dependency coverage: <https://www.josecasanova.com/prompts/dead-code-audit>
- `ast-grep` and Tree-sitter are useful for fast AST-based structural search and custom syntax maps, but they do not prove reachability: <https://ast-grep.github.io/> and <https://tree-sitter.github.io/tree-sitter/>
- SCIP/LSIF-style indexes support definitions, references, and implementations across stacks: <https://github.com/sourcegraph/scip>
- Entry-aware graph tools and dependency graph tools help expose unused files/exports/deps, module edges, orphans, circular deps, and layering violations; tune roots and project boundaries to reduce false positives.
- Static dead-code analyzers vary in precision. Prefer confidence levels, whitelists/suppressions with rationale, and explicit notes about dynamic/runtime blind spots.
- Meta's SCARF dead-code cleanup shows static analysis alone can miss dynamic/runtime references, so augmented dependency graphs improve deletion confidence: <https://engineering.fb.com/2023/10/24/data-infrastructure/automating-dead-code-cleanup/>
- General review guidance converges on design fit, functionality, complexity, tests, naming, and maintainability: <https://google.github.io/eng-practices/review/reviewer/looking-for.html>
- GitHub's AI-generated-code review guidance and Microsoft engineering review guidance both emphasize human validation of AI output, unnecessary abstractions, API surface, tests, and resource/config patterns: <https://docs.github.com/en/copilot/tutorials/review-ai-generated-code> and <https://devblogs.microsoft.com/dotnet/developer-and-ai-code-reviewer-reviewing-ai-generated-code-in-dotnet/>
- Semgrep and CodeQL are useful for semantic/static rules, security, and quality checks, but findings still need repo-context verification: <https://semgrep.dev/docs/running-rules/> and <https://docs.github.com/en/code-security/code-scanning/managing-your-code-scanning-configuration/codeql-query-suites>
- Performance cleanup guidance converges on measurement: prefer benchmark, profile, query-plan, bundle, CI timing, or telemetry evidence over static suspicion.
