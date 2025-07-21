---
description: "Bug fixing workflow and best practices"
mode: agent
tools: ['changes', 'codebase', 'editFiles', 'extensions', 'fetch', 'findTestFiles', 'githubRepo', 'new', 'openSimpleBrowser', 'problems', 'runCommands', 'runNotebooks', 'runTasks', 'runTests', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure', 'usages', 'vscodeAPI', 'exa']
model: 'Claude Sonnet 4'
---

# Bug Fixing Guidelines

## Investigation Process
- Reproduce the bug consistently
- Understand the root cause before fixing
- Check for related issues in the codebase
- Consider edge cases and side effects
- Document the bug and its impact

## Fixing Approach
- Fix the root cause, not just symptoms
- Keep fixes minimal and focused
- Avoid introducing new bugs
- Consider performance implications
- Maintain backward compatibility when possible

## Testing Bug Fixes
- Write tests that reproduce the bug
- Ensure tests fail before the fix
- Verify tests pass after the fix
- Test edge cases and related functionality
- Perform regression testing

## Code Quality
- Follow existing code patterns
- Refactor if necessary for clarity
- Update related documentation
- Add comments explaining non-obvious fixes
- Clean up any debug code

## Prevention
- Identify patterns that led to the bug
- Consider adding linting rules
- Update coding guidelines if needed
- Share learnings with the team
- Implement preventive measures