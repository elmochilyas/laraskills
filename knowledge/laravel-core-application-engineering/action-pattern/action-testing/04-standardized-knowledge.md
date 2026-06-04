# ECC Standardized Knowledge — Action Testing

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Action Testing |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — Testing Strategy |
| **Last Updated** | 2026-06-02 |

---

## Overview

Action testing is the practice of verifying single-operation classes in isolation. Actions are the most testable pattern in Laravel because they are plain PHP classes with constructor injection — they can be instantiated without booting the framework, without database connections, and without HTTP state. This enables pure unit tests that execute in milliseconds, test the business logic directly, and fail with precise error messages about exactly which operation broke.

The engineering significance is that action testing shifts the testing burden from HTTP integration tests (slow, fragile, coupled to routing) to unit tests (fast, isolated, precise). An application with 50 actions and 150 action tests can verify every business operation in under a second without a single HTTP call, database query, or queue worker. The remaining integration tests cover only the orchestration and entry-point adapter logic.

---

## Core Concepts

### Action as Testable Unit

An action encapsulates exactly one operation with all its dependencies injectable. Constructor parameters are dependencies (mockable). Method parameters are operational input (controllable per test). The return value is the operation result (assertable). Exceptions are failure signals (assertable). Every aspect of the action's contract is testable without infrastructure.

### Unit Test vs Integration Test for Actions

- **Pure unit test**: Instantiate the action with mocked dependencies. No database, no framework boot. Runs in <1ms. Best for actions whose collaborators are interfaces or injected services.
- **Hybrid test**: Instantiate with real dependencies using `RefreshDatabase` for Eloquent queries. Runs in <10ms. Best for actions that use Eloquent directly without repository abstraction.
- **Integration test**: Call through controller/command. Framework boots. Runs in <100ms. Best for verifying the full adapter-action-infrastructure chain.

### Testing Pyramid for Actions

The majority of action tests should be pure unit tests (60%). Hybrid tests (30%) cover actions whose primary collaborator is a database. Integration tests (10%) cover edges where actions connect to entry points.

### QueueableActionFake

When testing actions that use `QueueableAction`, use `QueueableActionFake` to intercept dispatches. The fake intercepts `onQueue()->execute()` calls and tracks them in memory. No queue driver is needed.

---

## When To Use

- **Pure unit tests** for actions that depend on interfaces or injected services — mock the collaborators, test the interaction logic.
- **Hybrid database tests** for actions whose primary collaborator is the database — verify SQL queries, schema mappings, and constraint handling.
- **Orchestration verification tests** for services or orchestrators that compose multiple actions — mock the sub-actions, verify call order and data flow.
- **Queued action tests** with `QueueableActionFake` for actions that dispatch to the queue — verify that the correct action was dispatched with the correct parameters.
- **Business rule tests** for actions with domain logic — name tests by business outcome, not technical operation.

---

## When NOT To Use

- Do NOT test actions through HTTP controllers (feature tests) as the primary test strategy — HTTP tests add indirection, framework boot time, and coupling to routing/middleware.
- Do NOT mock every dependency — over-mocking creates tests that pass with wrong implementations. Use real implementations for simple dependencies.
- Do NOT test multiple actions in a single test class — each action deserves its own test class for maintainability and discoverability.
- Do NOT assert on queued action results by checking database state — without a queue worker, the dispatched action was never processed. Assert on the dispatch itself.

---

## Best Practices (WHY)

- **Maintain a 1:1 mapping between action files and test files.** `app/Actions/CreateUserAction.php` → `tests/Unit/Actions/CreateUserActionTest.php`. This ensures developers can always find the test for any action without searching.
- **Name tests by business outcome, not technical operation.** `test_it_prevents_registration_when_email_is_duplicate` survives refactoring. `test_it_calls_user_repository_create` breaks when the implementation changes.
- **Use pure unit tests for 60%+ of action tests.** Pure unit tests execute in <1ms, require no framework boot, and provide the fastest feedback loop.
- **Limit mocking to expensive dependencies.** Mock API clients, file systems, and mailers. Use real implementations for repositories and simple value objects.
- **Test each action's business rules, not its implementation details.** A test named by business outcome survives internal refactoring. A test named by method call breaks when the method name changes.
- **Freeze time in time-dependent tests.** Use `Carbon::setTestNow()` or Laravel's `Clock` facade to freeze time in tests that depend on `now()`, `Carbon::now()`, or `Date::now()`.

---

## Architecture Guidelines

- **Test file location:** `tests/Unit/Actions/{Domain}/{ActionName}Test.php`. Mirror the source directory structure.
- **Test class per action:** One test class per action class. No shared test classes for multiple actions.
- **Test method granularity:** One test method per business rule. A typical action has 3-5 test methods (happy path, validation, exception, side effects).
- **Coverage expectations:** Every action must have at least one happy-path test, one validation test, one exception test, and one side-effect test.
- **CI pipeline:** Run pure unit tests in the fastest CI stage (no external services required). Run hybrid and integration tests in subsequent stages.
- **Parallel execution:** Action tests are parallel-safe because they do not share state. PHPUnit's `--parallel` option works without modification.

---

## Performance

A pure unit action test (mocked dependencies, no database) executes in 0.1-0.5ms. A full suite of 200 action tests runs in under 100ms. This is 200-300x faster than feature tests (each requires framework boot, ~20-30ms). Hybrid tests using `DatabaseTransactions` (rollback instead of remigrate) run in 1-3ms per test. Hybrid tests using `RefreshDatabase` run in 5-10ms per test (migration + query).

---

## Security

Action testing improves security by enabling precise verification of authorization logic at the unit level. An action's execute method should be tested with both authorized and unauthorized inputs to verify that authorization checks are enforced. Testing authorization at the action level (rather than only at the HTTP level through middleware tests) ensures that authorization is enforced regardless of entry point — the same action called from a queue or CLI must still respect the authorization rules.

---

## Common Mistakes

- **Testing actions through HTTP controllers.** Writing a feature test that sends an HTTP request to test action logic adds unnecessary indirection, framework boot overhead, and coupling to routing/middleware. Test the action directly.
- **Not testing validation inside actions.** If an action validates its input, the validation must be tested. When the action is called from a queue or CLI, the controller's `FormRequest` is bypassed — the action's own validation is the only defense.
- **Over-mocking.** Mocking every dependency creates tests that pass even when the mock expectations diverge from the real implementation. Test with real implementations for simple dependencies.
- **Testing queued actions with database assertions.** Asserting on database changes to verify queued action behavior assumes the dispatched action has already executed. In tests without a queue worker, the action was never processed.
- **Shared mutable mocks.** Reusing a mock across multiple tests creates test pollution. Create fresh mocks in each test method.
- **Time-dependent test failures.** An action using `now()` without frozen time produces different results depending on when the test runs. Always freeze time in time-dependent tests.

---

## Anti-Patterns

- **Feature tests as the primary action test strategy.** Every action test goes through HTTP. Tests take 20-30ms each instead of <1ms. 200 action tests take 4-6 seconds instead of <100ms.
- **One giant test class for all action tests.** A single `ActionsTest.php` with 100 test methods for 20 different actions. Tests are hard to find and maintain. Use one test class per action.
- **Mocking every collaborator.** A test that mocks a `UserRepository` (simple Eloquent wrapper), a `Logger`, a `Mailer`, and a `Cache` for a simple create-user action. The test is tightly coupled to the implementation.
- **Testing implementation details.** Tests named `testCreateCalledOnRepository`, `testMethodReturnsUser`, `testExceptionWhenEmailExists` that break on every refactoring because they test method calls rather than business outcomes.
- **No exception tests.** Tests only cover the happy path. When invalid input is provided, the action silently fails or produces incorrect output without throwing an exception. The test suite never catches it.

---

## Examples

### Pure Unit Test Pattern
```php
public function test_it_creates_a_user(): void
{
    $repo = Mockery::mock(UserRepository::class);
    $repo->shouldReceive('create')
        ->once()
        ->with(['name' => 'Test', 'email' => 'test@test.com'])
        ->andReturn(new User(['id' => 1, 'name' => 'Test']));

    $action = new CreateUserAction($repo);
    $user = $action->execute(['name' => 'Test', 'email' => 'test@test.com']);

    $this->assertEquals('Test', $user->name);
}
```

### Business Rule Test Pattern
```php
public function test_it_rejects_duplicate_emails(): void
{
    $this->expectException(DuplicateEmailException::class);

    $repo = Mockery::mock(UserRepository::class);
    $repo->shouldReceive('findByEmail')
        ->with('existing@test.com')
        ->andReturn(new User());
    $repo->shouldReceive('create')->never();

    $action = new CreateUserAction($repo);
    $action->execute(['name' => 'Test', 'email' => 'existing@test.com']);
}
```

### Orchestration Verification Pattern
```php
public function test_checkout_orchestrates_actions_in_order(): void
{
    $validateCart = Mockery::mock(ValidateCartAction::class);
    $processPayment = Mockery::mock(ProcessPaymentAction::class);
    $createOrder = Mockery::mock(CreateOrderAction::class);

    $validateCart->shouldReceive('execute')->once()->ordered();
    $processPayment->shouldReceive('execute')->once()->ordered();
    $createOrder->shouldReceive('execute')->once()->ordered()->andReturn($order);

    $service = new CheckoutService($validateCart, $processPayment, $createOrder);
    $result = $service->checkout($cart, $user);

    $this->assertSame($order, $result);
}
```

### Queued Action Test Pattern
```php
public function test_it_dispatches_invoice_generation(): void
{
    QueueableActionFake::fake();

    $action = new CreateOrderAction();
    $order = $action->execute($cart);

    QueueableActionFake::assertPushed(GenerateInvoiceAction::class);
    QueueableActionFake::assertPushed(function (GenerateInvoiceAction $a) use ($order) {
        return $a->orderId === $order->id;
    });
}
```

---

## Related Topics

- **Action Class Design** (prerequisite) — understanding the action's structure is prerequisite to testing it.
- **Service Layer Testing** (prerequisite) — testing patterns for services that orchestrate actions.
- **PHPUnit / Pest Basics** (prerequisite) — the testing framework used for action tests.
- **Action Composition** — how to test composed actions at the orchestrator level.
- **Queued Actions** — testing dispatch fakes without a queue worker.
- **Transactional Actions** — testing actions that interact with database transactions.
- **Mocking Strategies** — when to mock, stub, spy, or use real implementations.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Action Class Design, PHPUnit/Pest (prerequisites). Complements Controller Testing and Middleware Testing.
- **Key insight:** Actions are uniquely suited for pure unit testing among all Laravel patterns because they have no base class, no framework contract, and no required trait.
- **Testing pyramid for actions:** 60% pure unit, 30% hybrid, 10% integration. The majority should be pure unit tests.
- **1:1 action-to-test mapping** is an organizational convention, not enforced by any tool. It must be documented and followed by the team.
- **QueueableActionFake** intercepts `onQueue()->execute()` calls and tracks them in memory. Cannot verify worker-side execution — supplement with a single integration test per queued action.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Action testing pyramid documented | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Pure unit vs hybrid vs integration distinction | ✓ |
| Performance analysis | ✓ |
| Security considerations (auth testing) | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples for each pattern | ✓ |
| Related topics mapped | ✓ |
