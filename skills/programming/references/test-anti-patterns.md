# Testing Anti-Patterns

**Load this reference when:** writing or changing tests, adding mocks, or tempted to add test-only methods to production code.

## Overview

Tests must verify real behavior, not mock behavior. Mocks are a means to isolate, not the thing being tested.

**Core principle:** Test what the code does, not what the mocks do.

## Guardrails

```
1. Do not test mock behavior
2. Do not add test-only methods to production classes
3. Do not mock without understanding dependencies
```

Anti-Patterns 1-4 are strong defaults: deviate only with a stated reason (e.g. a framework-sanctioned test hook). Anti-Pattern 6 (coverage theater) is a hard gate — every rule in it is backed by an observed failure in `../evals/cases/`.

## Anti-Pattern 1: Testing Mock Behavior

**The violation:**
```typescript
// ❌ BAD: Testing that the mock exists
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

**Why this is wrong:**
- You're verifying the mock works, not that the component works
- Test passes when mock is present, fails when it's not
- Tells you nothing about real behavior

**Gut check:** "Are we testing the behavior of a mock?"

**The fix:**
```typescript
// ✅ GOOD: Test real component or don't mock it
test('renders sidebar', () => {
  render(<Page />);  // Don't mock sidebar
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

// OR if sidebar must be mocked for isolation:
// Don't assert on the mock - test Page's behavior with sidebar present
```

### Gate Function

```
BEFORE asserting on any mock element:
  Ask: "Am I testing real component behavior or just mock existence?"

  IF testing mock existence:
    STOP - Delete the assertion or unmock the component

  Test real behavior instead
```

## Anti-Pattern 2: Test-Only Methods in Production

**The violation:**
```typescript
// ❌ BAD: destroy() only used in tests
class Session {
  async destroy() {  // Looks like production API!
    await this._workspaceManager?.destroyWorkspace(this.id);
    // ... cleanup
  }
}

// In tests
afterEach(() => session.destroy());
```

**Why this is wrong:**
- Production class polluted with test-only code
- Dangerous if accidentally called in production
- Violates YAGNI and separation of concerns
- Confuses object lifecycle with entity lifecycle

**The fix:**
```typescript
// ✅ GOOD: Test utilities handle test cleanup
// Session has no destroy() - it's stateless in production

// In test-utils/
export async function cleanupSession(session: Session) {
  const workspace = session.getWorkspaceInfo();
  if (workspace) {
    await workspaceManager.destroyWorkspace(workspace.id);
  }
}

// In tests
afterEach(() => cleanupSession(session));
```

### Gate Function

```
BEFORE adding any method to production class:
  Ask: "Is this only used by tests?"

  IF yes:
    STOP - Don't add it
    Put it in test utilities instead

  Ask: "Does this class own this resource's lifecycle?"

  IF no:
    STOP - Wrong class for this method
```

## Anti-Pattern 3: Mocking Without Understanding

**The violation:**
```typescript
// ❌ BAD: Mock breaks test logic
test('detects duplicate server', () => {
  // Mock prevents config write that test depends on!
  vi.mock('ToolCatalog', () => ({
    discoverAndCacheTools: vi.fn().mockResolvedValue(undefined)
  }));

  await addServer(config);
  await addServer(config);  // Should throw - but won't!
});
```

**Why this is wrong:**
- Mocked method had side effect test depended on (writing config)
- Over-mocking to "be safe" breaks actual behavior
- Test passes for wrong reason or fails mysteriously

**The fix:**
```typescript
// ✅ GOOD: Mock at correct level
test('detects duplicate server', () => {
  // Mock the slow part, preserve behavior test needs
  vi.mock('MCPServerManager'); // Just mock slow server startup

  await addServer(config);  // Config written
  await addServer(config);  // Duplicate detected ✓
});
```

### Gate Function

```
BEFORE mocking an internal collaborator, or anything with side effects the test depends on
(pure-value stubs — clock, uuid, random seed — are exempt):
  STOP - Don't mock yet

  1. Ask: "What side effects does the real method have?"
  2. Ask: "Does this test depend on any of those side effects?"
  3. Ask: "Do I fully understand what this test needs?"

  IF depends on side effects:
    Mock at lower level (the actual slow/external operation)
    OR use test doubles that preserve necessary behavior
    NOT the high-level method the test depends on

  IF unsure what test depends on:
    Run test with real implementation FIRST
    Observe what actually needs to happen
    THEN add minimal mocking at the right level

  Red flags:
    - "I'll mock this to be safe"
    - "This might be slow, better mock it"
    - Mocking without understanding the dependency chain
```

## Anti-Pattern 4: Incomplete Mocks

**The violation:**
```typescript
// ❌ BAD: Partial mock - only fields you think you need
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' }
  // Missing: metadata that downstream code uses
};

// Later: breaks when code accesses response.metadata.requestId
```

**Why this is wrong:**
- **Partial mocks hide structural assumptions** - You only mocked fields you know about
- **Downstream code may depend on fields you didn't include** - Silent failures
- **Tests pass but integration fails** - Mock incomplete, real API complete
- **False confidence** - Test proves nothing about real behavior

**Rule:** Mock data should be schema-valid and include fields required by the contract or downstream code under test.

**The fix:**
```typescript
// ✅ GOOD: Preserve contract fields the system consumes
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  metadata: { requestId: 'req-789', timestamp: 1234567890 }
};
```

### Gate Function

```
BEFORE creating mock responses:
  Check: "What contract fields can this path consume?"

  Actions:
    1. Examine schema/docs/examples when available
    2. Include fields this path or downstream code consumes
    3. Keep fixture small enough that the behavior under test stays visible

  Critical:
    If you're creating a mock, understand the contract surface it represents
    Partial mocks fail silently when code depends on omitted fields

  If uncertain: use a real fixture, schema builder, or test one layer up
```

## Anti-Pattern 5: Integration Tests as Afterthought

**The violation:**
```
✅ Implementation complete
❌ No tests written
"Ready for testing"
```

**Why this is wrong:**
- Testing is part of implementation, not optional follow-up
- Changed behavior without coverage is an incomplete change

**The fix:** cover the changed behavior before claiming complete. TDD preferred; explicit test-after is acceptable when declared (see `tdd-rules.md`). What's not acceptable: handing off behavior changes with no tests and no stated rationale.

## Anti-Pattern 6: Coverage Theater

Tests that look like coverage but cannot fail. Worse than no test: they suppress the "untested" signal.

**The violations:**
```swift
// ❌ Cannot fail
func testInitDoesNotCrash() { _ = Parser(config); XCTAssertTrue(true) }

// ❌ No assertions; name claims verification
func testHandlesAllInputsCorrectly() { for c in cases { _ = normalize(c) } }

// ❌ Tautology: asserts constructor input back out
let m = Episode(id: 7); XCTAssertEqual(m.id, 7)

// ❌ Expected value copied from production source; fails only if you forget to edit both places
XCTAssertEqual(theme.accent, Color(red: 0.21, green: 0.48, blue: 0.94))

// ❌ Name claims a path the body never takes
func testFetchTimeoutThrowsError() { /* nothing times out, nothing throws */ }

// ❌ Setup destroys the evidence
db.rebuildIndex()               // does the work the trigger should have done
XCTAssertFalse(index.isEmpty)   // now proves nothing about the trigger

// ❌ SUT deleted; test retained "for coverage"
```

### Gate Function

```
BEFORE keeping any test:
  Ask: "What production change makes this fail?"
    No answer → delete it
  Ask: "Does it fail via the mechanism the name claims?"
    No → fix the body or rename to what it actually tests
  Ask: "Is any expected value a literal copied from production source?"
    Yes → read from the real source of truth, or delete the assertion
  Ask: "Does setup manufacture the state the SUT is supposed to produce?"
    Yes → remove that setup; let the SUT produce it
  Ask: "Does the SUT still have non-test callers?"
    No → delete SUT's tests with the SUT
```

## When Mocks Become Too Complex

**Warning signs:**
- Mock setup longer than test logic
- Mocking everything to make test pass
- Mocks missing methods real components have
- Test breaks when mock changes

**Gut check:** "Do we need to be using a mock here?"

**Consider:** Integration tests with real components often simpler than complex mocks

## TDD Prevents These Anti-Patterns

**Why TDD helps:**
1. **Write test first** → Forces you to think about what you're actually testing
2. **Watch it fail** → Confirms test tests real behavior, not mocks
3. **Minimal implementation** → No test-only methods creep in
4. **Real dependencies** → You see what the test actually needs before mocking

**If you're testing mock behavior, you violated TDD** - you added mocks without watching test fail against real code first.

## Quick Reference

| Anti-Pattern | Fix |
|--------------|-----|
| Assert on mock elements | Test real component or unmock it |
| Test-only methods in production | Move to test utilities |
| Mock without understanding | Understand dependencies first, mock minimally |
| Incomplete mocks | Include contract fields the code under test consumes |
| Tests as afterthought | Cover changed behavior before claiming complete |
| Over-complex mocks | Consider integration tests |

## Red Flags

- Assertion checks for `*-mock` test IDs
- Methods only called in test files
- Mock setup is >50% of test
- Test fails when you remove mock
- Can't explain why mock is needed
- Mocking "just to be safe"
- `assertTrue(true)` or assertion-free test bodies
- Test name contains error/timeout/cancel/retry with no throw/clock/cancellation in body
- Expected literal identical to a literal in production source
- Tests whose SUT has no non-test callers

## The Bottom Line

**Mocks are tools to isolate, not things to test.**

If TDD reveals you're testing mock behavior, you've gone wrong.

Fix: Test real behavior or question why you're mocking at all.
