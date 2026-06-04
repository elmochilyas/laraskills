# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K054 — Custom Job Middleware Creation
- **Knowledge ID:** K054
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Job Middleware
  - Laravel Source — `Illuminate\Contracts\Queue\Middleware`

---

# Overview

Job middleware allows wrapping custom logic around job execution without modifying `handle()`. Custom middleware implements `MiddlewareInterface` with a `handle($job, $next)` method. Middleware executes before the job (setup, checks), wraps execution (timing, logging), or runs after (cleanup, metrics). The pipeline is configured via the job's `middleware()` method and executed in array order.

---

# Core Concepts

- **`MiddlewareInterface`:** Contract with `handle(object $job, callable $next): void`.
- **Pipeline execution:** Middleware runs in the order returned by `middleware()`.
- **Before/after hooks:** Code before `$next($job)` runs before the job. Code after runs after.
- **Short-circuit:** Middleware can call `$job->release()` or `$job->delete()` instead of `$next($job)` to bypass execution.
- **Global middleware:** Registered via `Queue::middleware()` — applies to all jobs.

---

# When To Use

- Cross-cutting concerns (logging, metrics, authorization, rate limiting) that span multiple job types
- Encapsulating infrastructure logic separate from business logic
- Centralized error handling or monitoring

---

# When NOT To Use

- Business logic specific to one job — belongs in `handle()`
- Simple operations that don't need a separate class — use inline callbacks in `middleware()`
- Stateful middleware — middleware runs per-job; state leaks across jobs in the same worker

---

# Best Practices

- **Order matters — return middleware in execution order.** Guards first (rate limit, throttle), then preparation (timing), then the job. *Why: The first middleware in the array wraps the outermost layer — `WithoutOverlapping` should be before `Logging` so the lock is acquired before the log entry.*
- **Always call `$next($job)` exactly once.** Not calling it breaks the pipeline (job never runs). Calling it twice runs the job twice. *Why: The pipeline is a nested closure chain — skipping `$next()` means inner layers are never reached. Calling it twice doubles all side effects.*
- **Don't swallow exceptions in middleware.** Catch exceptions for side effects (logging, metrics) but always re-throw. *Why: Swallowing an exception prevents the worker from marking the job as failed — the job appears to succeed.*
- **Keep middleware fast.** Middleware blocks the job pipeline — slow middleware delays all jobs using it. *Why: Every microsecond in middleware is added to the job's total execution time.*
- **Use `make:job-middleware` (Laravel 11+) for scaffolding.** It generates the correct namespace and structure in `app/Queue/Middleware/`. *Why: Ensures consistent conventions and discoverability across the codebase.*

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not calling `$next($job)` | Pipeline broken | Job never executes | Always call `$next($job)` |
| Calling `$next($job)` twice | Side effects double | Job runs twice | Ensure single `$next()` call |
| Swallowing exceptions in catch | Catching without re-throwing | Job appears to succeed | Log then re-throw |
| Returning single instance from `middleware()` | Returns object instead of array | Runtime type error | Return `[new Middleware]` |

---

# Examples

```php
class TimingMiddleware
{
    public function handle(object $job, \Closure $next): void
    {
        $start = microtime(true);
        $next($job);
        $duration = microtime(true) - $start;
        Log::info('Job executed', ['class' => get_class($job), 'duration' => $duration]);
    }
}
```

---

# Related Topics

- **K050 RateLimited (K050)** — Built-in middleware example
- **K052 WithoutOverlapping (K052)** — Built-in middleware example
- **K090 make:job-middleware Command (K090)** — Scaffolding
