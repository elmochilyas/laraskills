## Rule: Use assertInertia for Server Tests

Always use `assertInertia()` with the fluent `AssertableInertia` API when testing Inertia controller responses.

---

## Category

Testing

---

## Rule

Use `$response->assertInertia(fn ($page) => $page->component('Name')->has('prop'))` rather than `assertJson()`, `assertSee()`, or raw header assertions for Inertia routes.

---

## Reason

`assertInertia()` validates the complete Inertia protocol — the `X-Inertia` header, correct JSON structure, component name, and props. Raw `assertJson()` or `assertSee()` tests are brittle, miss protocol-level issues, and break on non-essential Inertia version changes.

---

## Bad Example

```php
$this->get('/dashboard')
    ->assertJson(['component' => 'Dashboard']) // raw JSON — brittle
    ->assertSee('Welcome'); // wrong — Inertia returns JSON, not HTML
```

---

## Good Example

```php
$this->actingAs($user)
    ->get('/dashboard')
    ->assertInertia(fn ($page) => $page
        ->component('Dashboard')
        ->has('stats')
        ->where('user.id', $user->id)
    );
```

---

## Exceptions

When testing non-Inertia responses (Blade views, API JSON, redirects) from the same controller, use the standard Laravel assertion methods appropriate for those response types.

---

## Consequences Of Violation

Maintenance risks: tests break on non-functional changes. Reliability risks: false positives from incorrect assertions. Testing coverage gaps: protocol-level issues missed.

---

## Rule: Isolate Shared Data Tests

Test shared data (auth, flash, app config) once in a dedicated `SharedDataTest` class instead of repeating assertions on every page test.

---

## Category

Testing

---

## Rule

Create one test class that validates all shared data keys and values. Individual page tests should only assert page-specific props, not re-assert auth user, flash messages, or app config.

---

## Reason

Shared data appears on every page so it is tested many times. Repeating shared data assertions on every page test creates brittle duplication — any change to shared data requires updating dozens of test files. A single test avoids this maintenance burden.

---

## Bad Example

```php
// Repeated in every page test
->assertInertia(fn ($page) => $page
    ->where('auth.user.id', $user->id)
    ->where('flash.success', 'Created')
    ->component('Dashboard')
);
```

---

## Good Example

```php
// tests/Feature/SharedDataTest.php
public function test_auth_user_present(): void
{
    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.id', $user->id)
        );
}
```

---

## Exceptions

If a specific page intentionally overrides or omits a shared data key, that page's test may assert the override behavior. Normal shared data inclusion still does not need re-assertion.

---

## Consequences Of Violation

Maintenance risks: changing shared data requires updating every page test. Testing bloat: unnecessary assertions slow the suite and reduce readability.

---

## Rule: Use etc() for Resilient Prop Assertions

Always call `etc()` on `AssertableInertia` assertions to allow future prop additions without breaking tests.

---

## Category

Testing

---

## Rule

Append `->etc()` at the end of every `assertInertia` fluent chain so tests pass even when new props are added to the response.

---

## Reason

Without `etc()`, every assertion chain is a strict match — adding a new prop to a controller breaks every existing test for that page. `etc()` makes tests resilient to additions while still verifying the specific props that matter.

---

## Bad Example

```php
->assertInertia(fn ($page) => $page
    ->component('Dashboard')
    ->where('user.id', $user->id)
    // No etc() — adding a 'stats' prop breaks this test
);
```

---

## Good Example

```php
->assertInertia(fn ($page) => $page
    ->component('Dashboard')
    ->where('user.id', $user->id)
    ->etc() // New props won't break this test
);
```

---

## Exceptions

When testing that a specific prop is the ONLY prop (e.g., a minimal response), omit `etc()` to enforce exactly the expected structure. This is rare.

---

## Consequences Of Violation

Maintenance risks: every prop addition breaks existing tests, discouraging refactoring. Testing overhead: developers spend time updating passing tests instead of writing new ones.

---

## Rule: Test Every Authorization State

Test guest redirects, authenticated user access, and admin-specific data for every protected Inertia route.

---

## Category

Testing

---

## Rule

For every Inertia route with authorization requirements, write tests covering: unauthenticated (redirect to login), authenticated without permission (403 or restricted props), and authorized access (correct component and props).

---

## Reason

Inertia controllers are the security boundary — the page component is just a view. If the controller does not check authorization, sensitive data is sent to the client. Tests are the only guarantee that authorization logic executes correctly for every route.

---

## Bad Example

```php
public function test_dashboard_shows_data(): void
{
    $this->actingAs($user)
        ->get('/admin/dashboard')
        ->assertInertia(fn ($page) => $page->component('AdminDashboard'));
    // Missing: guest redirect test, non-admin access test
}
```

---

## Good Example

```php
public function test_guest_redirected(): void
{
    $this->get('/admin/dashboard')->assertRedirect('/login');
}

public function test_user_sees_dashboard(): void
{
    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page->component('Dashboard'));
}

public function test_admin_sees_admin_dashboard(): void
{
    $this->actingAs($admin)
        ->get('/admin/dashboard')
        ->assertInertia(fn ($page) => $page->component('AdminDashboard'));
}
```

---

## Exceptions

Public routes (marketing pages, landing pages) that require no authorization can have a single "renders correctly" test without authorization variants.

---

## Consequences Of Violation

Security risks: unauthorized access to sensitive data undetected. Reliability risks: authorization regressions deployed to production. Testing gaps: routes with missing auth checks are invisible.

---

## Rule: Use missing() for Sensitive Data Assertions

Verify that sensitive data is explicitly absent from unauthorized responses using `$page->missing()`.

---

## Category

Testing

---

## Rule

When a prop should only be present for authorized users, assert its absence for unauthorized users with `$page->missing('sensitive_key')`.

---

## Reason

Testing the absence of sensitive data is as important as testing its presence for authorized users. `missing()` explicitly documents that a prop must not be leaked, providing a regression test against accidental data exposure.

---

## Bad Example

```php
// Only tests presence — no test verifying absence for unauthorized
$this->actingAs($admin)
    ->get('/admin/dashboard')
    ->assertInertia(fn ($page) => $page->has('admin_stats'));
```

---

## Good Example

```php
$this->actingAs($user)
    ->get('/dashboard')
    ->assertInertia(fn ($page) => $page->missing('admin_stats'));
```

---

## Exceptions

If a prop is always null rather than absent for unauthorized users (intentional design), assert `where('key', null)` instead of `missing()`.

---

## Consequences Of Violation

Security risks: sensitive data leaks undetected until production incident. Testing gaps: no regression coverage for data exposure.

---

## Rule: Mock Inertia Hooks for Client Tests

Mock `usePage`, `useForm`, and `router` from `@inertiajs/react` when writing client-side component tests.

---

## Category

Testing

---

## Rule

Use `vi.mock('@inertiajs/react', ...)` or equivalent Jest mocking to provide controlled Inertia hook responses. Spread the actual exports to avoid breaking unmocked hooks. Never mount a full Inertia application in unit tests.

---

## Reason

Inertia does not provide official client-side testing utilities. Mounting a full Inertia app in unit tests is slow, complex, and tests the framework rather than the component. Mocking hooks gives precise control over prop values and eliminates external dependencies.

---

## Bad Example

```tsx
// Trying to mount full app in unit test — slow and brittle
render(<App />); // requires full Inertia setup, router, etc.
```

---

## Good Example

```tsx
vi.mock('@inertiajs/react', async () => {
    const actual = await vi.importActual('@inertiajs/react');
    return {
        ...actual,
        usePage: () => ({ props: { user: { name: 'Alice' } } }),
    };
});

it('shows welcome message', () => {
    render(<Dashboard />);
    expect(screen.getByText('Welcome, Alice')).toBeInTheDocument();
});
```

---

## Exceptions

When testing Inertia-specific behavior (navigation, form submission to a real endpoint), use Playwright or Cypress E2E tests. Unit tests are for component rendering logic, not protocol integration.

---

## Consequences Of Violation

Testing gaps: client-side rendering bugs go to production. Flaky tests: full app test setup is fragile and slow.
