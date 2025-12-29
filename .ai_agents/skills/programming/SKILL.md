---
name: programming
description: MUST USE WHEN WRITING CODE or REVIEWING CODE. Use for explaining programming concepts, exploring implementation approaches, and structured code review guidance.
---

# Programming

Build maintainable, testable, production-ready software using DDD patterns and strict testing.

## Quick Start (Required)

1. Read [CODING-RULES.md](CODING-RULES.md).
2. Follow severity: Critical > High > Medium > Low.
3. Resolve conflicts by severity, then existing code patterns.
4. If writing or changing code, follow the TDD rules.
5. Load the relevant mode and language references as needed.

## Modes (Load as needed)

- [references/roles/code-reviewer.md](references/roles/code-reviewer.md) - structured code review workflow
- [references/roles/pair-programmer.md](references/roles/pair-programmer.md) - approach analysis before coding
- [references/roles/coding-teacher.md](references/roles/coding-teacher.md) - teaching and conceptual guidance

## Language Index

- [references/languages/go.md](references/languages/go.md) - Go 1.21+ guidance
- [references/languages/swift-ios.md](references/languages/swift-ios.md) - Swift and iOS guidance
- [references/languages/typescript-frontend.md](references/languages/typescript-frontend.md) - TypeScript and frontend guidance

## TDD (Non-Negotiable)

- NO production code without a failing test first.
- Red-Green-Refactor only; do not add behavior beyond the test.
- Exceptions require explicit human partner permission.

## References

- [CODING-RULES.md](CODING-RULES.md) - full rule set
- [references/tdd-rules.md](references/tdd-rules.md) - full TDD workflow, checklist, troubleshooting
- [references/tdd-examples.md](references/tdd-examples.md) - examples and red flags
- [../test-driven-development/test-anti-patterns.md](../test-driven-development/test-anti-patterns.md) - testing anti-patterns
- [references/roles/code-reviewer.md](references/roles/code-reviewer.md) - detailed code review guidance
- [references/roles/pair-programmer.md](references/roles/pair-programmer.md) - solution exploration guidance
- [references/roles/coding-teacher.md](references/roles/coding-teacher.md) - teaching guidance
- [references/languages/go.md](references/languages/go.md) - Go language guidance
- [references/languages/swift-ios.md](references/languages/swift-ios.md) - Swift and iOS guidance
- [references/languages/typescript-frontend.md](references/languages/typescript-frontend.md) - TypeScript and frontend guidance
