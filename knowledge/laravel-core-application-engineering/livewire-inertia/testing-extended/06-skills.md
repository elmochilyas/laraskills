# Skill: Write Comprehensive Livewire Component Tests

## Purpose

Use `Livewire::test()` to validate component behavior — action execution, property updates, validation rules, event dispatch, and authorization — through the public API.

## When To Use

Testing every Livewire component's actions, state changes, validation rules, event dispatch, and authorization. Adding regression tests for bug fixes.

## When NOT To Use

- Testing Blade template logic in isolation (use regular Blade tests)
- Testing browser behavior (use Laravel Dusk for E2E)
- Testing third-party Livewire components

## Prerequisites

- Livewire installed
- PHPUnit or Pest configured
- Database configured for tests (use `RefreshDatabase` or `DatabaseTransactions`)

## Inputs

- Component class name
- Test scenarios (happy path, validation failures, authorization)
- Expected state and output after each action

## Workflow

1. Create a test file for each component or component group
2. Use `Livewire::test(Component::class)` to create a testable component instance
3. Simulate user interactions with `call('action', $params)` and `set('property', $value)`:
   ```php
   Livewire::test(Counter::class)
       ->assertSee('0')
       ->call('increment')
       ->assertSee('1')
       ->assertSet('count', 1);
   ```
4. Test both validation pass and fail paths for every validation rule:
   ```php
   Livewire::test(CreatePost::class)
       ->set('title', '')
       ->call('save')
       ->assertHasErrors('title');
   ```
5. Test event dispatching with `assertDispatched('event-name', data: [...])`
6. Test authorization scenarios with `Livewire::actingAs($user)`:
   ```php
   Livewire::actingAs($regularUser)
       ->test(AdminPanel::class)
       ->call('deleteUser', 1)
       ->assertForbidden();
   ```
7. Use `RefreshDatabase` trait for test isolation
8. Keep each test focused on one behavior — one test per action/scenario
9. Use `assertSet()`, `assertSee()`, `assertDispatched()` — test behavior, not implementation

## Validation Checklist

- [ ] Component actions tested via `call()`
- [ ] Property updates tested via `set()`
- [ ] Validation rules tested (both pass and fail paths)
- [ ] Event dispatching tested with `assertDispatched()`
- [ ] Authorization scenarios tested (authorized and unauthorized)
- [ ] Rendered output asserted via `assertSee()` where applicable
- [ ] Tests focused on behavior (not internal method calls or private properties)
- [ ] Test suite uses database transactions or refresh for isolation

## Common Failures

- Testing implementation details (private methods, internal state) — brittle tests
- Not testing validation — undetected rule gaps
- Not testing authorization — missing auth checks in production
- Forgetting `->call()->assert...` chaining — state change untested
- Skipping `RefreshDatabase` — order-dependent test failures
- One giant test for everything — hard to identify which behavior broke

## Decision Points

- Use `assertSet()` and `assertSee()` for behavioral assertions. Don't assert on internal hydration data or private properties
- Test both valid data (assert no errors) and invalid data (assert specific errors) for every validation rule
- Write separate tests for each authorization level (guest, user, admin)

## Performance Considerations

Livewire tests run in the full Laravel environment (boot kernel, run middleware). Each test completes in 50-200ms. Use database transactions for isolation to improve test suite speed. Use Pest datasets or PHPUnit data providers for combinatorial tests.

## Security Considerations

Livewire tests respect the same security model as production — CSRF, authorization, and validation all apply. Test authorization scenarios to ensure checks are working. Verify that sensitive state is not exposed in rendered output.

## Related Rules

- Test Component Behavior, Not Implementation (05-rules.md)
- Use call and set to Simulate User Interactions (05-rules.md)
- Test Both Validation Pass and Fail Paths (05-rules.md)
- Test Authorization Scenarios (05-rules.md)
- Test Event Dispatching (05-rules.md)
- One Focused Test Per Behavior (05-rules.md)
- Use Database Transactions for Test Isolation (05-rules.md)

## Related Skills

- Write Server-Side Tests for Inertia Pages (inertia/testing)
- Create a Well-Structured Livewire Component (livewire/component-architecture)
- Implement and Test Livewire Actions with Events (livewire/actions-events)

## Success Criteria

- Every component action is tested with correct state and output assertions
- Validation rules are tested with both valid and invalid data
- Authorization is tested for all access levels
- Events are verified to dispatch with the correct data
- Tests use the public API (`call`, `set`, `assert`) — not internal implementation details
- Test database is isolated — no order-dependent failures
- Each test covers exactly one behavior — clear failure feedback
