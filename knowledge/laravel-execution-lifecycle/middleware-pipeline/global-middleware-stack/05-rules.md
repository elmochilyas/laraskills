# Global Middleware Stack — Rules

## Add Middleware at the Most Specific Level Possible
---
## Category
Architecture
---
## Rule
Apply middleware at the most specific granularity: route > group > global. Add to global only when every single request needs it.
---
## Reason
Global middleware affects 100% of traffic, including health checks, webhooks, and API routes. Overly broad assignment increases latency, resource usage, and the blast radius of bugs.
---
## Bad Example
```php
// Adding DB-dependent middleware globally — health check and API routes pay the cost
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\App\Http\Middleware\CheckDatabaseStatus::class);
})
```
---
## Good Example
```php
// Route-specific middleware — only applies where needed
Route::get('/admin', [AdminController::class, 'index'])
    ->middleware(\App\Http\Middleware\CheckDatabaseStatus::class);
```
---
## Exceptions
True infrastructure middleware: maintenance mode, trusted proxies, CORS, request size validation — these must run on every request.
---
## Consequences Of Violation
Performance regression on unaffected routes; health check failures when global middleware depends on down services; unnecessarily coupled architecture.

---

## Audit Default Global Middleware Before Production
---
## Category
Performance
---
## Rule
Review and remove unnecessary default global middleware for your application type before deployment.
---
## Reason
The default global stack includes session middleware (file/Redis I/O on every request). API-only apps should remove session, cookie, and CSRF middleware from global — these are unnecessary overhead for stateless traffic.
---
## Bad Example
```php
// API-only app with default global stack — session I/O on every API call
// Default: StartSession, EncryptCookies, VerifyCsrfToken all run globally
```
---
## Good Example
```php
// API-only app: strip session and cookie middleware from global
->withMiddleware(function (Middleware $middleware) {
    $middleware->remove(\Illuminate\Session\Middleware\StartSession::class);
    $middleware->remove(\App\Http\Middleware\EncryptCookies::class);
    $middleware->remove(\App\Http\Middleware\VerifyCsrfToken::class);
})
```
---
## Exceptions
Traditional web applications that use session-based auth and CSRF protection need the full default stack.
---
## Consequences Of Violation
Unnecessary I/O on every request; increased TTFB; wasted server resources; session storage pressure.

---

## Order Global Middleware by Infrastructure Dependency
---
## Category
Reliability
---
## Rule
Place infrastructure middleware (trust proxies, maintenance mode) first in the global stack, before any middleware that depends on request metadata.
---
## Reason
Trust proxies must run before any middleware that inspects the request IP; maintenance mode must block before any processing occurs. The default order satisfies these dependency chains.
---
## Bad Example
```php
protected $middleware = [
    \App\Http\Middleware\StartSession::class,   // Session before trusted proxy
    \Illuminate\Http\Middleware\TrustProxies::class, // IP still proxy IP
];
```
---
## Good Example
```php
protected $middleware = [
    \Illuminate\Http\Middleware\TrustProxies::class,    // First: trust proxy
    \Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance::class, // Second: block if down
    \Illuminate\Session\Middleware\StartSession::class,  // After: correct IP available
];
```
---
## Exceptions
When custom global middleware has no dependency on request metadata or infrastructure context.
---
## Consequences Of Violation
Incorrect IP resolution in all downstream code; maintenance mode leak; session data associated with wrong client.

---

## Verify Global Middleware Composition with `route:list -v`
---
## Category
Testing
---
## Rule
Run `php artisan route:list -v` to verify the full resolved middleware stack, including inherited global middleware.
---
## Reason
Middleware inheritance through global + group + route levels is invisible in route files. Developers often do not realize which global middleware runs on their routes — `route:list -v` reveals the complete stack.
---
## Bad Example
```php
// Developer assumes only 'auth' middleware runs on /api/user
// Without verification, global session middleware also runs because it's in global stack
```
---
## Good Example
```php
// Run: php artisan route:list -v
// See full stack including global, group, and route middleware
// Make informed decisions about removal or customization
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unintended middleware on routes; duplicate middleware; security assumptions invalidated by invisible middleware.

---

## Do Not Add Heavy or Service-Dependent Middleware to the Global Stack
---
## Category
Reliability
---
## Rule
Avoid adding middleware that depends on external services (database, cache, API) to the global stack.
---
## Reason
Global middleware runs on every request, including health check and monitoring endpoints. A database-down scenario causes health checks to fail, creating a monitoring blind spot and cascading failures.
---
## Bad Example
```php
// Global middleware that queries the database — health check fails when DB is down
$middleware->append(\App\Http\Middleware\ValidateSubscriptionStatus::class);
```
---
## Good Example
```php
// Route-specific or group-specific middleware
Route::middleware(['auth', 'subscription'])->group(function () {
    Route::get('/premium', [PremiumController::class, 'index']);
});
```
---
## Exceptions
Infrastructure middleware that itself checks service health (e.g., maintenance mode detection) is acceptable.
---
## Consequences Of Violation
Health check failures during service degradation; cascading failures; entire application becomes inaccessible instead of single feature.

---

## Never Assume Global Middleware Can Be Bypassed by Route Configuration
---
## Category
Security
---
## Rule
Do not rely on route-level configuration to bypass global middleware — global middleware always executes regardless of route assignment.
---
## Reason
Global middleware is non-bypassable by design. Attempting to bypass it via `withoutMiddleware()` or route groups fails silently — the middleware still runs. Only explicit removal from the global stack removes it.
---
## Bad Example
```php
// Wrong: assumes CSRF can be bypassed per route while it's in global
Route::post('/webhook', [WebhookController::class, 'handle']);
// CSRF still runs because VerifyCsrfToken is in global stack, not web group
```
---
## Good Example
```php
// Correct: remove or exclude explicitly
Route::post('/webhook', [WebhookController::class, 'handle'])
    ->withoutMiddleware(\App\Http\Middleware\VerifyCsrfToken::class);
```
---
## Exceptions
`withoutMiddleware()` works on group and route middleware but not on global if the middleware is truly in the global array. Understand which source the middleware comes from.
---
## Consequences Of Violation
CSRF tokens required on webhook routes; 419 errors on legitimate webhooks; session overhead on stateless endpoints.

---

## Keep the Global Stack as the Innermost Infrastructure Wrapper
---
## Category
Architecture
---
## Rule
Reserve the global stack exclusively for infrastructure concerns that must apply to every request without exception.
---
## Reason
The global stack is the outermost layer of the onion — it wraps all group and route middleware. Mixing application-level middleware into global makes it impossible to opt out per route and conflates infrastructure with business logic.
---
## Bad Example
```php
// Application middleware in global stack — affects every route
$middleware->append(\App\Http\Middleware\TrackAnalytics::class);
$middleware->append(\App\Http\Middleware\CheckFeatureFlag::class);
```
---
## Good Example
```php
// Infrastructure only in global
$middleware->append(\Illuminate\Http\Middleware\TrustProxies::class);
$middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
// Application middleware in groups or routes
```
---
## Exceptions
Middleware that legitimately must run on every request (e.g., mandatory security headers, global request logging for compliance).
---
## Consequences Of Violation
Inability to exclude middleware from specific routes; polluted global stack; difficult maintenance and debugging.
