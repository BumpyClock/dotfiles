---
applyTo: "**/*"
description: "Git commit message guidelines following Conventional Commits"
mode: agent
model: "GPT-4.1"
---

Create a commit message for the changes made in the codebase. Use the following instructions:
# Commit Message Guidelines

## Conventional Commits Format

Use the format: `<type>(<scope>): <subject>`

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without changing functionality
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Maintenance tasks
- `revert`: Reverting previous commits

### Scope
- Optional, indicates the area of change
- Examples: `api`, `ui`, `auth`, `db`, `config`

### Subject
- Short, imperative mood description
- No capitalization of first letter
- No period at the end
- Maximum 50 characters

## Examples
```
feat(auth): add OAuth2 integration
fix(api): handle null response in user endpoint
docs(readme): update installation instructions
refactor(ui): extract common button component
perf(db): optimize user query with index
```

## Best Practices
- Write clear, descriptive messages
- Focus on why, not just what
- Reference issue numbers when applicable
- Keep commits atomic and focused
- Avoid mixing unrelated changes

## Multi-line Commits
- Use blank line between subject and body
- Wrap body at 72 characters
- Explain what and why, not how
- Include breaking changes with `BREAKING CHANGE:`
- Add co-authors when applicable