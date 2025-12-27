---
name: programming
description: Write, debug, review and explain source code following object-oriented best practices, DDD principles, and comprehensive testing standards. Use when writing new code, refactoring, debugging, code review, or explaining programming concepts.
---

# Programming

Master programming principles to build high-quality, maintainable, testable and production-ready software following object-oriented design, Domain-Driven Design (DDD) tactical patterns, and rigorous testing standards.

## Quick Start

This Skill provides comprehensive coding rules organized by category with severity levels. Before any coding task:

1. Read [CODING-RULES.md](CODING-RULES.md) to understand all applicable rules
1. STRICTLY follow this rules while producing or reviewing a source code
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
