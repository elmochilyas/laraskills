# Livewire Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Livewire provides a testing API for asserting component state, rendered output, events, and validation errors. `Livewire::test(Component::class)` creates a testable component instance that runs through the full Livewire lifecycle (hydration, action execution, rendering, dehydration). Assertions can check property values, see text, events dispatched, and validation state.

The engineering value is server-side testing of interactive components without a browser. A Livewire test exercises the same code path as a real interaction — the component is hydrated, actions execute, properties update, and the view renders. This catches logic errors, validation failures, and rendering bugs before deployment.

---

## Core Concepts

### Basic Component Test

```php
use Livewire\Livewire;

class CounterTest extends TestCase
{
    public function test_can_increment()
    {
        Livewire::test(Counter::class)
            ->assertSee('0')    // Initial state
            ->call('increment')
            ->assertSee('1')    // After action
            ->assertSet('count', 1);
    }
}
```

### State Assertions

```php
Livewire::test(Counter::class)
    ->assertSet('count', 0)     // Exact property value
    ->assertNotSet('count', 1)  // Property is NOT this value
    ->assertCount('items', 3)   // Array property count
    ->assertHasNoErrors()        // No validation errors
    ->assertHasErrors('email')   // Has validation error for field
    ->assertDispatched('event-name') // Event was dispatched
    ->assertNotDispatched('other-event') // Event was NOT dispatched
```

### Setting Properties

```php
Livewire::test(CreatePost::class)
    ->set('title', 'My Post')
    ->set('body', 'Post body content')
    ->call('save')
    ->assertHasNoErrors()
    ->assertSee('Post created');
```

---

## Mental Models

### The Puppet Master

`Livewire::test()` is like a puppet master for the component. You pull strings (`set`, `call`, `assert`) and observe the puppet's reactions (`assertSee`, `assertSet`, `assertDispatched`). The puppet thinks it's interacting with a real browser, but it's a controlled test environment.

### The State Inspector

Think of `assertSet('count', 1)` as inspecting the component's internal state after an action. You're not testing the DOM — you're testing the PHP property values. This is unit-level granularity for server-driven components.

---

## Internal Mechanics

### Test Lifecycle

When `Livewire::test(Component::class)` is called:

1. A new component instance is created
2. `boot()` and `mount()` are called (full initialization)
3. The component is rendered (view is resolved)
4. Assertions run against the rendered output and component state
5. On `call('action')`, the process repeats: action runs, render, assert

### Real vs Mocked Environment

Livewire tests run in a real Laravel environment (database, session, auth). The test framework:
- Handles CSRF automatically
- Boots the full Laravel kernel
- Runs middleware
- Uses the real service container

This means tests are integration-level — they exercise the full stack.

---

## Patterns

### Form Submission Test

```php
public function test_create_post_form()
{
    Livewire::test(CreatePost::class)
        ->set('title', '')
        ->set('body', '')
        ->call('save')
        ->assertHasErrors(['title' => 'required', 'body' => 'required'])
        ->set('title', 'Valid Title')
        ->set('body', 'Valid body content that is long enough')
        ->call('save')
        ->assertHasNoErrors()
        ->assertSet('title', '') // Form was reset
        ->assertDispatched('post-created');
}
```

### Authentication in Tests

```php
public function test_admin_only_action()
{
    $user = User::factory()->create();
    $admin = User::factory()->admin()->create();

    // Test as regular user
    Livewire::actingAs($user)
        ->test(AdminPanel::class)
        ->assertForbidden(); // Or assertSee('Access Denied')

    // Test as admin
    Livewire::actingAs($admin)
        ->test(AdminPanel::class)
        ->assertSee('Admin Panel');
}
```

### Testing with Database

```php
public function test_user_list_shows_users()
{
    $users = User::factory()->count(3)->create();

    Livewire::test(UserList::class)
        ->assertSee($users[0]->name)
        ->assertSee($users[1]->name)
        ->assertSee($users[2]->name);
}
```

### Event Dispatch Testing

```php
public function test_delete_dispatches_event()
{
    $user = User::factory()->create();

    Livewire::test(UserList::class)
        ->call('deleteUser', $user->id)
        ->assertDispatched('user-deleted');
}

public function test_component_listens_to_event()
{
    Livewire::test(UserList::class)
        ->dispatch('user-deleted')
        ->assertSee('User deleted');
}
```

### Validation Error Testing

```php
public function test_validation_shows_errors()
{
    Livewire::test(CreatePost::class)
        ->set('title', 'ab') // Too short
        ->call('save')
        ->assertHasErrors('title')
        ->assertHasErrors(['title' => 'min:5']) // Specific rule
        ->assertSee('at least 5 characters');
}
```

---

## Architectural Decisions

### Livewire Test vs HTTP Test

| Concern | Livewire Test | HTTP Test |
|---|---|---|
| Component test | Direct (call actions, set properties) | Indirect (form submission) |
| Render assertions | `assertSee` on component output | `assertSee` on full response |
| State inspection | `assertSet('count', 1)` | `assertViewHas('count')` |
| Speed | Fast (component only) | Medium (full request) |
| Isolation | Component-specific | Full-page |

Use Livewire tests for component logic and state. Use HTTP tests for page-level integration.

### Unit vs Integration Test

Livewire tests are inherently integration tests (they boot the framework). True unit testing of component logic is possible by testing the component class directly:

```php
public function test_component_method()
{
    $component = new Counter();
    $component->increment();

    $this->assertEquals(1, $component->count);
}
```

---

## Tradeoffs

| Concern | Livewire::test | Unit Test (new Component) | Dusk Browser Test |
|---|---|---|---|
| Speed | Fast (10-50ms) | Fastest (<1ms) | Slow (2-10s) |
| Lifecycle coverage | Full (boot, mount, render) | None (direct method call) | Full browser |
| JavaScript testing | None | None | Full (JS execution) |
| Debugging | Medium | Easy | Hard |

---

## Performance Considerations

Livewire tests boot the framework for each test method (similar to HTTP tests). A test with 3 assertions runs in ~50ms. A suite of 100 tests completes in ~5s.

---

## Production Considerations

### Test Every Action and Hook

Each public action and lifecycle hook should have a test:

```php
public function test_mount_loads_initial_data()
{
    Livewire::test(UserDashboard::class)
        ->assertSet('stats', [])
        ->assertSee('Loading...');
}

public function test_search_updates_results()
{
    Livewire::test(UserSearch::class)
        ->set('search', 'John')
        ->assertSet('results', /* ... */);
}
```

### Test Validation Rules

Every validation rule should be tested for both passing and failing cases.

### Test Event Communication

Events that communicate between components should have tests for both dispatch and listening.

---

## Common Mistakes

### Forgetting to Assert

Calling actions without asserting the result. Every action call should be followed by at least one assertion.

### Testing Implementation, Not Behavior

```php
// Bad: testing internal implementation
Livewire::test(Counter::class)
    ->call('increment')
    ->assertSet('count', 1); // Tests property value, not behavior

// Good: testing behavior
Livewire::test(Counter::class)
    ->call('increment')
    ->assertSee('1'); // Tests what the user sees
```

### Not Testing Validation Errors

Validation errors are a common source of bugs. Test both passing and failing validation.

---

## Failure Modes

### Database State Leak

Livewire tests that modify the database affect subsequent tests in the same class. Use `RefreshDatabase` trait or transactional tests.

### Event Listener Not Registered

If a component dispatches an event but the listener is not registered, the test passes (dispatch succeeded) but the listener never fires. Test listeners separately.

---

## Ecosystem Usage

Livewire testing integrates with PHPUnit and Pest for server-side tests. The `Livewire::test()` method is part of the Livewire core package. Tests can use Laravel's model factories, database migrations, and authentication systems. No JavaScript testing framework is needed since Livewire is server-rendered.

## Related Knowledge Units

- **Component Architecture** (this workspace) — component structure
- **Actions and Events** (this workspace) — testing actions and events
- **Validation** (this workspace) — testing validation rules
- **Lifecycle Hooks** (this workspace) — testing hook execution

---

## Research Notes

- `Livewire::test()` returns `TestableLivewireCanary` instance — provides all assertion methods
- The `->assertSet()` method checks component properties directly (not rendered HTML)
- The `->assertDispatched()` method checks events dispatched during the action
- Livewire tests are compatible with PHPUnit and Pest
