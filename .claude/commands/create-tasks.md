Create a clear and detailed tasklist to accomplish what we have discussed.

- Save the tasks in .claude/tasks/tasks.md 

# Claude Code Implementation Planning Guidelines (CoT-Enhanced)

<role>
You are an experienced software architect creating detailed, actionable implementation plans for identified code issues using Claude Code's agentic capabilities.
</role>

<core_task>
Transform identified issues from code analysis into comprehensive implementation plans with clear steps, dependencies, and verification criteria. Focus on one or more specific issues to create detailed execution strategies. Before starting, ask the user which specific issues they want to address first, or if they want to create a plan for all identified issues.
</core_task>

## Chain-of-Thought Implementation Planning

<reasoning_framework>
Execute these steps explicitly for each issue, showing your thinking:

<step_0>
Before starting, ask the user:
"Which specific issue(s) do you want to create an implementation plan for? Or should I create a plan for all identified issues?" Stop and wait for a user response before proceeding.

<step_1>
**UNDERSTAND THE ISSUE**
Think: "The issue is: [issue description]
- Root cause: [why this problem exists]
- Current impact: [what problems it causes]
- Files affected: [specific files and line numbers]
- Dependencies: [what else might be affected]"
</step_1>

<step_2>
**ASSESS IMPLEMENTATION COMPLEXITY**
Think: "This fix requires:
- Effort level: [hours/days]
- Risk level: [low/medium/high]
- Breaking changes: [yes/no, what kind]
- Dependencies to modify: [list]
- Testing requirements: [unit/integration/e2e]"
</step_2>

<step_3>
**DESIGN THE SOLUTION**
Think: "The solution approach:
- Strategy: [refactor/rewrite/patch]
- Pattern to apply: [specific pattern if applicable]
- Key changes: [list main modifications]
- Preservation requirements: [what must not change]"
</step_3>

<step_4>
**SEQUENCE THE IMPLEMENTATION**
Think: "Optimal execution order:
1. Prerequisites: [what must be done first]
2. Core changes: [main implementation]
3. Integration: [connecting with existing code]
4. Verification: [how to confirm success]
Dependencies between steps: [which steps block others]"
</step_4>

<step_5>
**IDENTIFY RISKS AND MITIGATIONS**
Think: "Potential risks:
- What could break: [specific concerns]
- Rollback strategy: [how to undo if needed]
- Testing gaps: [what's hard to test]
- Performance impacts: [expected changes]"
</step_5>

<step_6>
**CREATE VERIFICATION PLAN**
Think: "Success criteria:
- Tests to write: [specific test cases]
- Metrics to measure: [performance/quality metrics]
- Manual verification: [what to check manually]
- Regression prevention: [how to ensure it stays fixed]"
</step_6>
</reasoning_framework>

## Implementation Plan Output Format

<plan_structure>
### Issue: [Issue Title]

<context>
**Priority**: 🔴 Critical / 🟡 Important / 🔵 Minor
**Effort**: [X hours/days]
**Risk**: [Low/Medium/High]
**Files**: [List affected files]
</context>

<implementation_phases>
#### Phase 1: Setup and Prerequisites
```xml
<phase_1>
Goal: [What this phase accomplishes]
Duration: [Time estimate]

Steps:
1. Create feature branch: `fix/[issue-descriptor]`
2. Set up test environment for issue reproduction
3. [Specific setup steps]

Claude Code Commands:
- "Create a new git branch for fixing [issue]"
- "Set up test case that reproduces [specific bug]"

Verification:
- [ ] Issue reproducible in test
- [ ] All dependencies available
</phase_1>
```

#### Phase 2: Core Implementation
```xml
<phase_2>
Goal: [Main fix implementation]
Duration: [Time estimate]

Steps:
1. [First code change with file:line]
2. [Second code change with approach]
3. [Continue with specific changes]

Claude Code Commands:
- "In [file], refactor [function] to [new approach]"
- "Add error handling for [edge case] in [location]"
- "Update types in [file] to match new structure"

Verification:
- [ ] Original issue resolved
- [ ] No new errors introduced
- [ ] Code follows project standards
</phase_2>
```

#### Phase 3: Testing and Integration
```xml
<phase_3>
Goal: Comprehensive testing and integration
Duration: [Time estimate]

Steps:
1. Write unit tests for modified functions
2. Update integration tests
3. Run full test suite
4. Performance benchmarking if applicable

Claude Code Commands:
- "Write comprehensive unit tests for [modified functions]"
- "Update integration tests in [test file] to cover new behavior"
- "Run all tests and analyze coverage"

Verification:
- [ ] All tests passing
- [ ] Coverage maintained/improved
- [ ] Performance acceptable
</phase_3>
```

#### Phase 4: Documentation and Finalization
```xml
<phase_4>
Goal: Complete implementation with documentation
Duration: [Time estimate]

Steps:
1. Update code documentation
2. Update README if needed
3. Create commit with descriptive message
4. Create pull request

Claude Code Commands:
- "Update JSDoc comments for all modified functions"
- "Create a detailed commit message following our conventions"
- "Create pull request with implementation summary"

Success Criteria:
- [ ] Documentation complete
- [ ] PR ready for review
- [ ] All checks passing
</phase_4>
```
</implementation_phases>

<rollback_plan>
If issues arise:
1. [Specific rollback step 1]
2. [Specific rollback step 2]
3. [How to preserve any valuable changes]
</rollback_plan>
</plan_structure>

## Claude Code Integration Patterns

<claude_code_usage>
### For Complex Refactoring
```
<context>
CLAUDE.md file should contain architecture patterns and coding standards
</context>

<command>
"Think hard about refactoring [component] to [pattern]. Read all related files first, understand the current architecture, then create a phased refactoring plan that maintains backward compatibility."
</command>
```

### For Bug Fixes
```
<command>
"Analyze the bug in [file:line]. First reproduce it with a test, then fix the root cause, not just the symptom. Ensure the fix doesn't break existing functionality."
</command>
```

### For Performance Optimization
```
<command>
"Profile [function/module] and identify performance bottlenecks. Create benchmarks before optimizing. Implement improvements incrementally, measuring impact at each step."
</command>
```

### For Security Fixes
```
<command>
"Analyze security vulnerability in [component]. Implement fix following OWASP guidelines. Add security tests. Ensure no sensitive data is exposed in logs or errors."
</command>
```
</claude_code_usage>

## Example: SQL Injection Fix Implementation

<example>
User: "Fix the SQL injection vulnerability in searchUsers() function"

**Step 1 - UNDERSTAND**: "SQL injection in UserController.searchUsers() at line 145. Direct string concatenation allows malicious SQL. Affects user search, potentially exposing entire database."

**Step 2 - ASSESS**: "Medium effort (4 hours), High risk (security critical), No breaking changes to API, Need to update UserRepository, Requires security tests"

**Step 3 - DESIGN**: "Replace string concatenation with parameterized queries. Use repository pattern properly. Add input validation layer."

**Step 4 - SEQUENCE**: 
1. Add input validation
2. Implement parameterized queries
3. Add security tests
4. Verify with penetration testing

**Step 5 - RISKS**: "Potential performance impact from validation. Risk of missing edge cases. Need thorough testing of special characters."

**Step 6 - VERIFICATION**: "Security unit tests, OWASP ZAP scanning, Performance benchmarks, Code review focus on injection points"

### Implementation Plan

<phase_1>
Goal: Setup and reproduce vulnerability
Duration: 30 minutes

Claude Code Commands:
- "Create branch fix/sql-injection-search-users"
- "Write a test that demonstrates SQL injection in searchUsers()"
- "Set up test database with safe sandbox"
</phase_1>

<phase_2>
Goal: Implement secure query handling
Duration: 2 hours

Claude Code Commands:
- "In UserRepository, refactor searchUsers to use parameterized queries with proper escaping"
- "Add input validation middleware for search parameters"
- "Implement query builder pattern for complex search scenarios"
</phase_2>

[Continues with remaining phases...]
</example>

## Multi-Issue Batch Planning

<batch_planning>
When addressing multiple related issues:

1. **Dependency Analysis**
   Think: "Issue A blocks B, B and C can be parallel, D depends on all"
   
2. **Resource Optimization**
   Think: "Combining fixes for issues X and Y saves setup time"
   
3. **Risk Mitigation**
   Think: "Fix critical issues first, cosmetic issues last"

4. **Testing Efficiency**
   Think: "Shared test infrastructure for related fixes"

Claude Code Command:
"Analyze these related issues: [list]. Create an optimal implementation order considering dependencies, shared code, and risk levels. Generate a master plan with parallel work streams where possible."
</batch_planning>

## Quality Checkpoints

<quality_gates>
Before moving between phases, verify:

□ **Code Quality**
- Follows project standards in CLAUDE.md
- No code smells introduced
- Complexity metrics acceptable

□ **Testing**
- New tests for the fix
- Existing tests still pass
- Edge cases covered

□ **Performance**
- No degradation (or improved)
- Memory usage acceptable
- Response times maintained

□ **Security**
- No new vulnerabilities
- Follows security guidelines
- Sensitive data protected
</quality_gates>

## Anti-Patterns to Avoid

<avoid>
❌ Fixing symptoms instead of root causes
❌ Making changes without tests
❌ Over-engineering simple fixes
❌ Ignoring performance impacts
❌ Breaking existing functionality
❌ Skipping documentation updates
</avoid>

---

**Remember**: Show reasoning at each step. Create implementation plans that are specific, measurable, and executable. Use Claude Code's strengths in systematic execution and deep analysis. Each phase should have clear entry criteria, exit criteria, and rollback procedures.

# Task list
Think deeply and carefully about the list of tasks, they should be detailed and specific. Each task should be a single line item. Tasks can be grouped by category, but each task should be a single line item.Tasks should not be overly complex. 

Tasks should be specific and actionable. Avoid vague or ambiguous tasks. Each task should be a single line item. Tasks should be clear and concise. Use simple language and avoid jargon or technical terms that may not be familiar to the reader. Think carefully about the tasks, review your initial list for complexity and identify the tasks that are complex then break them down into smaller, more manageable tasks.

Here's an example
```markdown

# Section 1
- [x] Task 1 is an example of a task that is complete
- [ ] Task 2
- [ ] Task 3
- [ ] Task 4
- [ ] Task 5

# Section 2
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
- [ ] Task 4
- [ ] Task 5
```