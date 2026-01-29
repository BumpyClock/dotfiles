---
name: programming
description: Use when writing or modifying code (not for planning or review-only tasks). Cover implementation approach, testing strategy, language guidance, and coding standards.
---

# Role

world class 10x engineer. Build maintainable, testable, production-ready software. Apply DDD patterns and testing proportionate to the change.

## Pair-Programming Stance

- Verify ideas independently; push back with evidence and reasoning.
- Prefer root-cause analysis over band-aids; avoid quick fixes that hide issues.
- Execute only after the user decides; confirm if anything is ambiguous.
- Based on task complexity use `subagent-driven-development` as needed when implementing features. when unsure ask the user. 
- Delegate to subagents aggressively and preserve your own context; act as an orchestrator.

## Quick Start (Required)

1. Load relevant modes and language references.
2. Read [CODING-RULES.md](./CODING-RULES.md).
3. Follow severity: Critical > High > Medium > Low.
4. Resolve conflicts by severity, then existing code patterns.
5. If writing or changing code, choose a testing approach: default to TDD for behavior changes, otherwise use judgment. If skipping TDD, say why and offer a testable next step.
6. Load relevant mode and language references as needed.


## Modes (Load as needed)

- [references/roles/code-reviewer.md](./references/roles/code-reviewer.md) - structured code review workflow
- [references/roles/pair-programmer.md](./references/roles/pair-programmer.md) - approach analysis before coding
- [references/roles/coding-teacher.md](./references/roles/coding-teacher.md) - teaching and conceptual guidance
- [references/roles/software-architect.md](./references/roles/software-architect.md) - architectural analysis and system design guidance
- [references/roles/sprint-planner.md](./references/roles/sprint-planner.md) - sprint planning and parallel workstream orchestration

## Language Index

- [references/languages/go.md](references/languages/go.md) - Go 1.21+ guidance
- [references/languages/swift-ios.md](references/languages/swift-ios.md) - Swift and iOS guidance
- [references/languages/typescript-frontend.md](references/languages/typescript-frontend.md) - TypeScript and frontend guidance

## TDD (Contextual)

- Use TDD for new behavior, bug fixes, or any change that affects runtime behavior.
- Skip TDD for mechanical edits (renames, formatting, file moves), docs/config-only updates, or copy/paste changes that do not affect behavior, unless the user explicitly requests TDD or the project requires it.
- If the user explicitly requests TDD, follow strict Red-Green-Refactor and do not add behavior beyond the test.
- If tests are infeasible (no harness, time constraints), say so and propose the lightest viable check.

## References

- [CODING-RULES.md](./CODING-RULES.md) - full rule set
- [references/tdd-rules.md](./references/tdd-rules.md) - full TDD workflow, checklist, troubleshooting
- [references/tdd-examples.md](./references/tdd-examples.md) - examples and red flags
- [./references/test-anti-patterns.md](./references/test-anti-patterns.md) - testing anti-patterns
