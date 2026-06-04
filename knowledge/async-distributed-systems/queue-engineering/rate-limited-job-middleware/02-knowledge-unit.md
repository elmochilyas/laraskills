# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Middleware
Knowledge Unit: `RateLimited` Job Middleware
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
The `RateLimited` middleware prevents a job from executing more than N times per time window, using Laravel's `RateLimiter` facade backed by the cache (typically Redis). It's applied via the job's `middleware()` method. When the rate limit is exceeded, the job is released back to the queue with a delay equal to the time until the rate limit resets. This is essential for jobs that hit external APIs with rate constraints.

# Core Concepts
- **`RateLimiter` facade**: Laravel's rate limiting API. Defines named limiters with `maxAttempts` and `decayMinutes`. Uses cache for counter storage.
- **Middleware application**: Return `new RateLimited('limiter_name')` from the job's `middleware()` method.
- **Rate limit exceeded**: Job is released with `release($secondsUntilReset)`. It retries after the delay.
- **Per-job scoping**: Rate limits can be scoped per job instance (e.g., per user, per API key).
- **`RateLimitedWithRedis`**: Redis-specific middleware with better performance for high-throughput rate limiting.

# Mental Models
- **Bouncer at a club**: The RateLimited middleware is a bouncer. It checks how many times the job has entered (executed) in the last N minutes. If the job exceeds its allowed entries, the bouncer sends it to the back of the line (releases it with delay).
- **API quota guard**: Like your phone's data cap. After N gigabytes, speed is throttled. The middleware is the data cap monitor for API calls.

# Internal Mechanics
- `RateLimited` middleware implements `MiddlewareInterface::handle($job, $next)`.
- On `handle()`:
  1. Calls `RateLimiter::attempt($key, $maxAttempts, $callback, $decayMinutes)`.
  2. If the limiter allows the attempt: the callback executes `$next($job)`.
  3. If the limiter denies: the callback returns `$this->release($secondsUntilReset)`.
  4. The `$key` is typically `sha1($job::class . ':' . $job->uniqueId())`.
- `RateLimiter::attempt()` uses cache (Redis) with atomic operations (`INCREMENT`, `EXPIRE`).
- Jobs are released with a delay based on seconds remaining until the rate limit window resets.
- The middleware does NOT consume a queue retry attempt — `release()` returns the job to the queue without incrementing tries.

# Patterns
## Per-Resource Rate Limiting
- **Purpose**: Rate limit jobs per external API key or user.
- **Benefit**: Each API consumer has independent limits.
- **Tradeoff**: More rate limiter keys; cache memory usage.

## Severity-Tiered Limits
- **Purpose**: Different limits for different job priorities.
- **Benefit**: Critical jobs get higher rate limits.
- **Tradeoff**: More limiter definitions; priority escalation logic.

## Combined Rate Limiting (Throttle + RateLimit)
- **Purpose**: Use both `ThrottlesExceptions` and `RateLimited` on the same job.
- **Benefit**: `RateLimited` for hard API limits, `ThrottlesExceptions` for backend protection.
- **Tradeoff**: Two middleware to maintain; interaction may cause unexpected delays.

# Architectural Decisions
- **Use `RateLimited` for client-enforced limits**: When an API explicitly defines a rate limit (X requests per Y seconds), match it with middleware.
- **Use `ThrottlesExceptions` for server-enforced backpressure**: When the backend doesn't define limits but fails under load — throttle based on exceptions.
- **Choose `RateLimitedWithRedis` over `RateLimited` for Redis-backed applications**: Redis-specific middleware is more efficient (uses atomic Redis operations directly).
- **Scope rate limit keys to the job instance**: Use job properties (user ID, API key) to scope the limiter, preventing cross-resource starvation.

# Tradeoffs
Per-job rate limiting | Precise, resource-specific | Many unique keys; cache memory usage
Global rate limiting | Simple, low cache usage | One job type's limits affect another's
`RateLimitedWithRedis` | Faster, atomic Redis ops | Coupled to Redis; not portable

# Performance Considerations
- Each rate limit check adds ~1-5ms (cache read + increment).
- Rate limit release delay: the job stays in the queue until the window resets. This may be seconds to minutes.
- High rate limit key cardinality (e.g., per-user limits for 100K users) creates many cache keys.
- Idle time from rate limit waits: a heavily rate-limited job may spend 90% of its time waiting.

# Production Considerations
- Monitor rate limit hit rate. A high hit rate means the job is constantly pushing against limits.
- Rate limit counters in cache persist for `decayMinutes`. If the cache is flushed (Redis restart), all counters reset — bursts of activity follow.
- `RateLimiter::attempt()` default behavior: consumes an attempt on EACH call. If the job is released and retried, the next attempt consumes another from the counter.
- Set the rate limit window (`decayMinutes`) to match the API's reset period (typically 1 minute, 1 hour, or 24 hours).

# Common Mistakes
- **Setting rate limit window smaller than max job execution time**: If the job takes 2 minutes but the window is 1 minute, the rate limit counter may reset mid-execution.
- **Not scoping rate limit keys**: Without per-resource scoping, one user's API calls can exhaust the rate limit for all users.
- **Rate limiting without release delay**: If the release delay is 0, the job retries immediately and immediately hits the rate limit again — tight loop.
- **Confusing `RateLimited` with `ThrottlesExceptions`**: `RateLimited` is proactive (checks before execution). `ThrottlesExceptions` is reactive (checks after exceptions).

# Failure Modes
- **Rate limiter key collision**: Two different resources generating the same rate limit key. One affects the other.
- **Cache eviction of rate limit keys**: Redis evicts rate limiter keys under memory pressure — counters reset, limit bursts occur.
- **Rate limit release delay too short**: Job is released back to queue 1 second before the window resets. It runs again and hits the limit — no progress.
- **Chronic rate limiting**: If the API's rate limit is lower than job dispatch rate, the queue fills with rate-limited jobs waiting to release — all consuming cache slots.

# Ecosystem Usage
- **Laravel framework**: `Illuminate\Queue\Middleware\RateLimited` and `RateLimitedWithRedis` are built-in.
- **Laravel Horizon**: Rate-limited jobs appear in the dashboard with "released" status. No special Horizon handling.
- **Spatie webhook-server**: Uses rate limiting internally for webhook dispatch. The `RateLimited` middleware pattern applies to custom webhook jobs.

# Related Knowledge Units
- K051 `ThrottlesExceptions` Middleware (complementary) | K076 `RateLimiter` Facade (underlying API) | K053 Spatie Rate-Limited Job Middleware (alternative)

## Research Notes
- Job middleware in Laravel is a pipeline pattern applied at the worker level before the job's handle() method — this is architecturally distinct from HTTP middleware which wraps the request-response cycle.
- The WithoutOverlapping middleware uses a cache lock to prevent concurrent execution of the same job — this lock must be manually released if a job fails before completion, as the lock is held until the job finishes (or times out).
- Rate-limited job middleware leverages Laravel's RateLimiter facade with Redis as the backing store — the key is typically "{job-class}:{job-id}" and the limit resets based on the configured decay interval.
- Community packages like spatie/laravel-rate-limited-job-middleware provide declarative rate limiting via job properties, reducing boilerplate compared to implementing within the job class.
- The ShouldBeUnique contract (Laravel 10+) creates a uniqueness lock before job dispatch — the lock TTL is configured via uniqueFor property, and expired unique locks are automatically released.
- Custom job middleware is created via the middleware() method on the job class, returning an array of middleware instances — the handle(, ) pattern is identical to HTTP middleware.
- Job middleware executes in the queue worker process, not in the dispatching process — this distinction matters for debugging and logging context.
- Multiple middleware on a single job execute in the order returned by the middleware() method — ordering matters when middleware depends on side effects of another.
