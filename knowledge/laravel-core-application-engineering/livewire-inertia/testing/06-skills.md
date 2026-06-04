# Skill: Write Server-Side Tests for Inertia Pages

## Purpose

Use `assertInertia()` with `AssertableInertia` to validate that controllers return the correct components with the expected props, covering authorization, shared data, and error states.

## When To Use

Testing every Inertia-rendered route for correct component and critical props. Also when adding authorization tests, shared data validation, or regression tests for prop shape changes.

## When NOT To Use

- Blade-only routes (use standard `assertView()` assertions)
- API endpoints (use `assertJson()` assertions)
- Browser behavior (use Playwright/Cypress for E2E)
- Livewire components (use Livewire testing utilities)

## Prerequisites

- `inertia-laravel` installed (provides `assertInertia()`)
- PHPUnit or Pest configured
- Database configured for tests

## Inputs

- Route URL and HTTP method
- Expected component name
- Critical prop keys and values
- Authorization scenarios (guest, user, admin)

## Workflow

1. Create a test file for each controller or page group
2. Test the successful page render: `actingAs($user)->get('/dashboard')->assertInertia(...)`
3. Assert the correct component name: `$page->component('Dashboard')`
4. Assert critical props exist with correct types/values: `$page->has('stats')`, `$page->where('user.id', $user->id)`
5. Append `->etc()` to allow future prop additions without breaking tests
6. Create a dedicated `SharedDataTest` for global props — don't repeat on every page test
7. Test authorization scenarios:
   - Guest redirect: `$this->get('/dashboard')->assertRedirect('/login')`
   - Authorized access: `$this->actingAs($user)->get('/dashboard')->assertInertia(...)`
   - Unauthorized data absence: `$page->missing('admin_stats')`
8. Test error states: 404 pages, 403 responses, validation errors with `assertSessionHasErrors()`
9. For client-side tests, mock `usePage`, `useForm`, and `router` from `@inertiajs/react` and render page components with controlled props

## Validation Checklist

- [ ] Every Inertia-rendered route has a server-side test asserting the correct component
- [ ] A dedicated `SharedDataTest` validates global props
- [ ] Authorization tests exist for protected routes (guest redirect, user page, admin-specific data)
- [ ] Client-side tests exist for all page components with mocked Inertia hooks
- [ ] Error state tests exist (404, 403, validation errors)
- [ ] `etc()` used in assertions to prevent brittleness on prop additions
- [ ] `missing()` used to verify sensitive data is not exposed to unauthorized users

## Common Failures

- Using `assertJson()` or `assertSee()` for Inertia responses — fragile, miss protocol-level issues
- Testing shared data on every page — duplicated brittle assertions
- No authorization tests — missing auth checks in production
- No client-side tests — UI rendering bugs surface only in production
- Not using `etc()` — adding a new prop breaks every existing test for that page

## Decision Points

- Use `etc()` for most assertions to allow prop additions. Omit it only when testing exact prop shape
- Test shared data once in `SharedDataTest`. Individual page tests focus on page-specific props
- Use `missing()` when a prop should be absent for unauthorized users; use `where('key', null)` when it's intentionally null

## Performance Considerations

PHP Inertia tests run 50-200ms per test (no rendering, just JSON assertion). Bottleneck is typically database setup — use model factories and partial DB resets. Client-side tests run faster than E2E tests because they mock the Inertia layer.

## Security Considerations

Server tests verify that sensitive data is NOT passed to unauthorized users — use `$page->missing('admin_data')`. Test that guest users are redirected to login for protected routes. Authorization testing is critical for Inertia routes — security is in the controller.

## Related Rules

- Use assertInertia for Server Tests (05-rules.md)
- Isolate Shared Data Tests (05-rules.md)
- Use etc() for Resilient Prop Assertions (05-rules.md)
- Test Every Authorization State (05-rules.md)
- Use missing() for Sensitive Data Assertions (05-rules.md)
- Mock Inertia Hooks for Client Tests (05-rules.md)

## Related Skills

- Write Comprehensive Livewire Component Tests (livewire/testing)
- Create an Inertia Page Component with Typed Props (inertia/page-components)
- Configure and Type Shared Data (inertia/shared-data)

## Success Criteria

- Every Inertia route is covered by a test asserting the correct component name
- Shared data is tested once, not duplicated across page tests
- Authorization tests catch regressions in access control
- Adding a new prop doesn't break existing tests (thanks to `etc()`)
- Sensitive data absence is explicitly tested for unauthorized users
- Client-side component tests validate rendering with mocked Inertia hooks
