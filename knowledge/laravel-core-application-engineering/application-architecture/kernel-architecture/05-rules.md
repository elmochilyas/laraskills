# Kernel Architecture — Rules

## Never Put Business Logic in Kernel Classes

Restrict kernel classes to request lifecycle orchestration. Business logic, database queries, and service configuration belong in controllers, services, or service providers.

---

## Category

Architecture

---

## Rule

The HTTP kernel and Console kernel must only orchestrate the request lifecycle — middleware registration, bootstrapper configuration, and schedule definition. Do not add business logic, database queries, complex commands, or service container configuration to kernel classes.

---

## Reason

The kernel's responsibility is infrastructure orchestration. Business logic in the kernel cannot be reused, tested independently, or bypassed for specific routes. It runs on every request and couples application behavior to the kernel's execution order.

---

## Bad Example

```php
class Kernel extends HttpKernel
{
    public function handle($request): Response
    {
        if (Cache::has('maintenance')) {
            // Business logic in kernel
        }
        return parent::handle($request);
    }
}
```

---

## Good Example

```php
class Kernel extends HttpKernel
{
    protected $middleware = [
        CheckMaintenance::class, // middleware class handles this
    ];
}
```

---

## Exceptions

Schedule definition in `Console\Kernel::schedule()` is acceptable as it is the kernel's designated responsibility.

---

## Consequences Of Violation

Untestable orchestration logic, non-reusable business code, kernel becomes unmanageable fat class.

---

## Enable All Caches in Production

Run `php artisan config:cache`, `php artisan route:cache`, and `php artisan event:cache` as mandatory deployment steps.

---

## Category

Performance

---

## Rule

Every production deployment must include config caching, route caching, and event caching. Without these, the kernel re-registers all routes and re-processes all configuration on every request.

---

## Reason

Route caching eliminates route registration from the kernel's bootstrap phase. Config caching eliminates multi-file config parsing. Event caching eliminates event registration overhead. Combined, these caches reduce kernel bootstrap time by 50-80%.

---

## Bad Example

```bash
git pull origin main
composer install --no-dev
php artisan migrate --force
# No caching — routes registered on every request
```

---

## Good Example

```bash
git pull origin main
php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan migrate --force
```

---

## Exceptions

Development environments must not cache routes or config, as changes would not take effect.

---

## Consequences Of Violation

10-30ms additional bootstrap time per request, routes re-registered on every request, configuration re-parsed on every request.

---

## Keep Middleware Priority Explicit

Always define explicit middleware priority rather than relying on registration order.

---

## Category

Reliability

---

## Rule

In Laravel 10-, define `$middlewarePriority` explicitly. In Laravel 11+, use the `->priority()` method on the middleware fluent API. Never rely on the order middleware appears in registration arrays for execution ordering.

---

## Reason

Middleware from different groups (global, web, api) have an implicit ordering defined by framework defaults. When custom middleware needs to run between framework middleware, explicit priority ensures deterministic ordering regardless of Laravel version changes.

---

## Bad Example

```php
// Laravel 10-
protected $middlewarePriority = [];
// Empty — relies on framework default order which changes between versions
```

---

## Good Example

```php
// Laravel 11+
->withMiddleware(function (Middleware $middleware) {
    $middleware->priority([
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \App\Http\Middleware\CustomAuth::class,
    ]);
})
```

---

## Exceptions

Applications with only framework middleware and no custom interleaving middleware can rely on framework defaults.

---

## Consequences Of Violation

Middleware runs in unexpected order after version upgrades, authentication runs before session initialization, security checks bypassed.

---

## Never Duplicate Middleware Across Registration Points

A middleware class must appear in exactly one registration location: global, group, or route-specific.

---

## Category

Reliability

---

## Rule

Ensure each middleware class is registered in exactly one place: either `$middleware` (global), a `$middlewareGroups` entry, or a route-specific alias. The same middleware must not appear in multiple registration arrays.

---

## Reason

Middleware registered in multiple locations runs multiple times on the same request. This doubles execution time for that middleware and can cause side effects (duplicate logging, double session start, double authentication checks).

---

## Bad Example

```php
protected $middleware = [
    EncryptCookies::class,      // global
];

protected $middlewareGroups = [
    'web' => [
        EncryptCookies::class,  // also in web group — runs twice
    ],
];
```

---

## Good Example

```php
protected $middlewareGroups = [
    'web' => [
        EncryptCookies::class,  // only in web group
    ],
];
```

---

## Exceptions

No common exceptions. Each middleware appears in exactly one registration point.

---

## Consequences Of Violation

Middleware runs twice per request, doubled execution time, duplicate side effects, unexpected behavior.

---

## Validate Middleware Order After Framework Upgrades

After every major Laravel version upgrade, verify that custom middleware runs at the correct position relative to framework middleware.

---

## Category

Maintainability

---

## Rule

After upgrading Laravel between major versions, review and test middleware priority. Framework middleware may be reordered, renamed, or split between versions. Verify that custom middleware still executes in the expected order.

---

## Reason

Laravel's default middleware priority order changes between major versions. Custom middleware that depends on running before or after specific framework middleware may silently change position, causing security or functional regressions.

---

## Bad Example

```php
// Laravel 9 — middleware A ran after session
// Laravel 10 — session middleware was reordered
// Custom middleware still assumes old order
```

---

## Good Example

```php
// After upgrade: review php artisan middleware:list
// Verify custom middleware position relative to framework middleware
// Update $middlewarePriority if needed
```

---

## Exceptions

Applications with no custom middleware or custom middleware that does not interleave with framework middleware are exempt.

---

## Consequences Of Violation

Authentication bypass (auth runs before session is initialized), CSRF token validation failures, unexpected 500 errors.

---

## Remove Unused Framework Middleware

Remove framework middleware that your application does not need from the global middleware stack.

---

## Category

Performance

---

## Rule

Inspect the global middleware stack and remove middleware that is not required by the application. For API-only applications, remove web-specific middleware (encrypt cookies, start session, CSRF protection).

---

## Reason

Every middleware in the global stack runs on every request. Unused middleware adds unnecessary processing time and can cause errors in unexpected contexts (e.g., session middleware crashing on stateless API requests).

---

## Bad Example

```php
// Laravel 10- Kernel for API-only app
protected $middleware = [
    EncryptCookies::class,       // not needed for API
    StartSession::class,         // not needed for stateless API
];
```

---

## Good Example

```php
// Laravel 11+
->withMiddleware(function (Middleware $middleware) {
    $middleware->remove([
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Session\Middleware\StartSession::class,
    ]);
})
```

---

## Exceptions

Applications that serve both web and API routes must keep all framework middleware.

---

## Consequences Of Violation

Unnecessary per-request overhead (0.1-0.5ms per unused middleware), potential errors from middleware that assumes web context in API endpoints.

---

## Never Use withoutMiddleware() in Production

The `withoutMiddleware()` method must never be used in production code paths.

---

## Category

Security

---

## Rule

Do not use `withoutMiddleware()` on any route or route group in production code. This method removes security middleware (auth, throttle, CSRF) from specified routes.

---

## Reason

`withoutMiddleware()` removes all middleware from the specified routes, including authentication, authorization, rate limiting, and encryption. This creates an unprotected entry point that bypasses the application's security perimeter.

---

## Bad Example

```php
Route::post('/webhook', [WebhookController::class, 'handle'])
    ->withoutMiddleware([VerifyCsrfToken::class]);
// No CSRF — acceptable for webhooks, but consider more specific exclusion
```

---

## Good Example

```php
Route::post('/webhook', [WebhookController::class, 'handle'])
    ->skipMiddleware([VerifyCsrfToken::class]);
// Or: Add webhook URL to $except array in VerifyCsrfToken middleware
```

---

## Exceptions

Testing environments may use `withoutMiddleware()` to test controller logic in isolation.

---

## Consequences Of Violation

Routes exposed without authentication, rate limiting bypassed, CSRF protection removed, potential for abuse and data exfiltration.
