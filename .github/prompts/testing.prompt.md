---
applyTo: "**/*.test.*,**/*.spec.*,**/test/**,**/tests/**"
description: "Testing guidelines and best practices"
mode: agent
---

# Testing Guidelines

## Test Structure
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Group related tests with describe blocks
- Keep tests focused and isolated
- One assertion per test when possible

## Unit Testing
- Test individual functions/methods
- Mock external dependencies
- Cover edge cases and error scenarios
- Aim for high code coverage
- Keep tests fast and deterministic

## Integration Testing
- Test component interactions
- Use realistic test data
- Test API endpoints thoroughly
- Verify database operations
- Check error handling flows

## Test Naming Convention
```javascript
// Format: should_expectedBehavior_when_condition
test('should_return_user_when_valid_id_provided', () => {});
test('should_throw_error_when_invalid_id_provided', () => {});
```

## Best Practices
- Write tests before or during development
- Keep test data minimal but realistic
- Avoid testing implementation details
- Use factories for test data creation
- Clean up test resources properly

## Assertions
- Use specific assertions
- Include helpful error messages
- Test both positive and negative cases
- Verify all important outcomes
- Don't over-assert

## Mocking
- Mock at the right level
- Keep mocks simple
- Verify mock interactions
- Reset mocks between tests
- Avoid over-mocking