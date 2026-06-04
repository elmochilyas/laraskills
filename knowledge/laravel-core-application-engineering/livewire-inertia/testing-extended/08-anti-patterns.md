# Livewire Testing — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Testing |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Testing Implementation Details Instead of Behavior
2. Giant Test Covering Multiple Behaviors
3. No Validation Failure Tests
4. No Authorization Tests
5. Testing Through HTTP Instead of Livewire::test

---

## Repository-Wide Anti-Patterns

- **No `RefreshDatabase` trait**: Order-dependent test failures from database state leakage.
- **No event dispatch assertions**: Events created but never verified to fire with correct data.
- **Mocking Livewire internals**: Using `shouldReceive` on component methods — brittle, tests implementation.
- **No test for the component at all**: Component created but no test file exists.

---

## Anti-Pattern 1: Testing Implementation Details Instead of Behavior

### Category

Testing

### Description

Asserting on internal method calls, private property values, or intermediate hydration data instead of asserting on observable component state and output.

### Why It Happens

Developers familiar with unit testing may reach for `assertMethodCalled()` or use reflection to inspect private properties. They test "how the component works" rather than "what the component does."

### Warning Signs

- Tests use `assertMethodCalled()` or similar mock expectations on component methods
- Tests access private/protected properties via reflection
- Tests assert on snapshot data or hydration state
- Test fails after refactoring even though behavior is unchanged
- Tests mock component methods with `shouldReceive`

### Why Harmful

Testing implementation details creates brittle tests that break on refactoring even when the component's behavior remains correct. A test that asserts `increment()` was called fails if the method is renamed to `add()`, even though the component still increments correctly. Tests should document what the component does, not how it does it.

### Consequences

- Tests break on every refactor, even when behavior is correct
- False negatives — test fails but component works
- Refactoring fear — developers avoid improving code because tests are brittle
- Tests don't document actual component behavior

### Alternative

Assert on observable state and output: `assertSet()`, `assertSee()`, `assertDispatched()`. These test what the user experiences, not how the component implements it.

### Refactoring Strategy

1. Identify tests asserting on method calls or private state
2. Replace with `assertSet()`, `assertSee()`, or `assertDispatched()` assertions
3. Verify that the tests pass after the refactoring
4. Ensure the tests validate component behavior, not implementation

### Detection Checklist

- [ ] No `assertMethodCalled()` or mock expectations on component methods
- [ ] No reflection access to private/protected component properties
- [ ] Tests assert on public state (`assertSet`) or output (`assertSee`)
- [ ] Tests survive refactoring that doesn't change behavior
- [ ] Tests document what the component does, not how

### Related Rules

- Test Component Behavior, Not Implementation (05-rules.md)

### Related Skills

- Write Comprehensive Livewire Component Tests (06-skills.md)

### Related Decision Trees

- Livewire::test() Integration Test vs Unit Test for Component Logic (07-decision-trees.md)

---

## Anti-Pattern 2: Giant Test Covering Multiple Behaviors

### Category

Testing

### Description

A single test method that chains multiple unrelated assertions, verifying several behaviors in one function.

### Why It Happens

It's faster to write one test that asserts everything at once. The developer chains `->assertSee()->assertSet()->assertDispatched()` in a single test to cover all scenarios quickly.

### Warning Signs

- Test method chaining 5+ assertions in one call
- Test method named `test_component_works()` — vague, covers everything
- When a test fails, it's unclear which behavior broke
- Multiple unrelated scenarios tested in one method
- Test is 50+ lines long

### Why Harmful

A test that asserts many things fails with a generic message, making it hard to identify which behavior broke. When multiple behaviors are tested together, a failure in the first assertion prevents later assertions from running, hiding additional regressions. Focused tests provide precise failure feedback: "increment_updates_count" failing tells you exactly what's wrong.

### Consequences

- Unclear failure messages — hard to identify which behavior broke
- First assertion failure hides subsequent regressions
- Debugging time increases — must determine which of 5 assertions failed
- Tests don't document individual behaviors

### Alternative

Write one test per behavior, action, or scenario. Name each test to describe the single behavior it verifies.

### Refactoring Strategy

1. Break existing giant tests into individual test methods
2. Extract each behavior into its own test with a descriptive name
3. Use Pest datasets or PHPUnit data providers for combinatorial cases
4. Verify that each test provides clear, specific failure feedback

### Detection Checklist

- [ ] Each test method verifies exactly one behavior
- [ ] Test names describe the specific scenario being tested
- [ ] No test chains unrelated assertions
- [ ] Failure messages precisely identify the broken behavior
- [ ] Tests are under 20 lines each

### Related Rules

- One Focused Test Per Behavior (05-rules.md)

### Related Skills

- Write Comprehensive Livewire Component Tests (06-skills.md)

### Related Decision Trees

- State Assertion vs Output Assertion for Component Validation (07-decision-trees.md)

---

## Anti-Pattern 3: No Validation Failure Tests

### Category

Testing

### Description

Only testing the happy path of form submission (valid data → success) without testing that validation correctly rejects invalid data.

### Why It Happens

It's natural to test that "the component works" — submitting valid data and asserting success. Testing validation failure paths feels like testing the framework's validation engine, not the component.

### Warning Signs

- Only one test for each form submission: valid data, assert no errors
- No test for empty required fields, too-short strings, invalid email formats
- Validation rules added but never tested with invalid input
- `assertHasErrors()` never used in the test suite

### Why Harmful

Testing only the happy path leaves validation gaps undetected. A misconfigured rule (wrong syntax, missing field, incorrect rule name) may silently allow invalid data. Without failure-path tests, a `min:3|max:255` rule that was accidentally written as `min:3max:255` (missing pipe) passes validation as if it were `min:3` only.

### Consequences

- Undetected validation rule gaps — invalid data accepted
- Wrong rule syntax silently ignored
- Data integrity issues from insufficient validation
- Security vulnerabilities from missing sanitization rules

### Alternative

For each validation rule, write two tests: one with valid data that asserts `assertHasNoErrors()`, and one with invalid data that asserts `assertHasErrors('field')`.

### Refactoring Strategy

1. Identify components with validation rules but no failure-path tests
2. Add tests for each rule's boundary: empty, too short, too long, invalid format
3. Add tests for cross-field validation failures
4. Verify that `assertHasErrors()` catches both missing and incorrect rules

### Detection Checklist

- [ ] Every validation rule has a failure-path test
- [ ] Tests assert `assertHasErrors('field')` for invalid data
- [ ] Tests assert `assertHasNoErrors()` for valid data
- [ ] Rule boundaries are tested (min, max, format, required)
- [ ] Cross-field validation rules have failure tests

### Related Rules

- Test Both Validation Pass and Fail Paths (05-rules.md)

### Related Skills

- Write Comprehensive Livewire Component Tests (06-skills.md)

### Related Decision Trees

- Livewire::test() Integration Test vs Unit Test for Component Logic (07-decision-trees.md)

---

## Anti-Pattern 4: No Authorization Tests

### Category

Testing

### Description

Not testing that unauthorized users are correctly rejected from performing protected actions.

### Why It Happens

Authorization is often added late in development. By the time it's implemented, the basic test suite is already written. Adding authorization tests requires setting up multiple user roles, which adds complexity to tests.

### Warning Signs

- Actions with `$this->authorize()` have no test for the unauthorized path
- Only admin-level actions are tested (with an admin user)
- No test asserts `assertForbidden()`
- Guest users are never used in action tests

### Why Harmful

Authorization checks in Livewire components are as critical as in controllers. Without testing, a missing `$this->authorize()` call goes undetected until a user exploits it. Testing only the authorized path gives false confidence — the admin knows the action works, but there's no proof that a regular user can't access it.

### Consequences

- Missing authorization checks undetected — security vulnerability
- Regular users could access admin-only actions
- Compliance violations — unauthorized data access goes unnoticed
- False confidence — tests pass, but authorization is broken

### Alternative

For every action that requires authorization, write tests with `Livewire::actingAs($unauthorizedUser)` and `Livewire::actingAs($authorizedUser)`.

### Refactoring Strategy

1. Identify all actions with authorization checks
2. Add a test for the unauthorized path: `Livewire::actingAs($user)->test(...)->assertForbidden()`
3. Add a test for the authorized path: `Livewire::actingAs($admin)->test(...)->assertSuccessful()`
4. Test guest access (not logged in) if relevant: `Livewire::test(...)->assertForbidden()`

### Detection Checklist

- [ ] Every authorized action has a test for the unauthorized path
- [ ] Every authorized action has a test for the authorized path
- [ ] `assertForbidden()` is used for unauthorized access
- [ ] Guest access is tested where applicable
- [ ] Multiple user roles are tested (admin, regular user, guest)

### Related Rules

- Test Authorization Scenarios (05-rules.md)

### Related Skills

- Write Comprehensive Livewire Component Tests (06-skills.md)

### Related Decision Trees

- Livewire::test() Integration Test vs Unit Test for Component Logic (07-decision-trees.md)

---

## Anti-Pattern 5: Testing Through HTTP Instead of Livewire::test

### Category

Testing

### Description

Testing Livewire components by sending HTTP requests (POST /livewire/message/...) instead of using the dedicated `Livewire::test()` API.

### Why It Happens

Developers accustomed to testing HTTP controllers may naturally write HTTP tests for Livewire components. They see Livewire as a layer on top of HTTP and test at that level.

### Warning Signs

- Tests use `post('/livewire/message/component-id')` instead of `Livewire::test()`
- Manually constructing message payloads with snapshot data
- Tests are complex — building the correct POST body, parsing HTML responses
- Component lifecycle not fully exercised (hydration, boot, hooks)

### Why Harmful

Testing Livewire through HTTP requires manually constructing the correct message payload, including snapshot data, checksums, and component IDs. This is complex, error-prone, and tests the HTTP transport layer rather than the component behavior. The official `Livewire::test()` API exercises the full component lifecycle, provides rich assertions, and is simpler.

### Consequences

- Complex test setup — manually building message payloads
- Tests the HTTP transport, not the component behavior
- Missing assertion helpers — must manually parse HTML for state
- Slower tests — HTTP stack overhead
- Tests don't use `assertSet`, `assertDispatched`, or other Livewire-specific assertions

### Alternative

Use `Livewire::test(Component::class)` for all Livewire component testing. Reserve HTTP tests for routes that don't use Livewire.

### Refactoring Strategy

1. Identify HTTP tests targeting Livewire message endpoints
2. Rewrite using `Livewire::test(Component::class)` API
3. Replace manual payload construction with `call()`, `set()`, and fluent assertions
4. Verify the same behaviors are tested with simpler, more focused assertions

### Detection Checklist

- [ ] All component tests use `Livewire::test()`
- [ ] No HTTP POST tests to Livewire message endpoints
- [ ] Tests use `call()`, `set()`, and Livewire assertions
- [ ] No manual snapshot or checksum construction in tests
- [ ] Tests exercise the full component lifecycle

### Related Rules

- Use call and set to Simulate User Interactions (05-rules.md)

### Related Skills

- Write Comprehensive Livewire Component Tests (06-skills.md)

### Related Decision Trees

- Livewire::test() Integration Test vs Unit Test for Component Logic (07-decision-trees.md)
