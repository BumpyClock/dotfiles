# Project Cleanup Audit Agent Prompt

Use this prompt to run a deep cleanup, dead-code, architecture, test, docs, and performance audit on any software project.

## Objective

Run thorough cleanup analysis of this project. Identify high-value opportunities:

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

## Language And Tool Discovery

Before spawning analysis agents:

1. Map repo shape:
   - languages
   - frameworks
   - package managers
   - build/test/lint/typecheck commands
   - monorepo workspaces
   - services/apps/libraries/packages
   - runtime entrypoints
   - public APIs
   - generated/noise dirs
   - storage/backends
   - CI/release paths
2. Read manifests:
   - `package.json`, `pnpm-workspace.yaml`, `yarn.lock`, `package-lock.json`
   - `go.mod`, `go.work`
   - `pyproject.toml`, `requirements*.txt`, `Pipfile`, `poetry.lock`, `uv.lock`
   - `Cargo.toml`, `Cargo.lock`
   - `pom.xml`, `build.gradle`, `settings.gradle`
   - `.csproj`, `.sln`, `Directory.Build.props`
   - `Gemfile`, `composer.json`, `mix.exs`, `pubspec.yaml`, `Package.swift`, etc.
3. Prefer project-native commands. Do not swap package managers or toolchains.
4. Use language-specific analyzers where available. If missing, note recommended tool rather than installing without permission.

## Recommended Analysis Tools

Use best-fit tools based on detected stack. Examples:

### Cross-language / general

- `rg`, `fd`, `find`, `wc`, `cloc`/`tokei`: shape, references, LOC hotspots.
- `git log`, `git blame`, `git ls-files`: churn, ownership, stale files, tracked source.
- `semgrep`: multi-language static patterns and security/code-quality checks.
- `CodeQL`: semantic security/error analysis for supported languages.
- `SonarQube`/`SonarCloud`: smells, complexity, duplication, coverage, security where configured.
- dependency graph tools, package manager audit commands, CI reports.
- profilers and tracing tools for real perf claims.

### JavaScript / TypeScript / Node / Web

- package manager: `npm`, `pnpm`, `yarn`, `bun` commands from repo.
- lint/typecheck: ESLint, TypeScript `tsc --noEmit`, framework checks.
- dead code/deps: `knip`, `ts-prune`, `depcheck`, `eslint --rule no-unused-vars`, `@typescript-eslint/no-unused-vars`.
- bundle/perf: framework build analyzers, source-map-explorer, webpack/vite/next bundle analyzer, Lighthouse/Web Vitals where relevant.
- tests: Jest, Vitest, Playwright, Cypress, Testing Library.

### Python

- lint/typecheck: Ruff, Pyright, mypy, pylint.
- dead code: Vulture, Skylos where appropriate; use confidence thresholds and whitelists.
- deps: pipdeptree, deptry, poetry/uv/pip tooling.
- perf: py-spy, cProfile, scalene, pytest-benchmark.
- tests: pytest, coverage.py branch/line reports.

### Go

- native: `go test ./...`, `go vet ./...`, `go list`, `go mod graph`, `go mod why`.
- static analysis: Staticcheck, govulncheck, golangci-lint if configured.
- dead code: Staticcheck `U1000`, `go list` package graph, exported-symbol reference checks.
- perf: `go test -bench`, `pprof`, `trace`, allocation profiles.

### Rust

- native: `cargo check`, `cargo test`, `cargo clippy`, `cargo tree`, `cargo metadata`.
- dead deps: `cargo machete`, `cargo udeps` when available.
- perf: Criterion, `cargo bench`, flamegraph, `perf`, `dhat`, `heaptrack`.
- complexity/build: `cargo bloat`, feature review, duplicate dependency review.

### Java / Kotlin / JVM

- native: Maven/Gradle test, check, dependency tasks.
- deps: `jdeps`, Maven dependency plugin, Gradle dependency analysis plugin.
- static analysis: SpotBugs, PMD, Checkstyle, Error Prone, Detekt, ktlint.
- perf: JFR, async-profiler, JMH.

### C# / .NET

- native: `dotnet build`, `dotnet test`, `dotnet format`.
- static analysis: Roslyn analyzers, .NET analyzers, NDepend if configured.
- deps: `dotnet list package`, NuGet audit tooling.
- perf: BenchmarkDotNet, dotnet-trace, dotnet-counters.

### C / C++

- native build system checks: CMake, Make, Ninja, Bazel, Meson.
- static analysis: clang-tidy, cppcheck, include-what-you-use.
- deps/build: linker maps, compile commands, unused include analysis.
- perf: perf, Valgrind/Callgrind, heaptrack, sanitizer builds.

### Ruby / Rails

- native: Bundler, Rails test tasks.
- static analysis: RuboCop, Sorbet/Steep if configured.
- dead code/deps: Coverband, rails_best_practices, bundle viz/dependency checks.
- perf: rack-mini-profiler, ruby-prof, derailed_benchmarks.

Use analogous ecosystem tools for other languages. Always explain tool limits and false-positive risk.

## Evidence Standard

Every finding must include:

- file path and symbol/function/type/module/config/doc
- category
- exact reason
- evidence commands or code references
- smallest viable cleanup
- impact
- effort
- confidence
- regression risk
- verification path

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

## Wave 0: Coordinator Boot

Coordinator:

1. Check git status and record dirty/untracked files. Do not touch them.
2. Read repo/agent instructions and canonical docs.
3. Map repo shape, languages, test commands, runtime entrypoints, storage/backends, major services, packages, and CI.
4. Identify generated/noise areas and explicit exclusions.
5. Select language-specific tools and commands. Note which are available vs missing.
6. Spawn Wave 1 lens agents in parallel.
7. Main job = merge, challenge, rank. Do not duplicate subagent work.

## Wave 1: Lens Agents

Spawn independent agents. Each must stay inside exclusions and return max 15 findings.

### 1. Dead Code / Deps Agent

Scope: whole repo except exclusions.

Find unused files, symbols, exports, routes, jobs, CLI commands, interfaces, config, flags, deps, assets, scripts, workflows, packages, stale tests, and orphan docs.

Use language-specific dead-code/dependency tools when available. Verify static-tool output manually before reporting.

### 2. Architecture / YAGNI / Design Agent

Scope: whole repo.

Find needless abstractions, leaky boundaries, interface bloat, over-layering, duplicated domain concepts, inappropriate inheritance/composition, unnecessary indirection, and abstractions with one caller or no variability.

Judge against the repo's paradigm. Do not force OO/SOLID framing onto functional, data-oriented, or script-style code where it does not fit.

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

### 6. Runtime / Config / Deployment Parity Agent

Scope: runtime entrypoints, env/config, storage/backends, migrations, deployment, CI, release, feature flags, platform-specific code.

Find config drift, local/prod mismatch, backend divergence, migration risk, environment assumptions, platform-specific breakage, missing test matrix coverage, and deployment-only dead paths.

Adapt scope to project type. For libraries, focus on public API compatibility and package metadata. For apps/services, focus on runtime behavior and deployment.

## Wave 1 Synthesis Gate

Coordinator:

1. Merge Wave 1 findings.
2. Deduplicate by underlying issue, not by file.
3. Build hotspot map.
4. Challenge weak evidence.
5. Select Wave 2 modules only where deeper analysis can change priority or confidence.

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
- Identify false-positive risks from dynamic language/runtime behavior.
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
- language-specific tools used or recommended

## Top 10 Cleanup Opportunities

Each:

- `[impact | effort | confidence]` title
- Category
- Files/Symbols
- Evidence
- Smallest viable cleanup
- Why now
- Regression risk
- Verification path

## Quick Wins

Low-risk deletions, dep removals, stale docs, obvious simplifications.

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
- JS/TS guidance often recommends entrypoint-aware graph tools such as Knip for unused files, exports, and dependencies: <https://knip.dev/>
- Knip configuration guidance stresses correct `entry` and `project` patterns, production mode, and targeted ignores: <https://knip.dev/guides/configuring-project-files>
- Python Vulture assigns confidence levels and expects whitelists for false positives from dynamic usage: <https://pypi.org/pypi/vulture>
- Go Staticcheck can find unused code and its docs call out build-tag/platform false positives for `U1000`: <https://staticcheck.dev/docs/running-staticcheck/cli/build-tags/>
- Staticcheck docs also recommend `-tests=false` when looking for code only used by tests: <https://staticcheck.dev/docs/running-staticcheck/cli/>
- Rust unused-dependency tools trade speed and precision: `cargo machete` is fast text matching, `cargo udeps` compiles and is slower/more precise: <https://rustprojectprimer.com/checks/unused.html>
- Java `jdeps` analyzes class/package/module dependencies and can identify unused qualified exports: <https://docs.oracle.com/en/java/javase/13/docs/specs/man/jdeps.html>
- General review guidance converges on design fit, functionality, complexity, tests, naming, and maintainability: <https://google.github.io/eng-practices/review/reviewer/looking-for.html>
- Go profiling docs reinforce measurement-based perf review with benchmark CPU/memory profiles: <https://go.dev/pkg/runtime/pprof/>
