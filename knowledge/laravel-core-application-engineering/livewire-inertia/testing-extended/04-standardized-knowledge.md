# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Testing |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Livewire provides a testing API for asserting component state, rendered output, events, and validation errors. `Livewire::test(Component::class)` creates a testable component instance that runs through the full Livewire lifecycle (hydration, action execution, rendering, dehydration). Assertions can check property values, see text, events dispatched, and validation state. The engineering value is server-side testing of interactive components without a browser.

---

## Core Concepts

- **`Livewire::test(Component::class)`**: Creates a testable component with full lifecycle
- **State assertions**: `assertSet('count', 1)`, `assertNotSet('count', 0)`, `assertCount('items', 3)`
- **Action testing**: `call('increment')` invokes a component action
- **Property setting**: `set('title', 'My Post')` sets a property and triggers `updated` hooks
- **Output assertions**: `assertSee('Post created')` checks rendered HTML
- **Event assertions**: `assertDispatched('event-name')` verifies event dispatch
- **Validation assertions**: `assertHasErrors('email')`, `assertHasNoErrors()`

---

## When To Use

- Testing component actions (click handlers, form submissions)
- Testing component state changes (property updates)
- Testing validation rules and error display
- Testing event dispatch and listener behavior
- Testing computed properties and lifecycle hooks

## When NOT To Use

- Testing Blade template logic (use regular Blade tests)
- Testing browser behavior (use Dusk for E2E)
- Testing third-party Livewire components
- Testing that doesn't involve component lifecycle

---

## Best Practices

- **Test component behavior, not implementation** — assert on state and output, not internal methods
- **Use `set()` and `call()` to simulate user interactions** — tests exercise the same code paths as real usage
- **Test validation rules thoroughly** — use datasets for combinatorial rule testing
- **Test event dispatching** — verify events are dispatched with correct data
- **Test authorization scenarios** — ensure unauthorized actions are rejected
- **Keep tests focused** — one test per behavior/action/scenario

---

## Architecture Guidelines

- `Livewire::test(Component::class)` boots full Laravel kernel, runs middleware, real container
- `set('property', value)` triggers `updated[Property]()` hook if it exists
- `call('action')` triggers `callBefore()` → action → `callAfter()` → re-render
- `assertSee()` checks rendered HTML output
- `assertDispatched('name')` checks the event dispatch queue
- `assertHasErrors('field')` checks the validation error bag
- Tests are integration-level — they exercise the full stack (DB, session, auth)

---

## Performance

Livewire tests run in the full Laravel environment (boot kernel, run middleware). Each test completes in 50-200ms. Use database transactions for isolation to improve test suite speed. Use `#[DataProvider]` (PHPUnit) or Pest datasets for combinatorial tests to reduce boilerplate.

---

## Security

Livewire tests respect the same security model as production — CSRF, authorization, and validation all apply. Test authorization scenarios to ensure checks are working. Verify that sensitive state is not exposed in rendered output.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Testing private methods | White-box testing | Tests break on refactoring | Test through public API (call, set, assert) |
| Not testing validation | Assuming rules work | Undetected rule gaps | Test both valid and invalid data |
| Not testing authorization | Auth works in dev mode | Missing auth checks in production | Test with actingAs() and without |
| Forgetting `->call()->assert...` chaining | Not testing after action | State change untested | Chain assertions after each action |
| Testing framework internals | Asserting on snapshot data | Fragile tests | Test component behavior, not internals |

---

## Anti-Patterns

- **Testing Livewire internals**: Asserting on hydration data instead of component state
- **200-line test for simple component**: Over-testing trivial functionality
- **No validation tests**: Assuming the `$rules` property works without testing
- **Testing through HTTP instead of Livewire::test**: Slower, less focused

---

## Examples

**Basic component test:**
```php
use Livewire\Livewire;

class CounterTest extends TestCase
{
    public function test_can_increment()
    {
        Livewire::test(Counter::class)
            ->assertSee('0')
            ->call('increment')
            ->assertSee('1')
            ->assertSet('count', 1);
    }
}
```

**Property setting and validation:**
```php
Livewire::test(CreatePost::class)
    ->set('title', 'My Post')
    ->set('body', 'Post body content')
    ->call('save')
    ->assertHasNoErrors()
    ->assertSee('Post created');
```

**Event assertion:**
```php
Livewire::test(TodoList::class)
    ->call('deleteTodo', 1)
    ->assertDispatched('todo-deleted', todoId: 1);
```

**Validation error test:**
```php
Livewire::test(CreatePost::class)
    ->set('title', '')
    ->call('save')
    ->assertHasErrors('title');
```

**Authorization test:**
```php
Livewire::actingAs($regularUser)
    ->test(AdminDashboard::class)
    ->call('deleteUser', 1)
    ->assertForbidden();
```

---

## Related Topics

- livewire/component-architecture — Component fundamentals
- livewire/actions-events — Testing actions and events
- livewire/validation — Testing validation
- livewire/lifecycle-hooks — Testing lifecycle behavior

---

## AI Agent Notes

- `Livewire::test()` creates a new component instance, calls boot() and mount(), renders
- On `call('action')`, the process repeats: action runs, render, assert
- Livewire tests run in a real Laravel environment — database, session, auth
- CSRF is handled automatically
- Tests are integration-level — they exercise the full stack
- `assertDispatched('name')` checks the event dispatch queue

---

## Verification

- [ ] Component actions tested via `call()`
- [ ] Property updates tested via `set()`
- [ ] Validation rules tested (both pass and fail)
- [ ] Event dispatching tested
- [ ] Authorization scenarios tested
- [ ] Rendered output asserted via `assertSee()`
- [ ] Tests focused on behavior, not implementation
- [ ] Test suite uses database transactions for isolation
