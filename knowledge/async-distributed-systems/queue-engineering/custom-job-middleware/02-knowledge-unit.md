# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Middleware
Knowledge Unit: Custom Job Middleware Creation
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Job middleware allows wrapping custom logic around job execution without modifying the job's `handle()` method. Custom middleware is created by implementing the `MiddlewareInterface` contract with a `handle($job, $next)` method. Middleware can execute before the job (setup, checks), wrap the job execution (timing, logging), or execute after (cleanup, metrics). The middleware pipeline is configured via the job's `middleware()` method and executed in the returned array order.

# Core Concepts
- **`MiddlewareInterface`**: Contract with `handle(object $job, callable $next): void`.
- **Pipeline execution**: Middleware runs before `$job->handle()` in the order returned by `middleware()`.
- **Before/after hooks**: Code before `$next($job)` runs before the job. Code after runs after.
- **Short-circuit**: Middleware can call `$job->release()` or `$job->delete()` instead of `$next($job)` to bypass execution entirely.
- **`make:job-middleware`**: Artisan command (Laravel 11+) to generate middleware boilerplate.

# Mental Models
- **Onion layers**: The job is the onion core. Middleware wraps around it like layers. Each layer can inspect, modify, or block access to the core.
- **Security checkpoint**: Before entering the building (job execution), you pass through security checks (middleware). One check can deny entry (release/delete the job).

# Internal Mechanics
- `Illuminate\Queue\Jobs\Job::resolveAndFire()` calls `$this->throughMiddleware($job, $this->middleware)`.
- The middleware array is built from 1) global queue middleware (registered via `Queue::middleware()`), 2) job instance's `middleware()` method.
- Pipeline execution: first middleware → second middleware → ... → `handle()`.
- Middleware receives the job object (not the underlying queue job — the application job class).
- `$next($job)` continues to the next middleware or `handle()`.
- Middleware can throw exceptions → caught by worker's failure handling.
- Middleware can call `$job->release()` or `$job->delete()` → job lifecycle continues without `handle()`.

# Patterns
## Timing Middleware
- **Purpose**: Measure and log job execution time.
- **Benefit**: Per-job timing without modifying handle().
- **Tradeoff**: Overhead of timing capture.

## Logging Middleware
- **Purpose**: Log job start, completion, parameters.
- **Benefit**: Centralized logging without per-job code.
- **Tradeoff**: Log volume; PII exposure.

## Circuit Breaker Middleware
- **Purpose**: Prevent job execution if downstream is unhealthy.
- **Benefit**: Fail fast without consuming retry attempts.
- **Tradeoff**: Circuit breaker state management; false positives.

# Architectural Decisions
- **Use middleware for cross-cutting concerns**: Logging, metrics, authorization, rate limiting. Things that span multiple job types.
- **Avoid middleware for job-specific logic**: Business logic belongs in `handle()`.
- **Keep middleware fast**: Middleware blocks the job pipeline. Slow middleware delays all jobs using it.
- **Order matters**: Return middleware in execution order. Guards first (rate limit, throttle), then preparation (timing), then job.

# Tradeoffs
Custom middleware | Centralized, reusable, testable | Pipeline overhead; debugging complexity
Inline logic in handle() | Simple, obvious, no extra layer | Code duplication; mixing concerns
Global middleware | Applied to ALL jobs automatically | Cannot easily exclude specific jobs

# Performance Considerations
- Each middleware adds function call overhead (~0.001ms).
- The pipeline is a nested closure — deep middleware stacks (10+) increase stack depth minimally.
- Heavy middleware (DB queries, API calls) directly adds to job execution time.
- `$job->release()` from middleware returns the job without executing `handle()`. Saves time for blocked jobs.

# Production Considerations
- Test middleware in isolation: unit test the middleware's `handle()` method directly.
- Log middleware execution time in production. Slow middleware is a performance bottleneck.
- Global middleware registered via `Queue::middleware()` applies to ALL jobs. Use judiciously.
- Middleware can access the job's properties — use this for context (user ID, resource key).
- The `make:job-middleware` command (Laravel 11+) generates the boilerplate class structure.

# Common Mistakes
- **Not calling `$next($job)`**: Middleware that doesn't call `$next()` breaks the pipeline. The job never runs.
- **Calling `$next($job)` twice**: A middleware that calls `$next()` twice runs the job pipeline twice. Side effects double.
- **Modifying job state before `$next($job)`**: If middleware modifies job properties, the job sees modified state. Not always intended.
- **Swallowing exceptions in middleware**: Catching and not re-throwing exceptions suppresses job failure handling. The job appears to succeed.
- **Registration via `middleware()` returns wrong type**: Must return an array of middleware instances, not a single instance.

# Failure Modes
- **Middleware throws an exception**: Caught by worker. Job fails normally (retries or fails). Middleware is not retried separately.
- **Middleware deadlock**: A middleware that acquires a lock (without timeout) and never releases. Job hangs until worker timeout.
- **Global middleware affecting unintended jobs**: `Queue::middleware()` applies to ALL jobs. A middleware meant for one job type affects all.
- **Middleware state leak**: Middleware that stores state in memory (static variable) affects subsequent jobs in the same worker process.

# Ecosystem Usage
- **Laravel framework**: Built-in middleware (`RateLimited`, `ThrottlesExceptions`, `WithoutOverlapping`) demonstrate the pattern.
- **Laravel Horizon**: Horizon adds its own internal middleware for job tracking and metrics.
- **Spatie packages**: Spatie's rate-limited job middleware is a custom middleware that follows the same pattern.

# Related Knowledge Units
- K050 `RateLimited` (built-in example) | K052 `WithoutOverlapping` (built-in example) | K090 `make:job-middleware` Command (scaffolding)

## Research Notes
- Job middleware in Laravel is a pipeline pattern applied at the worker level before the job's handle() method — this is architecturally distinct from HTTP middleware which wraps the request-response cycle.
- The WithoutOverlapping middleware uses a cache lock to prevent concurrent execution of the same job — this lock must be manually released if a job fails before completion, as the lock is held until the job finishes (or times out).
- Rate-limited job middleware leverages Laravel's RateLimiter facade with Redis as the backing store — the key is typically "{job-class}:{job-id}" and the limit resets based on the configured decay interval.
- Community packages like spatie/laravel-rate-limited-job-middleware provide declarative rate limiting via job properties, reducing boilerplate compared to implementing within the job class.
- The ShouldBeUnique contract (Laravel 10+) creates a uniqueness lock before job dispatch — the lock TTL is configured via uniqueFor property, and expired unique locks are automatically released.
- Custom job middleware is created via the middleware() method on the job class, returning an array of middleware instances — the handle(, ) pattern is identical to HTTP middleware.
- Job middleware executes in the queue worker process, not in the dispatching process — this distinction matters for debugging and logging context.
- Multiple middleware on a single job execute in the order returned by the middleware() method — ordering matters when middleware depends on side effects of another.
