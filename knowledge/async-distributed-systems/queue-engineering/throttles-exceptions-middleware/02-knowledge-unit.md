# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Middleware
Knowledge Unit: `ThrottlesExceptions` Middleware
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
The `ThrottlesExceptions` middleware releases the job back to the queue when the number of exceptions thrown by a job exceeds a threshold within a time window. Unlike `RateLimited` (which prevents execution based on attempt count), `ThrottlesExceptions` reacts to failures — if the job throws too many exceptions in a short period, it backs off. This is useful for jobs that fail intermittently due to downstream instability, where you want to slow retries after a burst of failures but don't want to hard-limit execution.

# Core Concepts
- **Threshold and window**: Configured with `maxExceptions` per `decayMinutes`.
- **Exception counting**: Counts all uncaught exceptions from the job's `handle()` within the time window.
- **Release behavior**: When the threshold is exceeded, the job is released with a delay (time until window reset).
- **Backoff callback**: Optional callback `backoff($exception)` to customize the release delay based on the exception.
- **Distinct from `$maxExceptions`**: Job's `$maxExceptions` property controls when the job FAILS permanently. `ThrottlesExceptions` middleware releases (retry) when threshold exceeded.
- **Rate limiter backed**: Uses the same `RateLimiter` facade under the hood.

# Mental Models
- **Circuit breaker for jobs**: `ThrottlesExceptions` is like a circuit breaker that detects repeated failures. After N failures in M minutes, it backs off (opens the circuit) rather than continuing to hammer the failing service.
- **Automatic cooldown**: When a machine keeps breaking, you let it rest (cooldown period). `ThrottlesExceptions` forces the cooldown after detecting repeated breakage.

# Internal Mechanics
- Middleware wraps `$next($job)` in a try/catch.
- On exception:
  1. `$key = sha1($job::class . ':' . $job->uniqueId())`.
  2. Call `RateLimiter::hit($key, $decayMinutes)` — increment exception counter.
  3. If `RateLimiter::tooManyAttempts($key, $maxExceptions)` → release job with delay.
  4. Delay = seconds until window resets (or custom `backoff` callback result).
  5. If under threshold → re-throw the exception (normal failure handling).
- If no exception → `RateLimiter::clear($key)` — reset the exception counter on success.
- The window and threshold are per-job-instance (based on unique key), not global.

# Patterns
## Graceful Degradation for Downstream Outages
- **Purpose**: Detect when an external service is down and back off.
- **Benefit**: Reduce load on failing service; reduce log noise.
- **Tradeoff**: Delays processing for transient issues that may resolve before the next retry.

## Custom Backoff per Exception Type
- **Purpose**: Different delay lengths based on the exception.
- **Benefit**: Rate limit errors (429) get longer backoff than 500 errors.
- **Tradeoff**: Exception classification logic in middleware.

## Combined with RateLimited
- **Purpose**: Both proactive (rate limit) and reactive (exception throttle) protection.
- **Benefit**: Comprehensive coverage against both self-imposed limits and external failures.
- **Tradeoff**: Two independent throttling mechanisms; complex interaction.

# Architectural Decisions
- **Use `ThrottlesExceptions` for downstream API calls**: When jobs make HTTP requests, use this to handle server errors gracefully.
- **Use `RateLimited` for known API rate limits**: If the API documents a rate limit, use `RateLimited` proactively.
- **Apply `ThrottlesExceptions` after `RateLimited`**: In the middleware stack, `RateLimited` should run first (proactive check), then `ThrottlesExceptions` (reactive backup).
- **Set `decayMinutes` longer than the API's typical recovery time**: If a downstream service takes 5 minutes to recover from an outage, set the window to 5+ minutes.

# Tradeoffs
`ThrottlesExceptions` alone | Reactive — handles unknown rate limits | May delay jobs too aggressively on transient errors
`ThrottlesExceptions` + `RateLimited` | Both proactive + reactive | Two independent throttles; potentially conflicting delays
Custom backoff callback | Fine-grained control over delay length | More code; exception-specific logic

# Performance Considerations
- Exception counting via `RateLimiter::hit()` adds cache write per exception.
- Job released via throttle doesn't consume a queue retry attempt — it's a release, not a fail.
- The middleware adds minimal overhead (cache increment) on the exception path.

# Production Considerations
- The window (`decayMinutes`) should be long enough to span the expected recovery time of the downstream service.
- Monitor the "throttled exceptions" count separately from total job failures. A spike indicates downstream instability.
- The `backoff` callback can inspect the exception type. Use this for 429 (Too Many Requests) vs 503 (Service Unavailable) differentiation.
- Success resets the counter (`RateLimiter::clear`). A single success resets the throttle state completely.

# Common Mistakes
- **Setting too-low threshold**: 2 exceptions in 1 minute is too sensitive for a flaky service. The job constantly backs off.
- **Not using the `backoff` callback**: Without it, all exceptions get the same delay (time until window reset). 429 (rate limit) should back off differently than 503 (server error).
- **Confusing with `$maxExceptions`**: `$maxExceptions` on the job PERMANENTLY fails the job when exceeded. `ThrottlesExceptions` temporarily releases it. Both count exceptions.
- **Not checking for null in `backoff` callback**: If the exception is null, `$exception->getMessage()` throws a fatal error.

# Failure Modes
- **Throttle resets on success too quickly**: One successful job after N failures clears the counter. The next failure starts from scratch — the throttle doesn't provide persistent backoff.
- **False positive throttling**: A job that legitimately throws and catches exceptions (e.g., validation errors in processing flow) triggers the throttle. Use exception type filtering.
- **Exception in middleware itself**: If the `backoff` callback throws, the middleware fails. The job is released with no backoff (or default backoff).
- **Counter collision**: Multiple job instances sharing the same throttle key (e.g., same class, no unique ID) — one instance's success clears all counters, including other instances'.

# Ecosystem Usage
- **Laravel framework**: `Illuminate\Queue\Middleware\ThrottlesExceptions` built into Laravel.
- **Laravel Horizon**: Throttled jobs appear as released. No special dashboard treatment.
- **Spatie packages**: Spatie's `laravel-rate-limited-job-middleware` provides an alternative with explicit configuration for throttle behavior.

# Related Knowledge Units
- K050 `RateLimited` Job Middleware (complementary) | K016 Failure Taxonomy (context for exceptions)

## Research Notes
- Job middleware in Laravel is a pipeline pattern applied at the worker level before the job's handle() method — this is architecturally distinct from HTTP middleware which wraps the request-response cycle.
- The WithoutOverlapping middleware uses a cache lock to prevent concurrent execution of the same job — this lock must be manually released if a job fails before completion, as the lock is held until the job finishes (or times out).
- Rate-limited job middleware leverages Laravel's RateLimiter facade with Redis as the backing store — the key is typically "{job-class}:{job-id}" and the limit resets based on the configured decay interval.
- Community packages like spatie/laravel-rate-limited-job-middleware provide declarative rate limiting via job properties, reducing boilerplate compared to implementing within the job class.
- The ShouldBeUnique contract (Laravel 10+) creates a uniqueness lock before job dispatch — the lock TTL is configured via uniqueFor property, and expired unique locks are automatically released.
- Custom job middleware is created via the middleware() method on the job class, returning an array of middleware instances — the handle(, ) pattern is identical to HTTP middleware.
- Job middleware executes in the queue worker process, not in the dispatching process — this distinction matters for debugging and logging context.
- Multiple middleware on a single job execute in the order returned by the middleware() method — ordering matters when middleware depends on side effects of another.
