# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Testing |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Inertia testing validates that controllers return the correct Inertia responses with the expected props, that shared data is injected properly, and that client-side page components render correctly with given props. The testing strategy splits into server-side (PHP tests using `AssertableInertia`) and client-side (Vitest/Jest for component rendering). The engineering value is confidence that the server sends the correct data to the correct component, and the client renders it correctly — catching prop shape mismatches, missing data, and authorization failures before they reach production.

---

## Core Concepts

- **`assertInertia()`**: Laravel test assertion method that allows fluent inspection of Inertia responses
- **`AssertableInertia`**: Class with chainable assertion methods — `component()`, `has()`, `where()`, `whereType()`, `missing()`, `etc()`
- **Server-side testing**: Validates component name and props returned by controllers using PHPUnit/Pest
- **Client-side testing**: Validates page component rendering with mocked Inertia hooks using Vitest/Jest
- **`$page->component('Name', true)`**: Assert exact component name match (second param enforces exact match)
- **`$page->etc()`**: Allows extra props beyond those asserted — makes tests resilient to additions
- **Contract testing pattern**: Server tests assert "server sends component X with props Y"; client tests assert "given props Y, component renders correctly"

---

## When To Use

- Testing every Inertia-rendered route for correct component and critical props
- Testing authorization — guests get redirect, users get page, admins get admin-specific data
- Testing shared data is present and correct
- Testing client-side component rendering with different prop states
- Testing form submission flows (success redirect, validation error response)

## When NOT To Use

- Testing Blade-only routes (use standard `assertView()` assertions)
- Testing external API endpoints (use standard `assertJson()` assertions)
- Testing browser behavior like clicks and navigation (use Playwright/Cypress for E2E)
- Testing Livewire components (use Livewire testing utilities)

---

## Best Practices

- **Test every Inertia-rendered route for the correct component** and its critical props
- **Test shared data once** in a dedicated `SharedDataTest` — don't repeat on every page test
- **Test authorization scenarios** — guest gets redirect, user gets page, admin gets admin-specific props
- **Test error states** — 404 pages, 403 responses, validation errors with `assertSessionHasErrors()`
- **Mock `usePage` on the client side** — don't try to mount a full Inertia app in tests
- **Use `etc()` in assertions** to allow new props without breaking existing tests
- **Use `missing()` to verify sensitive data is NOT sent** to unauthorized users
- **Run server and client tests in CI** — they're independent but both must pass

---

## Architecture Guidelines

- `assertInertia()` verifies the response has `X-Inertia` header and parses the JSON response
- `AssertableInertia` captures the component name and props without actually rendering anything
- Server tests verify the data contract (what is sent); client tests verify the rendering contract (how it looks)
- Client-side testing uses `vi.mock('@inertiajs/react')` to mock `usePage`, `useForm`, and `router`
- Inertia does NOT provide client-side testing utilities — standard Vitest/Jest patterns apply
- Server tests do NOT verify HTML output — they verify the JSON response structure

| Test Type | What It Validates | What It Misses |
|-----------|-------------------|----------------|
| Server (PHP) | Correct component + props | Visual output |
| Client (JS) | Correct rendering of props | Data shape |
| E2E (Playwright) | Full integration | Speed/cost |

---

## Performance

Inertia tests are fast on both sides. PHP tests run 50-200ms per test (no rendering, just JSON assertion). JS tests run 100-300ms per test (jsdom, no browser). The bottleneck is typically database setup (RefreshDatabase) — use model factories and partial DB resets. Client-side tests run faster than E2E tests because they mock the Inertia layer instead of making real HTTP requests.

---

## Security

- Server tests verify that sensitive data is NOT passed to unauthorized users — use `$page->missing('admin_data')`
- Test that guest users are redirected to login for protected Inertia routes
- Test that validation errors return 422 with correct error structure (not 500)
- Authorization testing is critical for Inertia routes — the component is just a view, security is in the controller

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not using `assertInertia` | Using `assertJson` or `assertSee` for Inertia responses | Fragile tests that break on non-essential changes | Use `assertInertia()` fluent API |
| Testing shared data on every page | Repeating auth/flash assertions on every page test | Brittle, duplicated tests | Test shared data once in a dedicated test |
| Mocking too broadly | `vi.mock('@inertiajs/react')` without spreading actual exports | `useForm`, `router`, `Link` become undefined | Mock only what's needed; spread the rest |
| Forgetting authorization tests | Only testing the happy path | Missing auth checks in production | Test with `actingAs()` and without |
| No client-side tests | Only testing server-side | UI rendering bugs surface only in production | Add client-side tests for all page components |

---

## Anti-Patterns

- **Testing Inertia internals**: Asserting on `X-Inertia` headers or raw JSON response instead of using `assertInertia()`
- **One test for everything**: A single 100-line test that checks every prop, component, and shared data value — hard to debug when it fails
- **No client-side tests**: Assuming that if the server sends correct props, the component renders correctly — components can have bugs too
- **Brittle prop assertions**: Using `whereAll()` with every prop value — breaks when any prop changes. Use `etc()` and test only critical values
- **Skipping E2E entirely**: Server + client unit tests miss integration bugs. Add Playwright/Cypress for critical user flows

---

## Examples

### Server-Side Page Test

```php
public function test_dashboard_shows_user_stats()
{
    $user = User::factory()->hasPosts(5)->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->has('stats')
            ->has('recentPosts', 5)
            ->where('user.id', $user->id)
        );
}
```

### Shared Data Test

```php
public function test_shared_auth_data_is_present()
{
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.id', $user->id)
            ->where('auth.user.email', $user->email)
        );
}
```

### Client-Side Component Test

```tsx
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

vi.mock('@inertiajs/react', async () => {
    const actual = await vi.importActual('@inertiajs/react');
    return {
        ...actual,
        usePage: () => ({
            props: {
                stats: { users: 100, revenue: 50000 },
                user: { name: 'Alice' },
            },
        }),
    };
});

it('shows welcome message', () => {
    render(<Dashboard />);
    expect(screen.getByText('Welcome, Alice')).toBeInTheDocument();
});

it('displays revenue', () => {
    render(<Dashboard />);
    expect(screen.getByText('$50,000')).toBeInTheDocument();
});
```

### Authorization Test

```php
public function test_guest_is_redirected_from_dashboard()
{
    $this->get('/dashboard')->assertRedirect('/login');
}

public function test_admin_sees_admin_dashboard()
{
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page->component('AdminDashboard'));
}
```

---

## Related Topics

- Page Components — what server tests validate
- Server Props — what props tests assert on
- Shared Data — testing global props
- Form Handling — testing form submissions
- Partial Reloads — testing partial responses
- Livewire Testing — analogous testing approach in Livewire

---

## AI Agent Notes

- `AssertableInertia` is the central server-side testing class in inertia-laravel
- `assertInertia()` accepts a closure receiving `AssertableInertia`
- Component assertion: `$page->component('Name', true)` — second param enforces exact match
- Prop assertions: `has()`, `where()`, `whereAll()`, `whereType()`, `missing()`, `etc()`
- Client-side testing uses standard Vitest/Jest with mocked Inertia hooks
- Inertia does NOT provide client-side testing utilities — standard component testing patterns apply
- Mock `usePage`, `useForm`, and `router` for client component tests

---

## Verification

- Every Inertia-rendered route has a server-side test asserting the correct component
- A dedicated `SharedDataTest` validates global props
- Authorization tests exist for protected routes (guest redirect, user page, admin props)
- Client-side tests exist for all page components with mocked Inertia hooks
- Error state tests exist (404, 403, validation errors)
- `etc()` is used in assertions to prevent brittleness on prop additions
- `missing()` is used to verify sensitive data is not exposed
