# Octane Boot Timing Rules

## Rule 1: Use scoped() for All Per-Request State
---
## Category
Reliability
---
## Rule
Always use `$app->scoped()` instead of `$app->singleton()` for services that hold per-request state (auth, session, tenant, locale).
---
## Reason
Under Octane, singletons persist across requests in the same worker. A singleton that holds user-specific data leaks that data to the next request handled by the same worker. `scoped()` bindings are flushed between requests, providing fresh instances per request.
---
## Bad Example
```php
$this->app->singleton(CurrentUser::class, function () {
    return new CurrentUser(auth()->user()); // Auth state persists across requests
});
```
---
## Good Example
```php
$this->app->scoped(CurrentUser::class, function () {
    return new CurrentUser(auth()->user()); // Fresh instance per request
});
```
---
## Exceptions
Truly stateless services that hold no mutable data (e.g., value objects, calculators, validators).
---
## Consequences Of Violation
User A's data served to user B. Session state leaks between requests. Authentication tokens from one request reused in another. Critical security breach.
---

## Rule 2: Audit All Singletons for Mutable State
---
## Category
Security
---
## Rule
Audit every `$app->singleton()` and `facade` root for mutable state that could accumulate or leak across requests under Octane.
---
## Reason
The container's `$instances` array persists across all requests in an Octane worker. A singleton that accumulates data (cached queries, request counters, collection buffers) will grow unbounded and leak data between users. Static class properties compound this risk.
---
## Bad Example
```php
class AnalyticsTracker
{
    private static array $pageViews = []; // Static array grows across requests

    public function track(string $page): void
    {
        self::$pageViews[] = $page; // User A's page views visible to User B
    }
}
```
---
## Good Example
```php
class AnalyticsTracker
{
    private array $pageViews = []; // Instance property — reset per scope request

    public function track(string $page): void
    {
        $this->pageViews[] = $page; // Only accumulates within current request
    }
}
```
---
## Exceptions
Services that intentionally accumulate cross-request data (e.g., metrics aggregation) — document them as cross-request state.
---
## Consequences Of Violation
Unbounded memory growth in workers. User data leakage between requests. Hard-to-reproduce bugs that only appear after the Nth request in a worker.
---

## Rule 3: Configure Octane Flush Listeners for Auth, Session, Uploads
---
## Category
Security
---
## Rule
Always include `FlushSessionState`, `FlushAuthenticationState`, and `FlushUploadedFiles` in the `RequestTerminated` listener list in `config/octane.php`.
---
## Reason
These flush listeners reset request-scoped state between requests. Without them, session data, authentication state, and uploaded file instances persist across requests in the worker, leaking sensitive data from one user to the next.
---
## Bad Example
```php
// config/octane.php — missing flush listeners
'listeners' => [
    RequestTerminated::class => [
        // No flush listeners configured
    ],
],
```
---
## Good Example
```php
// config/octane.php
'listeners' => [
    RequestTerminated::class => [
        FlushUploadedFiles::class,
        FlushSessionState::class,
        FlushAuthenticationState::class,
        // Add custom flush listeners for app-specific request state
        \App\Listeners\FlushTenantState::class,
    ],
],
```
---
## Exceptions
Custom implementations that handle state flushing via alternative mechanisms.
---
## Consequences Of Violation
Session data leaks between users. Auth tokens persist — user A remains authenticated as user B. Uploaded files remain accessible across requests.
---

## Rule 4: Set max_requests to Limit Memory Growth
---
## Category
Reliability
---
## Rule
Configure `octane.max_requests` (e.g., 500-1000) to periodically restart workers and prevent unbounded memory accumulation.
---
## Reason
Even with correct scoped bindings, some memory growth is inevitable — autoloader caches, logged query bindings, deferred service resolution, and package internals accumulate over time. `max_requests` restarts workers after a set number of requests, resetting memory to a clean baseline.
---
## Bad Example
```php
// config/octane.php — no max_requests defined
// Workers run indefinitely until OOM
```
---
## Good Example
```php
// config/octane.php
'max_requests' => 500,
// Worker restarts after 500 requests — prevents unbounded growth
```
---
## Exceptions
Applications with perfect memory management and no observable growth. Monitor memory usage first to determine the right threshold.
---
## Consequences Of Violation
Workers consume increasing memory until the operating system kills them (OOM). Request failures during worker death. Unpredictable performance degradation over time.
---

## Rule 5: Pre-Resolve Hot-Path Services in booted()
---
## Category
Performance
---
## Rule
Pre-resolve services used on every request inside an `$app->booted()` callback to avoid per-request resolution overhead.
---
## Reason
Under Octane, the boot phase runs once per worker. Pre-resolving hot-path services in `booted()` moves the resolution cost from per-request to once-per-worker. The singleton instance persists in the container for all subsequent requests, eliminating resolution overhead.
---
## Bad Example
```php
public function boot()
{
    // Service resolved on every request — resolution cost paid per request
}
```
---
## Good Example
```php
public function register()
{
    $this->app->booted(function ($app) {
        // Pre-resolve for Octane — cost paid once per worker
        $app->make(HotPathService::class);
        $app->make(AnotherHotPathService::class);
    });
}
```
---
## Exceptions
Services that must be resolved fresh per request — use `scoped()` and do NOT pre-resolve them (pre-resolution would give every request the same instance).
---
## Consequences Of Violation
Resolution overhead on every request rather than once per worker. Missed opportunity to optimize Octane throughput.
---

## Rule 6: Test with Octane to Catch State Leaks
---
## Category
Testing
---
## Rule
Run integration tests in an Octane-like environment or with worker-style isolation to detect state leaks before production.
---
## Reason
State leaks only manifest after multiple requests in the same worker. Traditional per-request PHP-FPM testing never reveals them. Octane-specific test suites catch singleton state accumulation, static property leaks, and unflushed request state.
---
## Bad Example
```php
// Only running single-request tests
// State leak between requests never detected
```
---
## Good Example
```php
// Use Octane's testing utilities or run sequential requests in the same app instance
$response1 = $this->actingAs($userA)->get('/dashboard');
$response2 = $this->actingAs($userB)->get('/dashboard');
// Assert $response2 does not contain userA's data
```
---
## Exceptions
Applications not deployed on Octane — standard PHP-FPM testing is sufficient.
---
## Consequences Of Violation
State leaks discovered in production after user data exposure. Emergency rollbacks. Security incident response.
