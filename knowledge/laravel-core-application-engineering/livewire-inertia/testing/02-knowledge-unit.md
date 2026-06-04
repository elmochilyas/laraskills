# Inertia Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Inertia testing validates that controllers return the correct Inertia responses with the expected props, that shared data is injected properly, and that the client-side page components render correctly with given props. The testing strategy splits into server-side (PHP tests using Inertia testing helpers) and client-side (Vitest/Jest for component rendering).

The engineering value is confidence that the server sends the correct data to the correct component, and the client renders it correctly — catching prop shape mismatches, missing data, and authorization failures before they reach production.

---

## Core Concepts

### Server-Side Testing

Laravel's HTTP testing utilities (`$this->get()`, `$this->actingAs()`) combined with Inertia's assertion helpers:

```php
use Inertia\Testing\AssertableInertia;

public function test_dashboard_shows_user_stats()
{
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertInertia(fn (AssertableInertia $page) => [
        $page->component('Dashboard', true),
        $page->has('stats'),
        $page->has('recentActivity.0'),
        $page->where('user.name', $user->name),
    ]);
}
```

### Client-Side Testing

Component tests using Vitest + React Testing Library / Vue Test Utils:

```tsx
import { render } from '@testing-library/react';
import Dashboard from './Dashboard';

// Mock Inertia usePage for the test
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

it('renders stats', () => {
    const { getByText } = render(<Dashboard />);
    expect(getByText('100')).toBeInTheDocument();
    expect(getByText('$50,000')).toBeInTheDocument();
});
```

---

## Mental Models

### The Contract Test

Think of Inertia tests as contract tests for the server-client boundary. The server test asserts "the server sends component X with props Y." The client test asserts "given props Y, the component renders correctly." Both sides of the contract are tested independently.

### The Fake Inertia

When testing server-side, Inertia's response is intercepted by `AssertableInertia`, which captures the component name and props without actually rendering anything. It's a fake that records what would be sent to the client and lets you assert on it.

---

## Internal Mechanics

### AssertableInertia

`$response->assertInertia()` calls `AssertableInertia::assert()` which:

1. Verifies the response is an Inertia response (has `X-Inertia` header or appropriate JSON structure)
2. Parses the response JSON (component + props)
3. Passes the parsed data to the assertion callback
4. The callback receives an `AssertableInertia` instance with chainable assertion methods

### Available Assertions

```php
$page->component('Dashboard', true);                    // Exact component match
$page->component('Dashboard');                          // Component name only
$page->url('/dashboard');                               // URL match
$page->has('users');                                    // Prop exists
$page->has('users.data', 15);                           // Array count
$page->has('users', fn ($users) => $users->each(...));  // Nested assertion
$page->has('roles', 3);                                 // Count
$page->missing('secret_key');                           // Prop absent
$page->where('user.name', 'Alice');                     // Exact value
$page->whereAll(['key' => 'value']);                    // Multiple exact values
$page->whereType('user.id', 'integer');                 // Type check
$page->dd();                                            // Debug dump
$page->dump();                                          // Debug dump (less verbose)
$page->intercept();                                     // Prevent response from being sent
$page->etc();                                           // Allow extra props
```

### Version Assertion

```php
$response->assertInertia(function (AssertableInertia $page) {
    $page->component('Dashboard')
         ->has('users')
         ->has('version'); // Inertia version key is present
});
```

---

## Patterns

### Full Feature Test

```php
class UserDashboardTest extends TestCase
{
    public function test_guest_is_redirected()
    {
        $this->get('/dashboard')
             ->assertRedirect('/login');
    }

    public function test_user_sees_own_dashboard()
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

    public function test_admin_sees_all_users()
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(10)->create();

        $this->actingAs($admin)
             ->get('/dashboard')
             ->assertInertia(fn ($page) => $page
                 ->component('AdminDashboard')
                 ->has('allUsers', 11) // admin + 10 users
             );
    }
}
```

### Shared Data Test

```php
public function test_shared_auth_data_is_present()
{
    $user = User::factory()->create();

    $this->actingAs($user)
         ->get('/any-page')
         ->assertInertia(fn ($page) => $page
             ->where('auth.user.id', $user->id)
             ->where('auth.user.email', $user->email)
         );
}
```

### Client Component Test

```tsx
// Dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

const defaultProps = {
    stats: { users: 50, revenue: 100000 },
    user: { name: 'Bob', role: 'editor' },
};

function renderWithProps(props = {}) {
    return render(<Dashboard {...defaultProps} {...props} />);
}

it('shows welcome message', () => {
    renderWithProps();
    expect(screen.getByText('Welcome, Bob')).toBeInTheDocument();
});

it('displays revenue', () => {
    renderWithProps();
    expect(screen.getByText('$100,000')).toBeInTheDocument();
});

it('hides admin panel for editors', () => {
    renderWithProps();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
});
```

### Form Submission Test

```php
public function test_form_submission_redirects()
{
    $this->actingAs(User::factory()->create())
         ->post('/posts', [
             'title' => 'New Post',
             'body' => 'Content',
         ])
         ->assertRedirect('/posts')
         ->assertSessionHas('success', 'Post created.');
}
```

```tsx
it('submits form data', async () => {
    const mockPost = vi.fn();
    vi.mock('@inertiajs/react', () => ({
        useForm: (initial: any) => ({
            data: initial,
            setData: vi.fn(),
            post: mockPost,
            processing: false,
            errors: {},
        }),
    }));

    render(<CreatePost />);
    fireEvent.click(screen.getByText('Submit'));
    expect(mockPost).toHaveBeenCalledWith('/posts', expect.any(Object));
});
```

---

## Architectural Decisions

### Server Test vs Client Test Scope

| Concern | Server Test (PHP) | Client Test (JS) |
|---|---|---|
| What it validates | Correct component + props | Correct rendering of props |
| What it misses | Visual output | Data shape |
| Speed | Fast (no JS) | Fast (no browser) |
| Maintenance | PHP-side changes | TS-side changes |
| Coverage | Backend logic + authorization | UI logic + states |

Both are needed. Server tests confirm the API contract. Client tests confirm the rendering contract.

### assertInertia vs Manual JSON Assertions

| Concern | `assertInertia` | Manual `assertJson` |
|---|---|---|
| Readability | High (fluent API) | Low (raw structure) |
| Maintenance | Tolerant to non-prop changes | Brittle (exact match) |
| Debugging | `$page->dd()` helper | `dd($response->json())` |

Prefer `assertInertia` for all Inertia-specific tests. It's the canonical testing API with the best DX.

---

## Tradeoffs

| Concern | Inertia Testing | Livewire Testing |
|---|---|---|
| Server-side assertions | props + component | component state + rendered HTML |
| Client-side assertions | Component rendering | Not needed (Livewire is server-rendered) |
| End-to-end testing | Recommended for critical paths | Less critical (server tests cover more) |
| Test speed | Fast (PHPUnit + JS Vitest) | Fast (PHPUnit only) |

---

## Performance Considerations

Inertia tests are fast on both sides:
- PHP tests: ~50-200ms per test (no rendering)
- JS tests: ~100-300ms per test (no browser, jsdom)

The bottleneck is typically database setup (RefreshDatabase). Use model factories and partial DB resets to keep test suites fast.

---

## Production Considerations

- Test every Inertia-rendered route for the correct component and critical props
- Test shared data once (not on every page test) — a single `SharedDataTest` validates global props
- Test authorization: guest gets redirect, user gets page, admin gets admin-specific props
- Test error states: 404 pages, 403 responses, validation errors
- Mock `usePage` on the client side — don't try to mount a full Inertia app in tests
- Use `etc()` in assertions to allow new props without breaking existing tests
- Use `missing()` to verify sensitive data is NOT sent to unauthorized users
- Run server and client tests in CI — they're independent but both must pass

---

## Common Mistakes

### Testing Inertia Without `assertInertia`

```php
// Bad — fragile, breaks on non-essential changes
$this->get('/dashboard')
     ->assertJson(['component' => 'Dashboard']);

// Good — using the assertion helper
$this->get('/dashboard')
     ->assertInertia(fn ($page) => $page->component('Dashboard'));
```

### Not Testing Shared Data Independently

Testing shared data (auth, flash) on every page test creates brittle, duplicated assertions. Test shared data once in a dedicated test.

### Mocking usePage Incorrectly

```tsx
// Bad — too broad mock
vi.mock('@inertiajs/react');
// useForm, router, Link all become undefined

// Good — mock only what's needed
vi.mock('@inertiajs/react', async () => {
    const actual = await vi.importActual('@inertiajs/react');
    return { ...actual, usePage: () => ({ props: mockProps }) };
});
```

### Forgetting to Test Authorization

```php
// Missing test: guest accessing admin page
public function test_guest_cannot_access_admin()
{
    $this->get('/admin')
         ->assertRedirect('/login');
}
```

---

## Failure Modes

### Stale Client Tests

Server changes a prop name but client tests still mock the old name. Both test suites pass in isolation. The bug surfaces only when the full app runs. Mitigate with end-to-end tests (Playwright, Cypress) that test the full stack.

### Shared Data Override

A controller overrides a shared data key (e.g., `auth`). The shared data test passes (it doesn't hit that route), but the page test only checks page-specific props. The override goes unnoticed. Assert shared data props in at least one page test per route group.

---

## Ecosystem Usage

Inertia testing integrates with PHPUnit and Pest for server-side tests, and Vitest, Jest, or Playwright for client-side tests. `AssertableInertia` is the server-side testing utility from inertia-laravel. Client-side testing uses standard React Testing Library, Vue Test Utils, or Svelte Testing Library patterns with mocked Inertia hooks.

## Related Knowledge Units

- **Page Components** (this workspace) — what server tests validate
- **Server Props** (this workspace) — what props tests assert on
- **Shared Data** (this workspace) — testing global props
- **Form Handling** (this workspace) — testing form submissions
- **Partial Reloads** (this workspace) — testing partial response
- **Livewire Testing** (this workspace) — analogous testing approach in Livewire
- **Feature-based Structure** (this workspace) — organizing tests by feature

---

## Research Notes

- `AssertableInertia` is the central server-side testing class
- `assertInertia()` accepts a closure receiving `AssertableInertia`
- Component assertion: `$page->component('Name', true)` — second param enforces exact match
- Prop assertions: `has()`, `where()`, `whereAll()`, `whereType()`, `missing()`, `etc()`
- Client-side testing uses standard Vitest/Jest + adapter-specific testing library
- Inertia does NOT provide client-side testing utilities — standard component testing patterns apply
- Mock `usePage`, `useForm`, and `router` for client component tests
- Server tests do NOT verify HTML output — they verify the data contract
