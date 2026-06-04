# Phase 5: Rules — Rate Limiter Definition

> Generated from 04-standardized-knowledge.md

## Use Named Limiters Instead of Inline throttle:60,1
---
## Category
Maintainability
---
## Rule
Always define named limiters via `RateLimiter::for()` and reference them as `throttle:limiter-name` instead of using inline `throttle:60,1` on routes.
---
## Reason
Inline throttle values are scattered across route files, duplicated inconsistently, and impossible to test independently. Named limiters centralize configuration and enable unit testing.
---
## Bad Example
```php
Route::get('/posts', [PostController::class, 'index'])
    ->middleware('throttle:30,1');
Route::get('/users', [UserController::class, 'index'])
    ->middleware('throttle:60,1');
// Inconsistent and untestable
```

---
## Good Example
```php
// In AppServiceProvider::boot()
RateLimiter::for('api', fn($request) => Limit::perMinute(60));

// In routes
Route::get('/posts', [PostController::class, 'index'])
    ->middleware('throttle:api');
Route::get('/users', [UserController::class, 'index'])
    ->middleware('throttle:api');
```

---
## Exceptions
Quick prototyping where extracting named limiters adds overhead — but refactor before production.
---
## Consequences Of Violation
Inconsistent limits across routes; harder to audit and test rate limiting behavior.

---
## Always Include a Consumer Key in Every Limiter
---
## Category
Design
---
## Rule
Always pass a consumer-identifying key to `Limit::by()` in every named limiter definition.
---
## Reason
Without an explicit `by()` key, Laravel defaults to the request URL path, grouping all consumers under the same counter. This means one user's requests can exhaust the limit for all other users.
---
## Bad Example
```php
RateLimiter::for('api', fn($request) => Limit::perMinute(60));
// No by() — defaults to URL path, shared by all consumers
```

---
## Good Example
```php
RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by(
        $request->user() ? 'user:' . $request->user()->id : 'ip:' . $request->ip()
    );
});
```

---
## Exceptions
Health check endpoints where a single global limit is intentional.
---
## Consequences Of Violation
Entire user base shares rate limit budget; one abuser can deny service to all.

---
## Define Limiters in Service Provider Boot Method
---
## Category
Architecture
---
## Rule
Always register named limiters inside a service provider's `boot()` method, never inside route files or controllers.
---
## Example
Defining limiters in route files causes re-registration on every request, defeating the purpose of named limiters and introducing subtle bugs.
---
## Reason
Route files are re-evaluated on every request in some configurations. The `boot()` method runs once per application lifecycle, ensuring a single authoritative definition.
---
## Bad Example
```php
// routes/api.php
RateLimiter::for('api', fn($request) => Limit::perMinute(60));
// Re-registered on every request — state management issues
```

---
## Good Example
```php
// AppServiceProvider.php
public function boot(): void
{
    RateLimiter::for('api', fn(Request $request) => Limit::perMinute(60)->by(...));
}
```

---
## Exceptions
No common exceptions. Always use service providers.
---
## Consequences Of Violation
Limiter state reset on every request; race conditions; unpredictable behavior.

---
## Return New Limit Instances, Never Reuse
---
## Category
Design
---
## Rule
Always return a new `Limit` instance from the limiter callback. Never cache or reuse `Limit` objects across requests.
---
## Reason
`Limit` instances are mutable and contain request-specific state. Reusing a cached instance across multiple requests causes state leaks and incorrect rate limit counts.
---
## Bad Example
```php
$cachedLimit = Limit::perMinute(60);
RateLimiter::for('api', fn($request) => $cachedLimit);
// Shared mutable state — incorrect counts
```

---
## Good Example
```php
RateLimiter::for('api', fn($request) => Limit::perMinute(60)->by(...));
// Fresh instance per request
```

---
## Exceptions
No common exceptions. Always return fresh Limit instances.
---
## Consequences Of Violation
Rate limit state corruption; incorrect remaining counts; unpredictable throttle behavior.

---
## Use Redis as Cache Backend, Never File
---
## Category
Reliability
---
## Rule
Always use Redis (or another atomic cache backend) for rate limiting. Never use the file cache driver.
---
## Reason
Rate limiting requires atomic INCR operations with TTL. File-based caching has race conditions under concurrent requests, producing inaccurate counts and allowing requests past the limit.
---
## Bad Example
```php
// .env
CACHE_STORE=file
// File cache — race conditions under concurrent load
```

---
## Good Example
```php
// .env
CACHE_STORE=redis
// Atomic INCR + EXPIRE operations
```

---
## Exceptions
Single-user development environments where concurrency is not a concern — but Redis is still preferred.
---
## Consequences Of Violation
Rate limit bypass under concurrent load; race conditions inflating or deflating counts.

---
## Use Multi-Bucket Limits for Burst + Sustain Protection
---
## Category
Scalability
---
## Rule
Always define multi-bucket limits (per-minute + per-hour) for comprehensive abuse protection rather than a single window.
---
## Reason
A single per-minute limit allows sustained abuse across hours (1,440 requests at 60/min). Adding a per-hour bucket caps total volume while the per-minute bucket handles bursts.
---
## Bad Example
```php
RateLimiter::for('api', fn($request) => Limit::perMinute(60));
// Allows 86,400 requests/day — no daily cap
```

---
## Good Example
```php
RateLimiter::for('api', fn($request) => [
    Limit::perMinute(60)->by($key),
    Limit::perHour(1000)->by($key),
]);
// Burst: 60/min, Sustain: 1000/hour
```

---
## Exceptions
Low-traffic internal APIs where sustained abuse is not a realistic threat.
---
## Consequences Of Violation
Sustained API abuse at maximum per-minute rate; resource exhaustion over long periods.

---
## Never Use perMinute(0) — Use PHP_INT_MAX for Unlimited
---
## Category
Design
---
## Rule
Never set `perMinute(0)` to indicate "unlimited". Use `PHP_INT_MAX` instead.
---
## Reason
`perMinute(0)` blocks every request because zero attempts are allowed. `PHP_INT_MAX` provides an effectively unlimited ceiling without blocking legitimate traffic.
---
## Bad Example
```php
RateLimiter::for('internal', fn($request) => Limit::perMinute(0));
// Blocks all requests
```

---
## Good Example
```php
RateLimiter::for('internal', fn($request) => Limit::perMinute(PHP_INT_MAX));
// Effectively unlimited
```

---
## Exceptions
When you explicitly want to block all requests to an endpoint (use a dedicated middleware instead).
---
## Consequences Of Violation
Accidental blackout of internal services; production incidents from unintended blocking.

---
## Use Composite Keys with Endpoint Prefix
---
## Category
Security
---
## Rule
Always prefix rate limit keys with the endpoint context to prevent cross-endpoint collisions.
---
## Reason
The same user ID across different endpoints should have separate rate limit counters. A login endpoint key `user:123` collides with an API data endpoint key `user:123`, causing login attempts to consume the API data budget.
---
## Bad Example
```php
Limit::perMinute(5)->by('user:'.$request->user()->id);
// Same key used for login and data endpoints
```

---
## Good Example
```php
Limit::perMinute(5)->by('login:user:'.$request->user()->id);
Limit::perMinute(60)->by('api:user:'.$request->user()->id);
```

---
## Exceptions
Endpoints where sharing rate limit budgets across contexts is intentional.
---
## Consequences Of Violation
Cross-endpoint rate limit collisions; one endpoint exhausting another's budget.

---
## Implement Fail-Open Protection for Redis Outages
---
## Category
Reliability
---
## Rule
Always implement a circuit breaker or fallback mechanism for rate limiting when Redis is unavailable.
---
## Reason
Redis outages cause rate limiting to fail open (all requests pass) by default — or fail closed (all requests blocked) if exceptions bubble up. Neither is acceptable without explicit design.
---
## Bad Example
```php
// No Redis fallback — outage blocks all requests or passes all
RateLimiter::for('api', fn($request) => Limit::perMinute(60));
```

---
## Good Example
```php
// RateLimiter with try-catch fallback
try {
    return Limit::perMinute(60)->by($key);
} catch (\RedisException $e) {
    Log::critical('Redis unavailable for rate limiting');
    return Limit::unlimited(); // Fail open with logging
    // Or: abort(503, 'Service unavailable'); // Fail closed
}
```

---
## Exceptions
No common exceptions. Every production system needs an outage strategy.
---
## Consequences Of Violation
Complete service outage during Redis failure (fail-closed) or unlimited abuse during failure (fail-open).

---
## Clear Rate Limit State Between Tests
---
## Category
Testing
---
## Rule
Always clear rate limiter state between test cases when testing rate-limited endpoints.
---
## Reason
Rate limit state persists across requests within the same test process. Without clearing, tests hit real limits and fail non-deterministically depending on execution order.
---
## Bad Example
```php
public function test_guest_limit(): void
{
    // First request passes, subsequent may fail
    $response = $this->get('/api/posts');
    $response->assertStatus(200);
}
```

---
## Good Example
```php
use Illuminate\Support\Facades\RateLimiter;

public function test_guest_limit(): void
{
    RateLimiter::clear('guest');
    
    $response = $this->get('/api/posts');
    $response->assertStatus(200);
}
```

---
## Exceptions
Integration tests specifically testing cumulative rate limit behavior.
---
## Consequences Of Violation
Flaky tests that pass or fail based on execution order; false positives in CI pipelines.
