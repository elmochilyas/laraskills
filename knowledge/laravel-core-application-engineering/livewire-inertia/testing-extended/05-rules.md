## Rule: Test Component Behavior, Not Implementation

Assert on observable component state and output, not on internal method calls or private properties.

---

## Category

Testing

---

## Rule

Use `assertSet()`, `assertSee()`, `assertDispatched()`, and other public-state assertions. Do not assert that specific internal methods were called, do not test private/protected methods directly, and do not assert on intermediate hydration data.

---

## Reason

Testing implementation details creates brittle tests that break on refactoring even when the component's behavior remains correct. Tests that assert on state and output survive internal refactors, method renames, and lifecycle changes. They document what the component actually does, not how it does it.

---

## Bad Example

```php
Livewire::test(Counter::class)
    ->assertMethodCalled('increment') // Implementation detail
    ->assertPropertyNotSet('count'); // Internal state, not behavior
```

---

## Good Example

```php
Livewire::test(Counter::class)
    ->assertSee('0')
    ->call('increment')
    ->assertSee('1')
    ->assertSet('count', 1);
```

---

## Exceptions

When debugging a complex lifecycle issue, you may temporarily add assertions on internal behavior. Remove them before committing — they are not valid regression tests.

---

## Consequences Of Violation

Maintenance risks: tests break on every refactor. False negatives: tests fail when behavior is correct.

---

## Rule: Use call and set to Simulate User Interactions

Test component actions through `call()` and property updates through `set()` — the same paths real users trigger.

---

## Category

Testing

---

## Rule

Simulate user interactions with `call('action')`, `call('action', $param)`, and `set('property', $value)`. Do not bypass the component's public API by directly modifying properties with reflection or calling internal methods.

---

## Reason

`call()` and `set()` exercise the full Livewire lifecycle — they trigger `updated` hooks, validation, authorization checks, and re-rendering. Direct property manipulation or internal method calls skip these steps, giving false confidence that the component works correctly.

---

## Bad Example

```php
// Skips validation, updated hooks, and authorization
$this->component->title = 'Test'; // Direct property access
$this->component->save(); // Internal method call
```

---

## Good Example

```php
Livewire::test(CreatePost::class)
    ->set('title', 'Test')
    ->call('save')
    ->assertHasNoErrors();
```

---

## Exceptions

Setting up initial test state (e.g., creating related models, configuring the database) is done outside the Livewire test builder. Only component interactions must use `call()` and `set()`.

---

## Consequences Of Violation

Testing gaps: lifecycle hooks, validation, and authorization not exercised in tests. False confidence: tests pass, component fails in production.

---

## Rule: Test Both Validation Pass and Fail Paths

Write test cases for both valid data (assert no errors) and invalid data (assert specific errors) for every validation rule.

---

## Category

Testing

---

## Rule

For each validation rule on a component, write two tests: one with valid data that asserts `assertHasNoErrors()`, and one with invalid data that asserts `assertHasErrors('field')` with the expected field. Use data providers or Pest datasets to cover combinatorial cases.

---

## Reason

Testing only the happy path leaves validation gaps undetected. A misconfigured rule (wrong syntax, missing field, incorrect rule name) may silently allow invalid data. Testing the failure path confirms the rule is correctly defined and applied.

---

## Bad Example

```php
// Only tests success path
Livewire::test(CreatePost::class)
    ->set('title', 'Valid Title')
    ->call('save')
    ->assertHasNoErrors();
```

---

## Good Example

```php
Livewire::test(CreatePost::class)
    ->set('title', '')
    ->call('save')
    ->assertHasErrors('title');

Livewire::test(CreatePost::class)
    ->set('title', 'Valid Title')
    ->call('save')
    ->assertHasNoErrors();
```

---

## Exceptions

For simple `required` rules on a field, a single failure test may be sufficient. For rules with multiple constraints (e.g., `min:3|max:255|regex:/^[a-z]+$/`), test each constraint boundary.

---

## Consequences Of Violation

Reliability risks: invalid data stored or processed due to undetected validation gaps. Security risks: malicious input passes through missing validation.

---

## Rule: Test Authorization Scenarios

Test that unauthorized users cannot perform protected actions and that authorized users can.

---

## Category

Testing

---

## Rule

For every action that requires authorization, write tests with `Livewire::actingAs($unauthorizedUser)` and `Livewire::actingAs($authorizedUser)`. Assert `assertForbidden()` or appropriate error behavior for unauthorized attempts.

---

## Reason

Authorization checks in Livewire components are as critical as in controllers. Without testing, a missing `$this->authorize()` call goes undetected until a user exploits it. Testing both authorized and unauthorized paths ensures the authorization is correctly implemented and enforced.

---

## Bad Example

```php
// Only tests happy path
Livewire::actingAs($admin)
    ->test(AdminPanel::class)
    ->call('deleteUser', 1)
    ->assertSuccessful();
// No test for regular user attempting deletion
```

---

## Good Example

```php
Livewire::actingAs($regularUser)
    ->test(AdminPanel::class)
    ->call('deleteUser', 1)
    ->assertForbidden();

Livewire::actingAs($admin)
    ->test(AdminPanel::class)
    ->call('deleteUser', 1)
    ->assertSuccessful();
```

---

## Exceptions

Public components that have no authorization requirements (search bars, public comment forms) do not need authorization tests.

---

## Consequences Of Violation

Security risks: unauthorized action execution undetected. Access control gaps: missing authorization checks invisible in test output.

---

## Rule: Test Event Dispatching

Assert that components dispatch the expected events with the correct data.

---

## Category

Testing

---

## Rule

After calling an action that should dispatch an event, use `assertDispatched('event-name')` to verify the event was dispatched. Use the named argument syntax to assert event data.

---

## Reason

Events are the primary mechanism for cross-component communication in Livewire. If an event is not dispatched (wrong name, wrong data, wrong condition), dependent components do not react. Testing event dispatch catches listener name mismatches and missing dispatch calls.

---

## Bad Example

```php
Livewire::test(TodoList::class)
    ->call('deleteTodo', 1);
// No assertion — event may not have been dispatched
```

---

## Good Example

```php
Livewire::test(TodoList::class)
    ->call('deleteTodo', 1)
    ->assertDispatched('todo-deleted', todoId: 1);
```

---

## Exceptions

Events dispatched to external systems (broadcast events) may require integration testing rather than component testing. Unit-test the dispatch logic, use E2E for the external integration.

---

## Consequences Of Violation

Reliability risks: broken cross-component communication undetected. Debugging difficulty: event listener mismatches found only in manual testing.

---

## Rule: One Focused Test Per Behavior

Write one test per behavior, action, or scenario. Do not chain multiple unrelated assertions into a single test method.

---

## Category

Testing

---

## Rule

Each test method should verify one specific behavior. If a test asserts validation, event dispatch, output, AND state change, split it into multiple tests. Name each test to describe the single behavior it verifies.

---

## Reason

A test that asserts many things fails with a generic message, making it hard to identify which behavior broke. When multiple behaviors are tested together, a failure in the first assertion prevents later assertions from running, hiding additional regressions. Focused tests provide precise failure feedback.

---

## Bad Example

```php
public function test_component_works(): void
{
    Livewire::test(Counter::class)
        ->assertSee('0')
        ->call('increment')
        ->assertSee('1')
        ->assertSet('count', 1)
        ->assertDispatched('incremented');
    // If assertSee fails, we never know if dispatch worked
}
```

---

## Good Example

```php
public function test_displays_initial_count(): void { ... }

public function test_increment_updates_display(): void { ... }

public function test_increment_sets_property(): void { ... }

public function test_increment_dispatches_event(): void { ... }
```

---

## Exceptions

Setters and getters that are always tested together (set then get) can be combined. The test name must clearly state both behaviors.

---

## Consequences Of Violation

Maintenance risks: failing tests provide unclear failure reasons. Testing gaps: regressions hidden behind earlier assertion failures.

---

## Rule: Use Database Transactions for Test Isolation

Wrap each test in a database transaction to ensure clean state between tests.

---

## Category

Testing

---

## Rule

Use the `RefreshDatabase` trait or `DatabaseTransactions` trait in every Livewire test class that interacts with the database. Never rely on test execution order or manual cleanup.

---

## Reason

Livewire tests run in a full Laravel environment with a real database. Without transaction isolation, records created in one test leak into subsequent tests, causing order-dependent failures. These failures are intermittent, hard to reproduce, and waste development time.

---

## Bad Example

```php
class CounterTest extends TestCase
{
    // No transaction trait — tests may affect each other
}
```

---

## Good Example

```php
use Illuminate\Foundation\Testing\RefreshDatabase;

class CounterTest extends TestCase
{
    use RefreshDatabase; // Each test starts with a clean database
}
```

---

## Exceptions

Tests that specifically verify cross-request behavior (e.g., session persistence) may need to commit transactions. These tests should clean up their data explicitly in `tearDown()`.

---

## Consequences Of Violation

Reliability risks: order-dependent test failures. Debugging time: intermittent failures waste developer hours.
