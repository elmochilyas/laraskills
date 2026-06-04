## Define Named Limiters Instead of Inline Limits

Register all rate limiters via `RateLimiter::for()` in a service provider. Do not use inline `throttle:60,1` strings in route definitions.

---

## Category

Maintainability

---

## Rule

Every rate limiter must be registered with a name via `RateLimiter::for('name', ...)` in a service provider's `boot()` method. Routes reference the named limiter: `->middleware('throttle:name')`.

---

## Reason

Named limiters are reusable across routes, centrally configurable, and support complex segmentation logic via the `$job` object. Inline limits (`throttle:60,1`) are duplicated across route files, cannot segment by user/IP, and are impossible to audit or change centrally.

---

## Bad Example

```php
// Inline limit — duplicated, no segmentation
Route::middleware('throttle:60,1')->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('posts', PostController::class);
});
```

---

## Good Example

```php
// AppServiceProvider::boot()
RateLimiter::for('api', function (object $job) {
    return Limit::perMinute(100)
        ->by($job->user?->id ?: $job->ip);
});

// Route file
Route::middleware('throttle:api')->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('posts', PostController::class);
});
```

---

## Exceptions

Inline limits may be used for temporary development-only routes or one-off debugging endpoints. Never use inline limits in production route files.

---

## Consequences Of Violation

Maintenance risks from duplicated limits that must be updated in multiple places; missing segmentation logic; audit blind spots.

---

## Segment by Authentication Status

Always differentiate rate limit keys for authenticated vs guest users.

---

## Category

Security

---

## Rule

Use `$job->user?->id ?: $job->ip` (or equivalent) as the rate limit key. Authenticated users should be limited by user ID; guest users by IP address.

---

## Reason

Authenticated users identified by IP alone may be unfairly limited behind a NAT (all employees of one company share one IP). Guests limited by user ID have no user ID. Segmenting by authentication status ensures fair limits for both groups.

---

## Bad Example

```php
RateLimiter::for('api', function (object $job) {
    return Limit::perMinute(60)->by($job->ip);
    // Authenticated users behind NAT get the same limit as
    // unauthenticated users from the same IP
});
```

---

## Good Example

```php
RateLimiter::for('api', function (object $job) {
    return Limit::perMinute(100)
        ->by($job->user?->id ?: $job->ip);
});
```

---

## Exceptions

Authentication-only limiter (e.g., for login endpoints) should always key by IP, since there is no authenticated user at that point.

---

## Consequences Of Violation

False positives for authenticated users behind NAT; misconfigured limits that allow brute-force attacks from authenticated sessions.

---

## Register Limiters Before Route Dispatch

All `RateLimiter::for()` calls must be in a service provider's `boot()` method that runs before routes are loaded.

---

## Category

Reliability

---

## Rule

Register all rate limiters in `AppServiceProvider::boot()` or a dedicated `RateLimiterServiceProvider`. Do not register limiters in route files or middleware.

---

## Reason

Rate limiters are resolved at route dispatch time. If a named limiter is referenced in `throttle:api` but never registered, the framework throws a `RuntimeException`. Centralized registration ensures all limiters exist before any route can match.

---

## Bad Example

```php
// In routes/api.php — may not execute before dispatch
RateLimiter::for('api', function (object $job) {
    return Limit::perMinute(60)->by($job->ip);
});
```

---

## Good Example

```php
// AppServiceProvider::boot()
RateLimiter::for('api', function (object $job) {
    return Limit::perMinute(60)->by($job->ip);
});
```

---

## Exceptions

Package developers may register limiters in the package service provider, provided the package is registered before routes are loaded.

---

## Consequences Of Violation

Runtime `RuntimeException` when a throttle middleware references an unregistered limiter; the application returns 500 errors for all routes in the affected group.

---

## Use Redis for Production Rate Limiting

Use Redis as the cache driver for rate limiting in production deployments.

---

## Category

Performance

---

## Rule

Configure `CACHE_STORE=redis` (or the Redis-specific config) for production environments. Do not use file or database cache for rate limiting.

---

## Reason

Rate limiting requires atomic increment operations and consistent state across requests. The file cache is not atomic under concurrent access and the database cache adds latency. Redis provides atomic operations, TTL-expiry, and sub-millisecond latency, making it the only production-suitable driver for rate limiting.

---

## Bad Example

```php
// .env — file cache
CACHE_STORE=file
// Rate limiting with file cache — wrong counts under concurrency
```

---

## Good Example

```php
// .env
CACHE_STORE=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

---

## Exceptions

Single-server development environments may use any cache driver. Never deploy file-cache rate limiting to production.

---

## Consequences Of Violation

Inaccurate rate limit counts under concurrent traffic; rate limit bypass when the file cache cannot write atomically; gaps in rate limit enforcement during traffic spikes.

---

## Do Not Implement Rate Limiting in Business Logic

Rate limiting must be applied at the routing layer via the `throttle` middleware, not implemented inside controllers or services.

---

## Category

Architecture

---

## Rule

Do not put rate limiting logic in controllers, services, or actions. All rate limiting must be configured via `RateLimiter::for()` and applied via the `throttle` middleware on routes or route groups.

---

## Reason

Rate limiting is a cross-cutting infrastructure concern that belongs at the HTTP boundary. Implementing it in business logic violates separation of concerns, makes it impossible to audit centrally, and bypasses the framework's cache-integrated, middleware-based implementation.

---

## Bad Example

```php
class LoginController
{
    public function __invoke(Request $request)
    {
        $key = $request->ip();
        $attempts = Cache::get("login.{$key}", 0);
        if ($attempts >= 5) {
            abort(429, 'Too many attempts');
        }
        Cache::increment("login.{$key}");
        // Rate limiting logic inside controller
    }
}
```

---

## Good Example

```php
// AppServiceProvider
RateLimiter::for('login', function (object $job) {
    return Limit::perMinute(5)->by($job->ip);
});

// Route
Route::post('/login', [LoginController::class, '__invoke'])
    ->middleware('throttle:login');
```

---

## Exceptions

No common exceptions. Rate limiting belongs at the routing boundary.

---

## Consequences Of Violation

Duplicated rate limiting logic across controllers; inability to audit or change limits centrally; easily bypassed or forgotten on new endpoints.
