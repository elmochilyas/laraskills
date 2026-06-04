# Rule Card: K054 — Custom Job Middleware Creation

---

## Rule 1

**Rule Name:** order-middleware-by-execution-flow

**Category:** Always

**Rule:** Always return middleware from `middleware()` in execution order — guards first, then preparation, then the job.

**Reason:** The first middleware in the array wraps the outermost layer — `WithoutOverlapping` should come before `Logging` so the lock is acquired before the log entry.

**Bad Example:**
```php
public function middleware(): array
{
    return [
        new LogExecutionTime,        // Logs lock acquisition — misleading
        new WithoutOverlapping(1),   // Lock acquired after logging
    ];
}
```

**Good Example:**
```php
public function middleware(): array
{
    return [
        new WithoutOverlapping(1),   // Lock acquired first
        new LogExecutionTime,        // Then log
    ];
}
```

**Exceptions:** Highly independent middleware with no ordering concerns can be in any order.

**Consequences Of Violation:** Side effects occur out of order — logging records a lock that hasn't been acquired yet, or timing data includes lock wait time incorrectly.

---

## Rule 2

**Rule Name:** call-next-exactly-once

**Category:** Always

**Rule:** Always call `$next($job)` exactly once in middleware.

**Reason:** Not calling it breaks the pipeline — the job never runs. Calling it twice runs the job twice.

**Bad Example:**
```php
public function handle(object $job, \Closure $next): void
{
    Log::info('Running job');
    // Missing $next($job) — pipeline breaks, job never executes
}
```

**Good Example:**
```php
public function handle(object $job, \Closure $next): void
{
    Log::info('Running job');
    $next($job); // Single call — proper pipeline flow
}
```

**Exceptions:** Middleware that short-circuits (rate limit hit, lock not acquired) intentionally skips `$next($job)`.

**Consequences Of Violation:** Without the call, the job silently never runs — no error, no failed job, just a skipped execution. Double calls cause duplicate processing of business logic.

---

## Rule 3

**Rule Name:** never-swallow-exceptions-in-middleware

**Category:** Never

**Rule:** Never swallow exceptions in job middleware.

**Reason:** Swallowing an exception prevents the worker from marking the job as failed — the job appears to succeed.

**Bad Example:**
```php
public function handle(object $job, \Closure $next): void
{
    try {
        $next($job);
    } catch (Throwable $e) {
        Log::error('Job failed', ['error' => $e]);
        // Exception swallowed — job appears successful
    }
}
```

**Good Example:**
```php
public function handle(object $job, \Closure $next): void
{
    try {
        $next($job);
    } catch (Throwable $e) {
        Log::error('Job failed', ['error' => $e]);
        throw $e; // Re-throw — worker handles failure correctly
    }
}
```

**Exceptions:** Middleware that handles specific exceptions and recovers (e.g., retry on transient failure) may swallow the caught exception.

**Consequences Of Violation:** The job is marked as completed in the queue — no retry, no failed_jobs entry, no monitoring alert. The error is invisible to operators.

---

## Rule 4

**Rule Name:** keep-middleware-fast

**Category:** Always

**Rule:** Always keep job middleware fast — avoid heavy computation or I/O.

**Reason:** Middleware blocks the job pipeline synchronously — slow middleware delays all jobs using it.

**Bad Example:**
```php
public function handle(object $job, \Closure $next): void
{
    $this->slowApiCheck(); // 500ms API call every time — delays every job
    $next($job);
}
```

**Good Example:**
```php
public function handle(object $job, \Closure $next): void
{
    $start = microtime(true);
    $next($job);
    $duration = microtime(true) - $start;
    Log::info('Job completed', ['duration' => $duration]); // Fast — no heavy I/O
}
```

**Exceptions:** Infrastructure middleware that genuinely needs I/O (rate limit checks, lock acquisition) is acceptable — keep the I/O minimal.

**Consequences Of Violation:** A 500ms middleware check on a 1-second job adds 50% overhead — at 1000 jobs/hour, that's 500 seconds/hour of wasted middleware time.
