# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Middleware
Knowledge Unit: `RateLimiter` Facade for Job Rate Limiting
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
The `RateLimiter` facade provides the low-level API for rate limiting in Laravel, used by both the `RateLimited` and `ThrottlesExceptions` middleware internally. It orchestrates atomic cache operations (`hit`, `attempt`, `tooManyAttempts`, `availableIn`, `clear`) to implement sliding window or fixed window rate counters. When building custom job middleware for rate limiting, the `RateLimiter` facade is the primary building block. It requires a cache store that supports atomic operations (Redis, Memcached, DynamoDB).

# Core Concepts
- **`RateLimiter::for()`**: Define a named rate limiter with `$name`, `$maxAttempts`, `$decaySeconds`.
- **`RateLimiter::attempt()`**: Atomically check and increment. Calls a callback if under limit.
- **`RateLimiter::hit()`**: Increment the counter. Returns the number of remaining attempts.
- **`RateLimiter::tooManyAttempts()`**: Check if the key has exceeded the limit.
- **`RateLimiter::availableIn()`**: Seconds until the counter resets.
- **`RateLimiter::clear()`**: Reset the counter for a key.
- **Cache driver requirement**: Requires a cache store implementing `LockProvider` (Redis, Memcached, DynamoDB, Database, File).

# Mental Models
- **Token bucket**: The `RateLimiter` is a token bucket. Each `hit()` removes a token. When tokens are empty, `tooManyAttempts()` returns `true`. Tokens refill after `decaySeconds`.
- **Vending machine coin slot**: Each execution inserts a coin (hit). The machine counts coins in the time window. When the max is reached, the machine stops accepting coins until the window resets.

# Internal Mechanics
- `RateLimiter::hit($key, $decaySeconds)`:
  1. Calls `Cache::increment($key)` — atomically increments the counter.
  2. Sets TTL if first increment: `Cache::expire($key, $decaySeconds)`.
  3. Returns the new counter value.
- `RateLimiter::attempt($key, $maxAttempts, $callback, $decaySeconds)`:
  1. Checks if `tooManyAttempts($key, $maxAttempts)`.
  2. If not: calls `$callback()` and returns `true`.
  3. If yes: returns `false` without calling callback.
- The underlying cache store uses `INCREMENT` (Redis) or equivalent atomic operation.
- Multiple keys share the same decay seconds per key. Counter is per-key, not per-limiter.
- Limiter definitions via `RateLimiter::for()` are stored in the application config, not in cache.

# Patterns
## Key-Scoped Rate Limiters
- **Purpose**: Different rate limits for different resources (user, API key).
- **Benefit**: Fine-grained control per resource.
- **Tradeoff**: Key cardinality; memory usage.

## Dynamic `decaySeconds`
- **Purpose**: Vary the rate limit window based on context.
- **Benefit**: Shorter windows for aggressive limits; longer for conservative.
- **Tradeoff**: Window consistency across keys.

## Combined Hit + Clear
- **Purpose**: Reset the counter on success.
- **Benefit**: Successful jobs don't count toward throttle limit.
- **Tradeoff**: One success can reset the count, potentially allowing a burst of failures after.

# Architectural Decisions
- **Use `RateLimiter::attempt()`** when you want "N attempts per window" with auto-callback.
- **Use `RateLimiter::hit()` + `tooManyAttempts()`** when you need to inspect current count before deciding on action.
- **Define named limiters via `RateLimiter::for()`** in `AppServiceProvider` for centralization.
- **Use `RateLimiter::clear()` on success** to reset counters — prevents accumulation of stale hit counters.

# Tradeoffs
`attempt()` | Simple, atomic check-and-call | Cannot inspect counter state before callback
`hit()` + manual check | Full control over logic | More verbose; two operations instead of one
Named limiter (for()) | Centralized, reusable | Defined at boot; cannot be dynamic

# Performance Considerations
- Each `hit()` is a cache increment + TTL check: ~1-3ms.
- `attempt()` is the same cost as `hit()` + `tooManyAttempts()`.
- `availableIn()` reads cache TTL: ~1ms.
- At high throughput (1000+ rate-limited jobs/sec), cache rate limiting operations become measurable load.
- Redis can handle 100K+ INCREMENT operations per second — not a bottleneck in practice.

# Production Considerations
- Always verify the cache driver supports atomic operations. `file` cache does NOT correctly implement `increment()` atomically.
- `RateLimiter` keys in cache persist for `decaySeconds`. Monitor total rate limiter key count in Redis.
- Named limiters are evaluated at dispatch/middleware time, not boot time. Lazy registration is fine.
- The `RateLimiter` facade is backed by `Illuminate\Cache\RateLimiter`. Custom implementations can extend it.
- `RateLimiter::availableIn()` returns 0 if the key doesn't exist (no rate limit has been hit). Check existence first.

# Common Mistakes
- **Using `RateLimiter` with `array` cache**: The `array` cache only persists for the current request. Rate limit counters are lost on the next request. Jobs never get rate limited.
- **Not checking return value of `attempt()`**: `attempt()` returns `bool`. Ignoring it means the callback runs even when rate limited (defeating the purpose).
- **Assuming `decaySeconds` is per-key**: Each key gets its own `decaySeconds` counter. Different keys don't share windows.
- **Forgetting to `clear()` on success in throttle middleware**: Failed jobs increment the counter; successful jobs should clear it. Without clearing, the throttle accumulates failures over time.
- **Rate limiting in middleware vs job class**: Both use the same `RateLimiter`. If both a job and its middleware rate limit, counters are shared or overlapping.

# Failure Modes
- **Cache outage disables rate limiting**: If Redis is down, `RateLimiter::hit()` may fail. Jobs run without rate limiting.
- **Rate limiter key collision**: Two different middleware using the same key prefix. Counters collide, affecting each other's limits.
- **Counter overflow**: `RateLimiter::hit()` uses cache `increment()`. If the integer overflows (2147483647 on 32-bit systems), it wraps to negative.
- **Stale keys consume cache memory**: Rate limiter keys live for `decaySeconds`. High key cardinality can fill Redis memory.

# Ecosystem Usage
- **Laravel framework**: `Illuminate\Cache\RateLimiter` backs the `RateLimiter` facade. Used by middleware and HTTP rate limiting.
- **Laravel Horizon**: Does not use `RateLimiter` directly — Horizon's throttling is at the supervisor level.
- **Spatie packages**: Spatie's `laravel-rate-limited-job-middleware` uses `RateLimiter` under the hood but adds its own configuration layer.

# Related Knowledge Units
- K050 `RateLimited` Job Middleware (uses RateLimiter) | K051 `ThrottlesExceptions` Middleware (uses RateLimiter)

## Research Notes
- Job middleware in Laravel is a pipeline pattern applied at the worker level before the job's handle() method — this is architecturally distinct from HTTP middleware which wraps the request-response cycle.
- The WithoutOverlapping middleware uses a cache lock to prevent concurrent execution of the same job — this lock must be manually released if a job fails before completion, as the lock is held until the job finishes (or times out).
- Rate-limited job middleware leverages Laravel's RateLimiter facade with Redis as the backing store — the key is typically "{job-class}:{job-id}" and the limit resets based on the configured decay interval.
- Community packages like spatie/laravel-rate-limited-job-middleware provide declarative rate limiting via job properties, reducing boilerplate compared to implementing within the job class.
- The ShouldBeUnique contract (Laravel 10+) creates a uniqueness lock before job dispatch — the lock TTL is configured via uniqueFor property, and expired unique locks are automatically released.
- Custom job middleware is created via the middleware() method on the job class, returning an array of middleware instances — the handle(, ) pattern is identical to HTTP middleware.
- Job middleware executes in the queue worker process, not in the dispatching process — this distinction matters for debugging and logging context.
- Multiple middleware on a single job execute in the order returned by the middleware() method — ordering matters when middleware depends on side effects of another.
