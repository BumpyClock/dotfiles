---
name: programming
description: MUST USE WHEN WRITING CODE or REVIEWING CODE.
---

# Programming

Build maintainable, testable, production-ready software using DDD patterns and strict testing.

## Quick Start (Required)

1. Read [CODING-RULES.md](CODING-RULES.md).
2. Follow severity: Critical > High > Medium > Low.
3. Resolve conflicts by severity, then existing code patterns.

## TDD (Non-Negotiable)

- NO production code without a failing test first.
- Red-Green-Refactor only; do not add behavior beyond the test.
- Exceptions require explicit human partner permission.

## References

- [CODING-RULES.md](CODING-RULES.md) - full rule set
- [references/tdd-rules.md](references/tdd-rules.md) - full TDD workflow, checklist, troubleshooting
- [references/tdd-examples.md](references/tdd-examples.md) - examples and red flags
- [../test-driven-development/test-anti-patterns.md](../test-driven-development/test-anti-patterns.md) - testing anti-patterns
