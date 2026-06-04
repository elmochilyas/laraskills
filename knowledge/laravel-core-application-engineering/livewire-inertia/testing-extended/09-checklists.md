# Livewire Testing — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire
- **Knowledge Unit:** Livewire Testing
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] PHPUnit/Pest installed
- [ ] `Livewire::test()` available (Livewire testing utilities)
- [ ] Database configured for test environment
- [ ] Model factories defined for test data

## Implementation Checklist
- [ ] Component actions tested via `call()`
- [ ] Property updates tested via `set()`
- [ ] Validation rules tested (both pass and fail)
- [ ] Event dispatching tested
- [ ] Authorization scenarios tested
- [ ] Rendered output asserted via `assertSee()`
- [ ] Tests focused on behavior, not implementation
- [ ] Test suite uses database transactions for isolation
- [ ] Authorization tested with `actingAs()` and without
- [ ] Computed properties tested for caching behavior

## Verification Checklist
- [ ] `Livewire::test(Component::class)` creates testable component with full lifecycle
- [ ] `set('property', value)` triggers `updated[Property]()` hook if exists
- [ ] `call('action')` triggers `callBefore()` → action → `callAfter()` → re-render
- [ ] `assertSee()` checks rendered HTML output
- [ ] `assertDispatched('name')` checks event dispatch queue
- [ ] `assertHasErrors('field')` checks validation error bag
- [ ] `assertSet('count', 1)` checks property values
- [ ] `assertForbidden()` checks authorization rejection
- [ ] Tests use chainable API: `->set()->call()->assertSee()`

## Security Checklist
- [ ] Livewire tests respect same security model (CSRF, authorization, validation)
- [ ] Authorization scenarios tested (regular user vs admin)
- [ ] Sensitive state verified NOT exposed in rendered output
- [ ] Validation tests confirm rules reject invalid data
- [ ] `assertForbidden()` used for unauthorized action access
- [ ] Re-authentication scenarios tested for sensitive operations

## Performance Checklist
- [ ] Tests run in full Laravel environment (50-200ms per test)
- [ ] Database transactions used for isolation (fast test suite)
- [ ] `#[DataProvider]` or Pest datasets used for combinatorial tests
- [ ] No 200-line tests for simple components
- [ ] Test focused on one behavior per test method
- [ ] Tests don't assert on hydration data (component internals)

## Production Readiness Checklist
- [ ] All component actions have corresponding tests
- [ ] Validation rules are tested with both valid and invalid data
- [ ] Event dispatching is tested for correctness
- [ ] Test suite runs in CI pipeline
- [ ] Tests are maintainable (not brittle, not testing internals)
- [ ] Coverage includes edge cases (empty data, boundary values)
- [ ] No tests relying on `assertSee` for non-visual logic

## Common Mistakes to Avoid
- [ ] Testing private methods — tests break on refactoring
- [ ] Not testing validation — undetected rule gaps
- [ ] Not testing authorization — missing auth checks in production
- [ ] Forgetting `->call()->assert...` chaining — state change untested
- [ ] Testing Livewire internals (hydration data) — fragile tests
- [ ] No validation tests — assuming `$rules` property works without testing
- [ ] Testing through HTTP instead of `Livewire::test` — slower, less focused
