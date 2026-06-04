## Rule: Keep Shared Data Minimal

Include only data needed on EVERY page in shared data. Limit to auth, flash messages, and application configuration.

---

## Category

Performance

---

## Rule

Audit the `share()` method in `HandleInertiaRequests` regularly. Only keep props that are consumed by the layout or a majority (>80%) of pages. Remove props used on a single page or a small subset of pages — pass those via the controller.

---

## Reason

Shared data is serialized and sent in EVERY Inertia response, including partial reloads. Each additional shared prop increases every page's payload by its serialized size times the number of requests. Feature-specific data bloats all pages unnecessarily. A typical minimal set is auth user, flash messages, and app config.

---

## Bad Example

```php
public function share(Request $request): array
{
    return [
        'auth' => ['user' => ...],
        'flash' => [...],
        'sidebarLinks' => Link::all(),      // Used only on dashboard
        'notifications' => Notification::unread(), // Used only on one page
        'recentOrders' => Order::recent(),   // Used only on admin
        'weatherWidget' => Weather::current(), // Niche feature
    ];
}
```

---

## Good Example

```php
public function share(Request $request): array
{
    return [
        'auth' => ['user' => $request->user()?->only('id', 'name', 'email')],
        'flash' => [
            'success' => $request->session()->get('success'),
            'error' => $request->session()->get('error'),
        ],
        'app' => ['name' => config('app.name'), 'locale' => app()->getLocale()],
    ];
}
```

---

## Exceptions

If the application layout itself (e.g., a global sidebar used on every page) requires specific data, that data is legitimate shared data. The key is that the layout actually uses it on every page.

---

## Consequences Of Violation

Performance risks: increased payload on every response. Scalability risks: serialization time grows linearly with shared props. Maintenance risks: shared data becomes dumping ground.

---

## Rule: Use Closures for Request-Dependant Data

Pass request-dependent shared data as closures. Never pass direct values that are evaluated at boot time.

---

## Category

Architecture

---

## Rule

Define all shared data values that depend on the authenticated user, session, or request as closures: `'auth' => fn(Request $r) => [...]`. Direct values are only acceptable for truly static configuration that never changes per request.

---

## Reason

If a shared data value is evaluated at service provider boot time, `Auth::user()` returns `null` because the session is not yet available. The value is captured once and never re-evaluated, so every subsequent request receives the same (potentially null) value. Closures are evaluated lazily on each request, giving access to the full request context.

---

## Bad Example

```php
// Service provider boot — Auth is null at this point
Inertia::share('auth', ['user' => Auth::user()]); // Always null
```

---

## Good Example

```php
// HandleInertiaRequests middleware — closure evaluated per request
public function share(Request $request): array
{
    return [
        'auth' => [
            'user' => $request->user()?->only('id', 'name', 'email'),
        ],
    ];
}
```

---

## Exceptions

Truly static values like `config('app.name')` or `'version' => '1.0'` that never change per request may use direct values.

---

## Consequences Of Violation

Reliability risks: shared data is null or stale for all requests. Debugging difficulty: hard to identify why auth data is always null.

---

## Rule: Never Expose Sensitive Data in Share

Limit exposed user data to only what the UI needs. Always use `->only()` or `->makeHidden()`.

---

## Category

Security

---

## Rule

When sharing the authenticated user, explicitly select only the fields needed by the frontend using `$request->user()?->only('id', 'name', 'email', 'avatar')`. Never pass the entire Eloquent model or `Auth::user()` without field restriction.

---

## Reason

`Auth::user()` without transformation exposes ALL model attributes to the client, including `password`, `remember_token`, `two_factor_secret`, internal IDs, timestamps, and any other fields on the users table. This data is visible in the HTML source, the network tab, and the JavaScript console. Even if the UI does not render these fields, they are accessible to anyone inspecting the response.

---

## Bad Example

```php
// Exposes password hash, remember_token, timestamps, etc.
'auth' => ['user' => Auth::user()],
```

---

## Good Example

```php
// Only exposes what the UI needs
'auth' => [
    'user' => $request->user()?->only('id', 'name', 'email', 'avatar'),
],
```

---

## Exceptions

If the application has a specific requirement for a protected field (e.g., showing `last_login_at` in the UI), explicitly add that field to `->only()` rather than passing the entire model.

---

## Consequences Of Violation

Security risks: sensitive model attributes exposed in client-visible response. Compliance risks: PII or secrets exposed in violation of data protection requirements.

---

## Rule: Use Module Augmentation for Shared Data Types

Type all shared data keys via TypeScript module augmentation so every component receives typed access.

---

## Category

Maintainability

---

## Rule

Create a `resources/js/types/inertia.d.ts` file that extends `@inertiajs/core`'s `PageProps` with interfaces matching every key returned by the `HandleInertiaRequests` `share()` method.

---

## Reason

Without augmentation, `usePage().props.auth` is typed as `any` or the default Inertia type. Developers must remember the shape of shared data and manually type it in every component, leading to errors and drift. Augmentation provides automatic, project-wide typing for all shared props.

---

## Bad Example

```typescript
// No augmentation — props.auth is any
const { props } = usePage();
console.log(props.auth.user.name); // No type checking
```

---

## Good Example

```typescript
declare module '@inertiajs/core' {
    interface PageProps {
        auth: { user: { id: number; name: string; email: string; avatar: string } | null };
        flash?: { success?: string; error?: string };
        app: { name: string; locale: string };
    }
}
// props.auth.user.name is fully typed
```

---

## Exceptions

If the project uses plain JavaScript (no TypeScript), module augmentation does not apply. The security and performance rules still apply.

---

## Consequences Of Violation

Developer experience: no autocompletion for shared props, runtime errors from misspelled keys. Maintenance risks: shared data shape changes not caught by the compiler.

---

## Rule: Test Shared Data Independently

Write exactly one test class that validates all shared data keys. Do not duplicate these assertions in individual page tests.

---

## Category

Testing

---

## Rule

Create a `SharedDataTest` that hits any authenticated route and asserts the presence and shape of all shared data keys. Individual page tests should only assert page-specific props.

---

## Reason

Shared data is present on every Inertia response. Repeating the same auth/flash/app assertions on every page test creates dozens of duplicate assertions that must be updated whenever shared data changes. A single shared data test provides the same coverage with a fraction of the maintenance burden.

---

## Bad Example

```php
// Repeated in 30 page tests
->assertInertia(fn ($page) => $page
    ->where('auth.user.id', $user->id)
    ->where('app.name', config('app.name'))
    ->component('Dashboard')
);
```

---

## Good Example

```php
// tests/Feature/SharedDataTest.php
public function test_shared_auth_data(): void
{
    $user = User::factory()->create();
    $this->actingAs($user)
        ->get('/dashboard')
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.id', $user->id)
        );
}
```

---

## Exceptions

If a specific page intentionally overrides a shared data key (same key in page-specific props that replaces the shared value), that page's test may assert the override behavior.

---

## Consequences Of Violation

Maintenance risks: changing shared data breaks many tests. Test bloat: duplicated assertions slow the test suite.
