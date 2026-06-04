# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Middleware
Knowledge Unit: `make:job-middleware` Artisan Command
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
`php artisan make:job-middleware` (Laravel 11+) generates a custom job middleware class stub in `app/Queue/Middleware/`. The generated class includes the `handle($job, $next)` method with the standard pipeline pattern. This reduces boilerplate for creating custom middleware and enforces the correct interface implementation.

# Core Concepts
- **Namespace**: Generated in `App\Queue\Middleware\{MiddlewareName}`.
- **Stub content**: A class implementing the pipeline pattern with `handle($job, $next)`.
- **Usage**: Return an instance from the job's `middleware()` method.
- **Consistency**: The generated stub follows the same pattern as built-in middleware.

# Internal Mechanics
- The command calls `make:class` with a stub file from `stubs/job-middleware.stub`.
- The stub contains:
  ```php
  class MiddlewareName
  {
      public function handle(object $job, \Closure $next): void
      {
          // Before job execution
          $next($job);
          // After job execution
      }
  }
  ```
- The generated file is placed in `app/Queue/Middleware/` directory.
- The directory is auto-created if it doesn't exist.
- The `make:job-middleware` command was added in Laravel 11.

# Patterns
## Convention-Based Organization
- **Purpose**: Keep custom middleware in a standard location.
- **Benefit**: Discoverable, consistent with framework structure.
- **Tradeoff**: Adds file to project; boilerplate.

# Tradeoffs
Artisan-generated middleware | Correct structure, discoverable | Extra file; simple enough to write manually
Manual middleware | No generation step | Potential interface mismatch; varying structures

# Related Knowledge Units
- K054 Custom Job Middleware Creation (full creation guide)

## Research Notes
- Job middleware in Laravel is a pipeline pattern applied at the worker level before the job's handle() method — this is architecturally distinct from HTTP middleware which wraps the request-response cycle.
- The WithoutOverlapping middleware uses a cache lock to prevent concurrent execution of the same job — this lock must be manually released if a job fails before completion, as the lock is held until the job finishes (or times out).
- Rate-limited job middleware leverages Laravel's RateLimiter facade with Redis as the backing store — the key is typically "{job-class}:{job-id}" and the limit resets based on the configured decay interval.
- Community packages like spatie/laravel-rate-limited-job-middleware provide declarative rate limiting via job properties, reducing boilerplate compared to implementing within the job class.
- The ShouldBeUnique contract (Laravel 10+) creates a uniqueness lock before job dispatch — the lock TTL is configured via uniqueFor property, and expired unique locks are automatically released.
- Custom job middleware is created via the middleware() method on the job class, returning an array of middleware instances — the handle(, ) pattern is identical to HTTP middleware.
- Job middleware executes in the queue worker process, not in the dispatching process — this distinction matters for debugging and logging context.
- Multiple middleware on a single job execute in the order returned by the middleware() method — ordering matters when middleware depends on side effects of another.

## Mental Models

- **Job middleware as pipeline filters**: Job middleware operates like HTTP middleware but in the queue worker context. Each middleware in the chain wraps the job's handle() method, executing code before and after the job runs. Think of it as onion layers around the core job logic.
- **Middleware as cross-cutting concerns**: Rate limiting, locking (without overlapping), logging, and profiling are concerns that apply across multiple job types. Middleware extracts these from individual job classes into reusable, testable units.
- **Pipeline pattern**: The queue worker processes middleware in the order returned by the middleware() method. Each middleware receives the job and a  closure. Calling () passes control to the next middleware or the job's handle() method. Returning without calling  short-circuits the pipeline.
- **Generation as convention enforcement**: The make:job-middleware Artisan command enforces the correct interface and namespace convention, ensuring all middleware follows the same pattern. This reduces variability and makes middleware discoverable in a standard location.

## Architectural Decisions

- **Decision**: Inline middleware vs. dedicated middleware class
  - Context: Simple middleware logic (single job, one-time use) vs. reusable middleware (multiple jobs, cross-cutting)
  - Consequence: Inline adds coupling between job and concern; dedicated class enables reuse and independent testing
- **Decision**: Artisan-generated vs. manual middleware creation
  - Context: make:job-middleware enforces conventions; manual creation allows custom structure
  - Consequence: Generated middleware follows framework conventions and is auto-discoverable; manual allows non-standard patterns but misses consistency benefits
- **Decision**: Middleware vs. trait for cross-cutting concerns
  - Context: Middleware executes outside the job (pipeline); traits add behavior inside the job class
  - Consequence: Middleware provides clean separation and testability; traits provide direct access to job internals but increase coupling

## Performance Considerations

- **Middleware overhead**: Each middleware in the pipeline adds microseconds of overhead for the closure dispatch. For most workloads this is negligible. For high-throughput queues (>1000 jobs/second), minimize middleware chain length.
- **Lock-based middleware (WithoutOverlapping)**: Acquires and holds a cache lock for the job duration. Lock acquisition adds 1-5ms per job. On lock contention, jobs are released back to the queue, causing retry overhead. Tune eleaseAfter to balance retry frequency with lock wait time.
- **Rate-limited middleware**: Uses Laravel's RateLimiter facade, which typically hits Redis for each attempt. Each rate-limited job adds 2-10ms for rate limit checking. For high-frequency jobs, batch-check rate limits or use a local counter with periodic sync.
- **Memory consumption**: Middleware objects are instantiated once when the middleware() method is called on the job instance. Memory impact is proportional to middleware complexity. Keep middleware stateless to minimize per-job memory footprint.
- **Serialization**: Job middleware is serialized with the job when dispatched. Avoid closures, resources, or heavy objects in middleware that would bloat the serialized job payload.

## Production Considerations

- **Middleware order matters**: Return middleware from the middleware() method in the desired execution order. The first middleware wraps the outermost layer. Standard ordering: WithoutOverlapping (outermost) → RateLimited → Logging → Profiling → Job execution.
- **Lock expiry for WithoutOverlapping**: The cache lock TTL must be longer than the maximum expected job duration. If the lock expires before the job completes, a duplicate job can start. Monitor actual job durations and set lock TTL to 2x the p99 duration.
- **Rate limit key strategy**: Use granular rate limit keys to avoid cross-tenant interference. Include job class, tenant ID, or queue name in the rate limit key. Monitor rate limit hit rates in production to tune limits.
- **Monitoring**: Track middleware-specific metrics: WithoutOverlapping lock wait time, rate limit hit counts, and middleware execution duration per job class. Set alerts for excessive lock waits or rate limit saturation.
- **Logging context**: Add middleware context to job logs (lock duration, rate limit status, retry number) to facilitate debugging. Use structured logging with consistent context keys across all middleware.
- **Testing middleware in isolation**: Test each middleware independently using unit tests that mock the  closure. Integration tests should verify middleware ordering and interaction with job execution.

## Common Mistakes

- **Incorrect middleware return order**: Middleware executes in the order returned by the middleware() method. Returning WithoutOverlapping after a rate-limiting middleware means the rate limit check happens before the lock check, potentially rate-limiting retries that would otherwise wait for the lock.
- **Not releasing WithoutOverlapping lock on failure**: If a job middleware catches an exception without releasing the lock, subsequent jobs are permanently blocked. Ensure lock release happens in a finally block or use ShouldQueue's failed() method for cleanup.
- **Serializing closures in middleware**: Middleware that captures closures (for logging or callbacks) may not serialize correctly for queue transport. Keep middleware data serializable — avoid closures, anonymous functions, and resource references.
- **Over-engineering simple middleware**: Creating a dedicated middleware class for a one-line operation (e.g., simple logging) adds unnecessary complexity. Use inline callbacks in the middleware() method for trivial concerns.
- **Missing timeouts on rate limiters**: Rate limiters without configured decay intervals can permanently block jobs after exceeding the limit. Always specify both maxAttempts and decayMinutes in rate limiter definitions.
- **Middleware state leakage**: If middleware holds mutable state, concurrent execution of the same job class can cause state corruption. Keep middleware stateless or use per-instance state that is reset for each job.

## Failure Modes

- **Deadlock with WithoutOverlapping**: If two jobs with the same middleware key are dispatched simultaneously and each holds a lock another needs, deadlock occurs. Design middleware keys to avoid cross-dependency. Use unique per-job-type lock keys.
- **Rate limit key collision**: Different job classes using the same rate limit key cause cross-class throttling. Always scope rate limit keys by job class: RateLimiter::for("job:{}").
- **Middleware exception swallows job failure**: A middleware that catches exceptions without re-throwing prevents the job from being marked as failed. Always re-throw exceptions after middleware-side effects (logging, metrics) are complete.
- **Cache driver failure**: WithoutOverlapping and rate-limited middleware depend on the cache driver (typically Redis). Cache outage causes all middleware-dependent jobs to fail. Implement fallback behavior (e.g., skip locking if cache unavailable, with alerting).
- **Serialization failure on retry**: Jobs with serialized middleware classes may deserialize incorrectly after a queue restart or code deployment. Test middleware serialization round-trip in CI/CD and ensure middleware classes are autoloadable.
- **Memory leak in middleware**: Middleware that accumulates state across job executions (e.g., appending to an array in a long-running worker) causes memory leaks. Verify middleware is stateless or properly resets state between jobs.

## Ecosystem Usage

- **Laravel built-in middleware**: Laravel ships with several production-ready job middleware: WithoutOverlapping (prevents concurrent execution of the same job), RateLimited (applies rate limits per job class), and ThrottlesExceptions (retries with backoff on exceptions).
- **Community packages**: spatie/laravel-rate-limited-job-middleware provides declarative rate limiting via job properties. loophp/laravel-job-middleware offers additional middleware patterns for logging, profiling, and tracing.
- **Usage patterns**: WithoutOverlapping is commonly used for billing jobs, data sync jobs, and any operation that must not run concurrently. RateLimited is used for API-calling jobs, third-party integration workers, and email sending jobs.
- **Laravel Horizon**: Queue monitoring dashboard provides visibility into job middleware execution. Horizon's tags can be used with middleware to add searchable metadata to jobs for debugging and monitoring.
- **Testing integration**: Laravel's queue faking (Queue::fake()) and HTTP testing utilities allow middleware behavior to be verified in isolation. Custom middleware should include both unit tests (pipeline logic) and integration tests (queue interaction).
