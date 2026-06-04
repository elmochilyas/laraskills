# Rule Card: K076 — `RateLimiter` Facade for Job Rate Limiting

---

## Rule 1

**Rule Name:** prefer-attempt-for-simple-windows

**Category:** Prefer

**Rule:** Prefer `RateLimiter::attempt()` for simple "N attempts per window" scenarios.

**Reason:** `attempt()` wraps the check-and-callback into one atomic operation — eliminating the race condition between checking and executing.

**Bad Example:**
```php
if (!RateLimiter::tooManyAttempts($key, 60)) {
    RateLimiter::hit($key, 60);
    // Race: two workers can both pass tooManyAttempts before either hits
}
```

**Good Example:**
```php
if (!RateLimiter::attempt($key, 60, fn() => $next($job))) {
    $job->release(RateLimiter::availableIn($key));
}
```

**Exceptions:** When you need the raw counter value (e.g., showing remaining attempts), use `hit()` + `tooManyAttempts()` separately.

**Consequences Of Violation:** Two concurrent workers both pass the `tooManyAttempts` check — the rate limit is exceeded by up to N-1 extra executions per window.

---

## Rule 2

**Rule Name:** clear-counter-on-throttle-success

**Category:** Always

**Rule:** Always call `RateLimiter::clear()` on success in throttle implementations.

**Reason:** Without clearing, the exception counter accumulates over time — eventually throttling healthy jobs that have recovered.

**Bad Example:**
```php
public function handle(object $job, \Closure $next): void
{
    try {
        $next($job);
    } catch (Throwable $e) {
        RateLimiter::hit($this->key, 60);
        throw $e;
    }
    // No clear on success — counter never resets
}
```

**Good Example:**
```php
public function handle(object $job, \Closure $next): void
{
    try {
        $next($job);
        RateLimiter::clear($this->key); // Reset on success
    } catch (Throwable $e) {
        RateLimiter::hit($this->key, 60);
        throw $e;
    }
}
```

**Exceptions:** When the rate limit counter should persist across successes (e.g., daily limit), don't clear on success.

**Consequences Of Violation:** After a burst of transient failures, the counter stays elevated — a single recovery success isn't enough, and jobs continue to be throttled unnecessarily.

---

## Rule 3

**Rule Name:** use-named-limiters-for-configuration

**Category:** Prefer

**Rule:** Prefer named limiters registered via `RateLimiter::for()` for centralized configuration.

**Reason:** Named limiters are reusable across middleware, HTTP routes, and other consumers — one definition, multiple consumers.

**Bad Example:**
```php
// Duplicated configuration across middleware and routes
if (RateLimiter::tooManyAttempts('api:' . $job->apiKey, 60)) { ... }
```

**Good Example:**
```php
// AppServiceProvider — single definition
RateLimiter::for('api-requests', fn($job) => Limit::perMinute(60)->by($job->apiKey));

// Any consumer — reference by name
$limiter = RateLimiter::limiter('api-requests');
```

**Exceptions:** One-off rate limiters used only in a single middleware don't need named definitions.

**Consequences Of Violation:** Rate limit configuration is duplicated across files — changing the limit means updating every middleware, route, and consumer individually, increasing the risk of inconsistencies.

---

## Rule 4

**Rule Name:** use-cache-with-atomic-increment

**Category:** Always

**Rule:** Always use a cache driver with atomic increment support for `RateLimiter`.

**Reason:** `RateLimiter` operations depend on atomicity — `file` and `array` cache drivers do not implement atomic increment correctly.

**Bad Example:**
```php
// CACHE_DRIVER=file — no atomic increment
// Rate limiter counters are unreliable — race conditions cause limit breaches
```

**Good Example:**
```php
// CACHE_DRIVER=redis — full atomic increment support
// Rate limiter counters are accurate and race-condition free
```

**Exceptions:** Development environments may use any cache driver since rate limiting is not critical.

**Consequences Of Violation:** Two workers reading and writing the same counter simultaneously — both can exceed the limit, the counter is incorrect, and rate limiting fails open (allows too many) or fails closed (blocks forever).
