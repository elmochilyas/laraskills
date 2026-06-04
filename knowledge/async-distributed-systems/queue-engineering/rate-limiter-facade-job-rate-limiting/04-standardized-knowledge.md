# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K076 — `RateLimiter` Facade for Job Rate Limiting
- **Knowledge ID:** K076
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Rate Limiting
  - Laravel Source — `Illuminate\Cache\RateLimiter`

---

# Overview

The `RateLimiter` facade provides the low-level API for rate limiting, used internally by both `RateLimited` and `ThrottlesExceptions` middleware. It orchestrates atomic cache operations (`hit`, `attempt`, `tooManyAttempts`, `availableIn`, `clear`) to implement fixed-window rate counters. When building custom job middleware for rate limiting, `RateLimiter` is the primary building block. It requires a cache store supporting atomic operations (Redis, Memcached, DynamoDB).

---

# Core Concepts

- **`RateLimiter::for()`:** Define a named rate limiter with `$name`, `$maxAttempts`, `$decaySeconds`.
- **`hit()`:** Increment the counter atomically. Returns remaining attempts.
- **`attempt()`:** Atomically check and increment. Calls callback if under limit.
- **`tooManyAttempts()`:** Check if key has exceeded the limit.
- **`availableIn()`:** Seconds until counter resets.
- **`clear()`:** Reset the counter for a key.

---

# When To Use

- Building custom job middleware for rate limiting
- Direct rate limit checks outside of middleware (e.g., before dispatching jobs)
- When you need fine-grained control over rate limit behavior

---

# When NOT To Use

- Standard rate limiting scenarios — use `RateLimited` middleware instead
- Reactive backpressure — use `ThrottlesExceptions` middleware instead
- Non-cache-backed rate limiting — `RateLimiter` requires a cache with atomic operations

---

# Best Practices

- **Use `attempt()` for simple "N attempts per window" scenarios.** It wraps check + callback into one atomic operation. *Why: `attempt()` eliminates the race between checking the counter and executing the callback — two concurrent calls can't both check `tooManyAttempts()` and both proceed.*
- **Use `hit()` + `tooManyAttempts()` when you need to inspect counter state before deciding.** `attempt()` doesn't expose the current count. *Why: For custom display of "you have X remaining attempts" or progressive backoff, you need the raw counter value from `hit()`.*
- **Always `clear()` on success in throttle implementations.** Without clearing, the counter accumulates failures over time, eventually throttling healthy jobs. *Why: `ThrottlesExceptions` uses this pattern — success means the downstream service is healthy, so the failure history should reset.*
- **Use named limiters (`RateLimiter::for()`) for centralized configuration.** Register in `AppServiceProvider`. *Why: Named limiters are reusable across middleware and HTTP routes — one definition, multiple consumers.*

---

# Performance Considerations

- Each `hit()` is a cache increment + TTL set: ~1-3ms.
- `availableIn()` reads cache TTL: ~1ms.
- Redis handles 100K+ INCREMENT ops/sec — not a bottleneck in practice.
- Cache driver matters — `file` driver does NOT implement atomic increment correctly.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using with `array` cache driver | Array cache is request-scoped | Counters reset every request — no rate limiting | Use Redis or Memcached |
| Ignoring `attempt()` return value | Not checking the bool | Callback runs even when rate limited | `if (!RateLimiter::attempt(...)) return;` |
| Not `clear()` on success in throttle | Counter accumulates | False throttling after repeated failures | Clear counter on success |

---

# Examples

```php
// Named limiter definition (AppServiceProvider)
RateLimiter::for('api-requests', fn($job) => Limit::perMinute(60)->by($job->apiKey));

// Custom middleware using RateLimiter directly
public function handle(object $job, \Closure $next): void
{
    $key = sha1(get_class($job).':'.$job->apiKey);
    if (RateLimiter::tooManyAttempts($key, 60)) {
        $job->release(RateLimiter::availableIn($key));
        return;
    }
    RateLimiter::hit($key, 60);
    $next($job);
}
```

---

# Related Topics

- **K050 RateLimited Job Middleware (K050)** — Uses RateLimiter
- **K051 ThrottlesExceptions Middleware (K051)** — Uses RateLimiter
