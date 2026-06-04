## Use scoped() for all request-dependent service bindings in Octane
---
Category: Framework Usage
---
Replace singleton() with scoped() for any service that holds request-scoped state (authenticated user, request data, database transaction state) — singletons persist across requests and leak state.
---
Reason: In Octane, singleton bindings persist across all requests within a worker. If a singleton stores the authenticated user from request A, request B in the same worker retrieves user A's data. scoped() bindings are reset at each request boundary — the service is freshly resolved for each request, preventing data leakage. Eloquent models, auth services, and session managers must use scoped() or implement explicit state reset.
---
Bad Example:
```php
// Singleton — request state leaks across requests
$this->app->singleton(AuthService::class, function () {
    return new AuthService();
});
// Request A sets user: AuthService::$user = User A
// Request B reads user: gets User A — DATA LEAK
```

Good Example:
```php
// Scoped — fresh instance per request
$this->app->scoped(AuthService::class, function () {
    return new AuthService();
});
// Each request gets its own AuthService — no data leakage
```
---
Exceptions: Truly stateless services (logging, configuration, caching clients) with no request-scoped state should remain singleton for performance.
---
Consequences Of Violation: Data leakage between users, privilege escalation (User B sees User A's data), cross-request contamination, difficult-to-diagnose intermittent failures.

## Never perform database queries, API calls, or file reads in service provider boot() without caching
---
Category: Performance
---
If a service provider's boot() method performs expensive operations (queries, API calls, file I/O), wrap them in lazy initialization or cache the results — boot() runs on every worker start, not per request.
---
Reason: In FPM, boot() runs once per request — expensive operations are acceptable because each request is isolated. In Octane, boot() runs once per worker start. A database query in boot() that takes 100ms adds 100ms to every worker start. With 8 workers and rolling deployments, that's 800ms added to deployment time. Worker starts also happen during max_requests recycling, affecting the one request that triggers the replacement worker.
---
Bad Example:
```php
// Expensive query in boot() — runs on every worker start
public function boot(): void
{
    $settings = Setting::all();  // 50ms DB query on every worker start
    config()->set('app.settings', $settings);
}
```

Good Example:
```php
// Lazy initialization — first request pays the cost, not worker start
public function boot(): void
{
    $this->app->singleton('app.settings', fn() => Setting::all());
}
```
---
Exceptions: Configuration values that are needed for route registration or middleware configuration must be loaded at boot time.
---
Consequences Of Violation: Increased worker start time, slower rolling deployments, unnecessary database load from repeated queries on every worker start.

## Defer expensive service providers that are not needed on every request
---
Category: Performance
---
Apply DeferrableProvider to any service provider whose services are used in fewer than 50% of requests — defer its loading until the bound service is first requested.
---
Reason: A deferred provider's boot() is skipped entirely until its service is resolved. If the service is used in only 10% of requests, 90% of workers never load the provider — saving memory and start time. The deferred loading adds latency only to the first request that triggers the provider, not to every worker start. The savings compound across the number of workers and deployments.
---
Bad Example:
```php
// Non-deferred provider — loaded on every worker start
class ReportServiceProvider extends ServiceProvider // Used in 5% of requests
{
    public function boot(): void
    {
        // Heavy initialization run on every worker start
    }
}
```

Good Example:
```php
// Deferred provider — loaded only when ReportService is requested
class ReportServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function provides(): array
    {
        return [ReportService::class];
    }
}
```
---
Exceptions: Providers that register event listeners, middleware, or route model bindings in boot() must remain non-deferred.
---
Consequences Of Violation: Unnecessary worker memory and start time for providers rarely used, wasted resources on every worker start for services seldom needed.

## Avoid capturing request-scoped variables in closures registered during service provider boot()
---
Category: Framework Usage
---
Never capture request-scoped state (authenticated user, request parameters, session data) in closures registered during provider boot() — these closures persist across all requests in the worker.
---
Reason: Closures registered in boot() (event listeners, pipeline stages, middleware callbacks) are created once per worker and executed for every request within that worker. If the closure captures a variable that was set during boot(), that variable is shared across all requests. If it captures a variable meant to be per-request, the value from boot() time is used for every request — causing state leakage.
---
Bad Example:
```php
// Captures boot-time variable — shared across all requests
public function boot(): void
{
    $user = Auth::user(); // Captured at boot time — same user for all requests!
    Event::listen(RequestHandled::class, function () use ($user) {
        Log::info("Request handled by {$user->name}"); // Always the same user
    });
}
```

Good Example:
```php
// No capture — resolves at event time
public function boot(): void
{
    Event::listen(RequestHandled::class, function () {
        Log::info("Request handled by " . Auth::user()?->name); // Current user
    });
}
```
---
Exceptions: Truly immutable configuration values (app name, environment) may be safely captured if they never change between requests.
---
Consequences Of Violation: Event listeners, middleware, or callbacks use stale or incorrect request data, silent data corruption across requests.
