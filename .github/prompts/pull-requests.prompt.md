---
applyTo: "**/*"
description: "Pull request creation and review guidelines"
mode: agent
---

# Pull Request Guidelines

## Creating Pull Requests

### PR Title
- Use clear, descriptive titles
- Follow commit message conventions
- Include ticket/issue number if applicable
- Keep under 70 characters

### PR Description Template
```markdown
## Summary
- Brief description of changes
- Key improvements or fixes
- Any breaking changes

## Related Issues
- Fixes #123
- Relates to #456

## Changes Made
- List of specific changes
- New features added
- Bugs fixed
- Refactoring done

## Testing
- How to test the changes
- Test cases added/modified
- Manual testing performed

## Screenshots
- UI changes before/after
- Performance improvements
- Error messages

## Checklist
- [ ] Tests pass
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No sensitive data exposed
```

## Review Guidelines

### For Reviewers
- Check code quality and standards
- Verify tests are adequate
- Look for security issues
- Ensure documentation is updated
- Consider performance impact

### Providing Feedback
- Be constructive and respectful
- Suggest specific improvements
- Acknowledge good practices
- Ask questions for clarity
- Use code suggestions when helpful

### Review Comments Format
- **Question**: For clarifications
- **Suggestion**: For improvements
- **Issue**: For problems that must be fixed
- **Nitpick**: For minor style issues
- **Praise**: For good code patterns

## Best Practices
- Keep PRs small and focused
- One feature/fix per PR
- Respond to feedback promptly
- Update PR based on reviews
- Squash commits when merging