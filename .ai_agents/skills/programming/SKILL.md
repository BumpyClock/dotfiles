---
name: programming
description: MUST USE WHEN WRITING CODE or REVIEWING CODE.
---

# Programming

Master programming principles to build high-quality, maintainable, testable and production-ready software following object-oriented design, Domain-Driven Design (DDD) tactical patterns, and rigorous testing standards.

## Quick Start

This Skill provides comprehensive coding rules organized by category with severity levels. Before any coding task:

1. Read [CODING-RULES.md](CODING-RULES.md) to understand all applicable rules
1. STRICTLY follow these rules while producing or reviewing a source code
1. RESPECT rules by severity: Critical → High → Medium → Low
1. When conflicts arise: Higher severity wins, then defer to existing code patterns

## When to Use This Skill

- Writing new features or components
- Refactoring legacy code
- Debugging and fixing bugs (test-first approach)
- Reviewing code for quality, maintainability, and standards compliance
- Explaining design patterns, architectural decisions, and best practices
- Designing class hierarchies and interfaces
- Creating comprehensive test suites

## Rule Categories Overview

The [CODING-RULES.md](CODING-RULES.md) file contains detailed rules in these categories:

- Architecture & Structure [A]
- Code Style & Patterns [S]
- Class Requirements [C]
- Method Requirements [M]
- Documentation [D]
- Testing Standards [T]
- AI Code Generation Process [AI]

## Rule Severity Levels

- **[C]ritical**: Must never be violated
- **[H]igh**: Should almost never be violated
- **[M]edium**: Follow unless good reason not to
- **[L]ow**: Guidelines and preferences

### Conflict Resolution

When rules conflict:
1. Higher severity always wins
1. If same severity, follow existing code patterns
1. Critical rules are absolute
1. Document any necessary deviations with strong justification

## Test-Driven Development (TDD)

### Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

**Violating the letter of the rules is violating the spirit of the rules.**

### When to Use

**Always:**
- New features
- Bug fixes
- Refactoring
- Behavior changes

**Exceptions (ask your human partner):**
- Throwaway prototypes
- Generated code
- Configuration files

Thinking "skip TDD just this once"? Stop. That's rationalization.

### The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over.

**No exceptions:**
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete

Implement fresh from tests. Period.

### Red-Green-Refactor
- RED: write one minimal test showing one behavior.
- Verify RED: run the test; confirm it fails for the expected reason.
- GREEN: write the simplest code to pass.
- Verify GREEN: re-run the test; ensure all tests still pass.
- REFACTOR: clean up while keeping tests green.

Don't add features beyond the test.

### Verification Checklist

Before marking work complete:

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output pristine (no errors, warnings)
- [ ] Tests use real code (mocks only if unavoidable)
- [ ] Edge cases and errors covered

Can't check all boxes? You skipped TDD. Start over.

### When Stuck

| Problem | Solution |
|---------|----------|
| Don't know how to test | Write wished-for API. Write assertion first. Ask your human partner. |
| Test too complicated | Design too complicated. Simplify interface. |
| Must mock everything | Code too coupled. Use dependency injection. |
| Test setup huge | Extract helpers. Still complex? Simplify design. |

### Debugging Integration

Bug found? Write failing test reproducing it. Follow TDD cycle. Test proves fix and prevents regression.

Never fix bugs without a test.

### Examples and Rationale

For diagrams, good/bad examples, rationalizations, red flags, and a full bug-fix walkthrough, read [references/tdd-examples.md](references/tdd-examples.md).

### Testing Anti-Patterns

When adding mocks or test utilities, read [test-anti-patterns.md](../test-driven-development/test-anti-patterns.md) to avoid common pitfalls:
- Testing mock behavior instead of real behavior
- Adding test-only methods to production classes
- Mocking without understanding dependencies

### Final Rule

```
Production code -> test exists and failed first
Otherwise -> not TDD
```

No exceptions without your human partner's permission.
