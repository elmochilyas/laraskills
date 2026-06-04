# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Middleware
Knowledge Unit: Spatie `laravel-rate-limited-job-middleware` Package
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Spatie's `laravel-rate-limited-job-middleware` package provides an alternative to Laravel's built-in `RateLimited` middleware with additional features: explicit configuration per job (intervals, strategy, release behavior), conditional application (control which job instances are rate-limited), and a cleaner API for defining rate limit schedules. It uses the same `RateLimiter` facade under the hood but offers more developer-friendly configuration. It's particularly useful when different instances of the same job class need different rate limiting behavior.

# Core Concepts
- **RateLimited middleware (Spatie)**: Configurable per job via `middleware()` method with `RateLimited::allowed()` or `RateLimited::times()`.
- **`allowed()`**: Define allowed calls per time period: `RateLimited::allowed(10)->everySeconds(30)`.
- **`times()`**: Alternative syntax: `RateLimited::times(10)->everySeconds(30)`.
- **`releaseAfterBackoff()`**: Customize the release delay when rate limited.
- **`releaseAfterSeconds()`**: Fixed release delay.
- **Conditional application**: `->when(fn ($job) => $job->shouldRateLimit())` to conditionally apply rate limiting.
- **Intervals**: Supports `everySeconds()`, `everyMinutes()`, `everyHour()`, `everyDay()`.

# Mental Models
- **Scheduled watering**: Laravel's built-in middleware is like a sprinkler timer (set it and forget it). Spatie's middleware is like a smart irrigation system (adjustable per zone, conditional based on weather).
- **Configurable guard**: A guard who follows a simple rule ("let N people in per minute") vs a guard with a checklist ("let N in per minute, but skip if it's raining and use a different limit on weekends").

# Internal Mechanics
- The package provides a `RateLimited` middleware class that implements `MiddlewareInterface`.
- Internally, it uses Laravel's `RateLimiter` facade — same `hit()`, `attempt()`, `tooManyAttempts()` methods.
- The key is generated from the job class FQCN and an optional scope (like Laravel's built-in).
- `releaseAfterBackoff()` uses `RateLimiter::availableIn($key)` to get seconds until reset.
- `releaseAfterSeconds()` uses a fixed value.
- Conditional application (`->when()`) evaluates a callable at execution time.
- The package adds no new infrastructure — it's a configuration layer over the built-in rate limiter.

# Patterns
## Conditional Rate Limiting
- **Purpose**: Rate limit only specific instances of a job.
- **Benefit**: Premium users get higher limits than free users.
- **Tradeoff**: Condition check per job execution; additional complexity.

## Release Backoff Stratified by Attempt
- **Purpose**: Vary release delay based on which rate limit bucket is hit.
- **Benefit**: First rate limit = short delay, subsequent = longer.
- **Tradeoff**: More complex configuration.

## Per-Resource Interval with Scoping
- **Purpose**: Different intervals based on job-scoped properties.
- **Benefit**: API key A: 100/min. API key B: 10/min.
- **Tradeoff**: Scoping logic per job.

# Architectural Decisions
- **Use Spatie middleware when**: You need per-instance conditional rate limiting, or prefer the explicit configuration syntax over Laravel's.
- **Use Laravel's built-in when**: Simple, uniform rate limiting is sufficient.
- **Use custom implementation when**: Rate limiting logic is complex enough to warrant a dedicated class.

# Tradeoffs
Spatie RateLimited | Clean syntax, conditional, flexible intervals | Extra dependency; another package to update
Laravel built-in RateLimited | First-party, no extra dependency | Less flexible; global or nothing
Custom rate limiter | Full control, no package | More code to write and maintain

# Performance Considerations
- Same underlying `RateLimiter` facade — identical cache overhead to Laravel's built-in.
- Conditional `when()` check adds negligible overhead (callable invocation).
- No additional Redis connections or operations beyond the built-in rate limiter.

# Production Considerations
- Package should be kept updated — it depends on internal Laravel rate limiter APIs.
- Test conditional logic thoroughly — a bug in the `when()` callback could disable rate limiting entirely.
- The package doesn't add new monitoring capabilities. Use same metrics as built-in rate limiting.
- Documentation is clear — refer to Spatie's readme for configuration details.

# Common Mistakes
- **Using both Spatie and Laravel rate limiters on the same job**: They operate independently. Two counters for the same underlying limit.
- **Not testing the `when()` callback**: If the callback always returns `false`, rate limiting is never applied. No error — just unlimited execution.
- **Assuming Spatie middleware works with non-cache rate limiters**: Both Spatie and Laravel `RateLimited` rely on cache-based `RateLimiter`. `RateLimiter` requires a cache store with atomic increments.
- **Forgetting to install the package**: `composer require spatie/laravel-rate-limited-job-middleware` is required.

# Failure Modes
- **Conditional rate limiting bypass**: `when()` callback throws an exception → middleware may not apply rate limiting → job runs unrestricted.
- **Package incompatibility with Laravel version**: The package uses internal RateLimiter APIs that may change between Laravel versions.
- **Rate limit key collision with built-in middleware**: If both Spatie and Laravel limiters are used on different jobs, their keys are independent. No collision.
- **`releaseAfterBackoff()` with null release time**: If `RateLimiter::availableIn()` returns 0 (window already reset), the job is released immediately — tight loop.

# Ecosystem Usage
- **Spatie**: `spatie/laravel-rate-limited-job-middleware` is part of the Spatie open-source package ecosystem.
- **Spatie webhook-server**: The webhook-server package uses its own retry strategy, not this middleware, but the rate limiting middleware is applicable to webhook jobs.
- **Laravel community**: The package is widely used as a more ergonomic alternative to Laravel's built-in rate limiting middleware.

# Related Knowledge Units
- K050 `RateLimited` Job Middleware (Laravel built-in) | K076 `RateLimiter` Facade (underlying API)

## Research Notes
- Job middleware in Laravel is a pipeline pattern applied at the worker level before the job's handle() method — this is architecturally distinct from HTTP middleware which wraps the request-response cycle.
- The WithoutOverlapping middleware uses a cache lock to prevent concurrent execution of the same job — this lock must be manually released if a job fails before completion, as the lock is held until the job finishes (or times out).
- Rate-limited job middleware leverages Laravel's RateLimiter facade with Redis as the backing store — the key is typically "{job-class}:{job-id}" and the limit resets based on the configured decay interval.
- Community packages like spatie/laravel-rate-limited-job-middleware provide declarative rate limiting via job properties, reducing boilerplate compared to implementing within the job class.
- The ShouldBeUnique contract (Laravel 10+) creates a uniqueness lock before job dispatch — the lock TTL is configured via uniqueFor property, and expired unique locks are automatically released.
- Custom job middleware is created via the middleware() method on the job class, returning an array of middleware instances — the handle(, ) pattern is identical to HTTP middleware.
- Job middleware executes in the queue worker process, not in the dispatching process — this distinction matters for debugging and logging context.
- Multiple middleware on a single job execute in the order returned by the middleware() method — ordering matters when middleware depends on side effects of another.
