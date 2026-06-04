# Middleware Configuration in Bootstrap — Rules

## Always Use `withMiddleware()` for Laravel 11+ Middleware Configuration
---
## Category
Architecture
---
## Rule
Configure middleware exclusively through `->withMiddleware()` in `bootstrap/app.php` for Laravel 11+ projects.
---
## Reason
Laravel 11 no longer reads `$middleware`, `$middlewareGroups`, or `$routeMiddleware` from `App\Http\Kernel`. Using the old Kernel properties silently has no effect — middleware is never registered, causing runtime failures.
---
## Bad Example
```php
// Laravel 11 — silent failure: Kernel properties are not read
class Kernel extends HttpKernel
{
    protected $middleware = [\App\Http\Middleware\CustomGlobal::class];
}
```
---
## Good Example
```php
// Laravel 11+ — bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\App\Http\Middleware\CustomGlobal::class);
})
```
---
## Exceptions
Laravel 10 and earlier projects must use the Kernel property approach.
---
## Consequences Of Violation
Middleware silently never runs; production routes unprotected; hours debugging "middleware doesn't work" after upgrade.

---

## Use `replace()` Instead of `remove()` + `append()` for Swapping Middleware
---
## Category
Maintainability
---
## Rule
When replacing a default middleware with a custom implementation, use `replace()` instead of manually removing and re-adding.
---
## Reason
`replace()` handles group membership automatically — it finds the middleware in all groups and global stack and swaps it. `remove()` + `append()` requires knowing every group the target middleware belongs to, and missing a group leaves the old middleware running.
---
## Bad Example
```php
$middleware->remove(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);
$middleware->web(append: [\App\Http\Middleware\CustomCsrf::class]);
// Missing: CustomCsrf not added to global if VerifyCsrfToken was global
```
---
## Good Example
```php
$middleware->replace(
    \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
    \App\Http\Middleware\CustomCsrf::class
);
// Replaced in all groups automatically
```
---
## Exceptions
When completely removing middleware without replacement — use `remove()` with clear intent.
---
## Consequences Of Violation
Middleware runs in some groups but not others; inconsistent application behavior; security gaps.

---

## Keep `withMiddleware()` Focused Exclusively on Middleware Concerns
---
## Category
Code Organization
---
## Rule
Do not mix routing, exception handling, or other bootstrap logic inside the `withMiddleware()` callback.
---
## Reason
`bootstrap/app.php` configures multiple concerns through separate callbacks (`withRouting`, `withMiddleware`, `withExceptions`). Mixing concerns reduces readability and violates the principle of separate configuration scopes.
---
## Bad Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\App\Http\Middleware\TrustProxies::class);
    // Wrong: routing config inside middleware callback
    Route::middleware('web')->group(function () { /* ... */ });
})
```
---
## Good Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\App\Http\Middleware\TrustProxies::class);
})
->withRouting(
    web: __DIR__ . '/../routes/web.php',
    api: __DIR__ . '/../routes/api.php',
)
```
---
## Exceptions
No common exceptions — keep configuration callbacks separated.
---
## Consequences Of Violation
Harder to locate configuration; unexpected side effects; reduced clarity for future developers.

---

## Re-Cache Configuration After Any `bootstrap/app.php` Changes
---
## Category
Performance
---
## Rule
Run `php artisan optimize` after every modification to middleware configuration in `bootstrap/app.php`.
---
## Reason
Middleware configuration is cached when `php artisan optimize` runs. Without re-caching, stale configuration persists in production — new global middleware never runs, removed middleware continues to execute.
---
## Bad Example
```php
// Step 1: Add new middleware to bootstrap/app.php
$middleware->append(\App\Http\Middleware\ForceHttps::class);
// Step 2: Deploy without re-caching
// Step 3: ForceHttps never runs — traffic not redirected to HTTPS
```
---
## Good Example
```php
// After any bootstrap/app.php change:
// php artisan optimize
```
---
## Exceptions
Development environments where configuration caching is disabled for fast iteration.
---
## Consequences Of Violation
Middleware changes not reflected in production; security middleware not running; deployment rollbacks needed to fix stale config.

---

## Use Group-Specific Methods Instead of Global `append()`/`prepend()` for Targeted Changes
---
## Category
Maintainability
---
## Rule
Use `$middleware->web(append: [...])` or `$middleware->api(append: [...])` for group-specific middleware, not global `append()`.
---
## Reason
Global `append()` adds middleware to the global stack, affecting every route. Group-specific methods target only the intended route group, avoiding unnecessary middleware on unrelated routes.
---
## Bad Example
```php
// Adds Localize to ALL routes — API routes also get localization
$middleware->append(\App\Http\Middleware\Localize::class);
```
---
## Good Example
```php
// Localize only applies to web routes
$middleware->web(append: [
    \App\Http\Middleware\Localize::class,
]);
```
---
## Exceptions
Middleware that must run on every request (infrastructure, security headers).
---
## Consequences Of Violation
Unnecessary middleware on unrelated routes; increased TTFB; unexpected side effects.

---

## Always Import the `Middleware` Class with a `use` Statement
---
## Category
Reliability
---
## Rule
Include `use Illuminate\Foundation\Configuration\Middleware;` at the top of `bootstrap/app.php` when using `->withMiddleware()`.
---
## Reason
The `Middleware` type hint in the closure requires the correct import. Forgetting it causes a runtime "class not found" error that prevents the entire application from booting.
---
## Bad Example
```php
// Missing use statement
->withMiddleware(function (Middleware $middleware) { // Error: Middleware not found
    $middleware->append(...);
})
```
---
## Good Example
```php
<?php
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(...);
    })
    ->create();
```
---
## Exceptions
No common exceptions — the import is mandatory.
---
## Consequences Of Violation
Application fails to boot with fatal error; production outage from a missing import statement.

---

## Use `use()` to Apply Default Groups Instead of Defining Them Manually
---
## Category
Code Organization
---
## Rule
Call `$middleware->use()` to apply the default `web` and `api` group definitions instead of recreating them manually.
---
## Reason
Manual group definitions duplicate framework defaults, drift when defaults change in upgrades, and introduce unnecessary boilerplate. `use()` applies the current version's defaults, keeping your configuration upgrade-safe.
---
## Bad Example
```php
// Manual recreation of default groups — drifts over time
$middleware->group('web', [ /* full copy of default web middleware */ ]);
$middleware->group('api', [ /* full copy of default api middleware */ ]);
```
---
## Good Example
```php
// Apply defaults, then customize
$middleware->use([\App\Http\Middleware\ForceJsonResponse::class]);
// or
$middleware->use(); // Apply all defaults
$middleware->web(append: [\App\Http\Middleware\Localize::class]);
```
---
## Exceptions
When explicitly opting out of all default middleware for a fully custom setup.
---
## Consequences Of Violation
Outdated middleware definitions after upgrade; missing security middleware; unnecessary maintenance burden.
