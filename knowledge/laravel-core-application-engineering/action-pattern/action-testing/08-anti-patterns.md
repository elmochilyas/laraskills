# ECC Anti-Patterns — Action Testing

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Action Testing |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Feature Tests as Primary Action Test Strategy
2. One Giant Test Class for All Action Tests
3. Mocking Every Collaborator (Over-Mocking)
4. Testing Implementation Details Instead of Business Outcomes
5. No Exception / Failure Path Tests

---

## Repository-Wide Anti-Patterns

- N+1 Query Problem (not caught if testing through HTTP)
- Event Explosion (not tested at action level)
- God Services (not tested in isolation)
- Hidden Database Queries (bypassing action testing)

---

## Anti-Pattern 1: Feature Tests as Primary Action Test Strategy

### Category
Testing | Performance

### Description
Writing every action test as an HTTP feature test — booting the framework, sending an HTTP request through routing and middleware — to test the action's business logic.

### Why It Happens
Developers are accustomed to Laravel's test documentation which emphasizes HTTP testing. They test actions "the way the user would use them" without considering test isolation or speed.

### Warning Signs
- Action tests use `$this->post()`, `$this->get()`, `$this->json()`
- Every action test calls `RefreshDatabase` or `DatabaseMigrations`
- Test suite for 50 actions takes 10+ seconds to run
- Tests fail due to middleware or routing changes (not action logic)

### Why It Is Harmful
Each feature test takes 20-30ms (framework boot + routing + middleware) instead of <1ms for a pure unit test. 200 action tests take 4-6 seconds instead of <100ms. Tests are coupled to HTTP infrastructure — changing a route or middleware breaks action tests.

### Real-World Consequences
Slow test suite discourages frequent running. Developers commit code without running the full suite. CI pipeline takes longer. Tests break on routes that have nothing to do with the action's logic.

### Preferred Alternative
Test actions directly as pure unit tests (instantiate with mocked dependencies, no framework boot). Reserve feature tests for the thin adapter layer (controller-to-action wiring).

### Refactoring Strategy
1. Identify all action tests written as feature tests.
2. For each action, write a pure unit test that instantiates the action directly with mocked dependencies.
3. Verify business rules through the action's return value and thrown exceptions.
4. Keep only one feature test per action (to verify the controller-adapter wiring).
5. Remove redundant feature tests that duplicate pure unit test coverage.
6. Track test suite speed improvement.

### Detection Checklist
- [ ] Count action tests using `$this->post/get/json` (feature tests)
- [ ] Measure average test time (threshold: <1ms per pure unit, 20-30ms per feature)
- [ ] Check if HTTP routing changes break action tests

### Related Rules
- Rule: Use Pure Unit Tests as the Primary Testing Strategy

### Related Skills
- Skill: Write a Pure Unit Test for an Action

### Related Decision Trees
- Decision: Pure Unit Test vs Hybrid Database Test vs Feature Test

---

## Anti-Pattern 2: One Giant Test Class for All Action Tests

### Category
Testing | Code Organization

### Description
A single `ActionsTest.php` file containing test methods for 20+ different action classes, making it impossible to find the tests for a specific action.

### Why It Happens
Convenience — adding a new test to an existing file is faster than creating a new file. Lack of awareness that each action needs its own test class.

### Warning Signs
- `tests/Unit/ActionsTest.php` exists with 20+ test methods
- Developers cannot quickly find the test for a specific action
- Multiple actions' tests share setup code
- A failing test doesn't immediately indicate which action is broken

### Why It Is Harmful
Difficult to navigate. Test failures don't indicate which action needs attention. Shared setup creates test pollution between unrelated action tests. When an action is modified, the developer must search for its test in a giant file.

### Real-World Consequences
A developer modifies `CreateUserAction`. The test for it is method 47 of 100 in `ActionsTest.php`. They search for "CreateUser" and find 3 different test methods for different actions that reference "User." They accidentally modify the wrong test.

### Preferred Alternative
One test file per action class. Mirror the source directory: `app/Actions/CreateUserAction.php` → `tests/Unit/Actions/CreateUserActionTest.php`.

### Refactoring Strategy
1. Create one test file per action class under `tests/Unit/Actions/{Domain}/`.
2. Extract each action's test methods from the giant file into its dedicated file.
3. Remove shared mutable state between tests.
4. Delete the giant `ActionsTest.php` file.
5. Verify each test passes independently.

### Detection Checklist
- [ ] Check if multiple actions share a test file
- [ ] Verify 1:1 mapping between action files and test files

### Related Rules
- Rule: Maintain 1:1 Mapping Between Action Files and Test Files

### Related Skills
- Skill: Write a Pure Unit Test for an Action

---

## Anti-Pattern 3: Mocking Every Collaborator (Over-Mocking)

### Category
Testing | Maintainability

### Description
Mocking every single dependency in an action's constructor — including simple value objects, loggers, and in-memory repositories — creating tests that are brittle, verbose, and coupled to implementation details.

### Why It Happens
Developers follow "mock everything" advice without distinguishing between expensive dependencies (API clients, mailers, gateways) and simple ones (repositories, value objects, loggers).

### Warning Signs
- Constructor has 4+ parameters, all mocked
- Mock expectations match exact method calls and parameters
- Tests break when internal implementation changes (not when behavior changes)
- Test setup is longer than the test assertions

### Why It Is Harmful
Tests pass even when real implementations diverge from mock expectations. Tests are tightly coupled to implementation — renaming a method or changing parameter order breaks the test, even if the behavior is correct. Too much setup time per test.

### Real-World Consequences
A developer changes `UserRepository::create()` to `UserRepository::save()`. Every test that mocks `create()` now fails, even if `save()` produces the same result. The developer spends 30 minutes updating mock expectations instead of testing behavior.

### Preferred Alternative
Mock only expensive or unreliable dependencies (API clients, file systems, payment gateways, mailers). Use real implementations for simple dependencies (in-memory repositories, null loggers, value objects).

### Refactoring Strategy
1. Identify dependencies that are expensive to instantiate or have side effects — these need mocks.
2. Replace mocks for simple dependencies with real implementations.
3. Create in-memory implementations for repositories that just hold data in an array.
4. Remove mock expectation assertions that check internal method calls.
5. Rename tests to assert on business outcomes, not method calls.

### Detection Checklist
- [ ] Count mocked vs real dependencies per test
- [ ] Check if mock expectations match implementation methods (not business outcomes)

### Related Rules
- Rule: Use Pure Unit Tests as the Primary Testing Strategy

### Related Skills
- Skill: Write a Pure Unit Test for an Action

### Related Decision Trees
- Decision: Mocking Strategy — What to Mock vs Use Real Implementations

---

## Anti-Pattern 4: Testing Implementation Details Instead of Business Outcomes

### Category
Testing | Maintainability

### Description
Test names and assertions focus on which methods were called on mocks (`test_it_calls_repository_create`) rather than the business outcome (`test_it_creates_a_user`). Tests break on every refactor because they are coupled to implementation.

### Why It Happens
Developers use mock expectations as the primary assertion mechanism instead of asserting on return values or state changes. Tests are written after the implementation, so they mirror the implementation.

### Warning Signs
- Test names contain method names: `test_create_called_on_repository`, `test_method_returns_user`
- Primary assertions are `shouldReceive('method')->once()`
- No assertions on return values or exception messages
- Tests break when implementation is refactored without behavior change

### Why It Is Harmful
Tests provide false confidence — they verify that methods were called, not that the correct behavior occurred. They become a maintenance burden, breaking on every refactoring. Developers stop trusting the test suite.

### Real-World Consequences
The action is refactored to use a different internal structure. All tests break even though the behavior is correct. The team spends a day fixing tests that provided no value.

### Preferred Alternative
Name tests by business outcome. Assert on return values, exception messages, and state changes, not on method call counts. Tests should survive internal refactoring.

### Refactoring Strategy
1. Rename all tests to describe the business outcome: `test_it_creates_a_user`, `test_it_rejects_duplicate_emails`.
2. Replace `shouldReceive('method')->once()` assertions with assertions on the action's return value, exception, or observable effect.
3. Use `shouldReceive` only to set up collaborator behavior, not as the primary assertion.
4. Add assertions on return values and exception messages.

### Detection Checklist
- [ ] Do test names describe technical operations or business outcomes?
- [ ] Would the test survive an internal implementation refactoring?

### Related Rules
- Rule: Name Tests by Business Outcome, Not Technical Operation

### Related Skills
- Skill: Write a Pure Unit Test for an Action

---

## Anti-Pattern 5: No Exception / Failure Path Tests

### Category
Testing | Reliability

### Description
Action tests only cover the happy path — valid input, successful execution. Input validation, exception handling, and failure recovery paths are never tested.

### Why It Happens
Happy-path tests are easier to write. Failure paths require setting up error conditions, which takes more effort. Developers assume "validation happens in the FormRequest" (which is bypassed from CLI/queue).

### Warning Signs
- Every test for an action is a happy-path test
- The action has validation logic but no test for validation failures
- The action catches exceptions but no test verifies exception handling
- Tests never use `expectException()` or `assertThrows()`

### Why It Is Harmful
When the action is called from a queue or CLI (bypassing HTTP validation), invalid input reaches the action unchecked. The action silently fails or produces incorrect output without throwing an exception. Production errors go undetected.

### Real-World Consequences
A `RegisterUserAction` is called from a CLI command without the controller's FormRequest validation. An invalid email (empty string) passes through and creates a user with an empty email. No test caught it because only the happy path was tested.

### Preferred Alternative
Every action must have at least one happy-path test, one validation/exception test, and one side-effect test. Test both valid and invalid inputs directly on the action.

### Refactoring Strategy
1. For each action, identify the validation rules and failure conditions.
2. Write a test for each failure path using `expectException()` or `assertThrows()`.
3. Verify that invalid input produces a clear, typed exception (not a generic `Exception`).
4. Verify error messages are descriptive.
5. Add tests for edge cases: null values, empty strings, boundary values.

### Detection Checklist
- [ ] Does every action have at least one exception/validation test?
- [ ] Are `expectException()` or `assertThrows()` used in action tests?
- [ ] Are validation rules tested directly on the action (not just through FormRequest)?

### Related Rules
- Rule: Test Every Action's Exception and Error Paths

### Related Skills
- Skill: Write a Pure Unit Test for an Action
