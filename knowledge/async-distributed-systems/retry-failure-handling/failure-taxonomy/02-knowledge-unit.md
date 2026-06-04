# Metadata
Domain: Async & Distributed Systems
Subdomain: Retry & Failure Handling
Knowledge Unit: Failure Taxonomy: Release / Exception / Fail
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Laravel categorizes job failures into three distinct types with different behaviors: **release** (explicit re-queue with delay), **exception** (automatic retry up to `$tries`), and **fail** (terminal with permanent storage). Understanding this taxonomy is essential because each type triggers different code paths: release returns the job to the queue immediately, exception decrements the attempt counter and may release after backoff, and fail moves the job to `failed_jobs` and calls `$job->failed()`. A job can progress through all three states: it may be released multiple times, then fail with an exception that exhausts tries, then be marked as permanently failed.

# Core Concepts
- **Release**: Job calls `$this->release($delay)`. The job is returned to the queue with `attempts++`. No exception is thrown. Used for controlled retry under specific conditions.
- **Exception**: `handle()` throws an uncaught exception. The worker catches it, decrements remaining tries (checks `$tries` and `$maxExceptions`), and releases the job with backoff or fails it.
- **Fail**: Terminal state. Job has exhausted all retries, OR `$this->fail()` was called explicitly. The job is moved to `failed_jobs` storage, and `failed()` method is invoked.
- **`$this->fail()`**: Explicit fail without consuming a retry attempt. Immediately moves job to failed state.

# Mental Models
- **Medical triage**: Release = "wait and see" (send patient home with instructions). Exception = "treat and retry" (give medication, check again). Fail = "declared dead" (move to morgue / failed_jobs).
- **Poker hand**: Release = fold early (minor issue). Exception = go to showdown (try to win, may lose). Fail = busted out of tournament (permanent).

# Internal Mechanics
- `Worker::process()` calls `$job->fire()`.
- If `fire()` returns normally: success path — `delete()`.
- If `fire()` throws: the exception is caught by `process()`.
- Worker calls `$this->markJobAsFailedIfAlreadyExceedsMaxAttempts()`: checks `$job->attempts() >= $job->maxTries()`.
- If below `$tries`: `$job->release($backoff)` — the job is re-queued with a delay.
- If at or above `$tries`: `$this->failJob()` → stores in `failed_jobs`, calls `$job->failed()`, dispatches `Queue::failing` event.
- `$maxExceptions` allows the job to fail up to that many times even if `$tries` is higher.
- `retryUntil()` overrides `$tries` — if `retryUntil` timestamp is in the past, the job fails regardless of attempt count.

# Patterns
## Release-Based Rate Limiting
- **Purpose**: Back off processing when API rate limits are hit.
- **Benefit**: Job retries itself later without consuming a "real" failure.
- **Tradeoff**: Over-releasing can hide systemic issues.

## Early Explicit Fail
- **Purpose**: Fail fast when job conditions are permanently unrecoverable.
- **Benefit**: Avoid wasting retry attempts on doomed jobs.
- **Tradeoff**: Must correctly distinguish transient from permanent errors.

## Conditional Fail Based on Exception Type
- **Purpose**: Map different exceptions to different failure paths.
- **Benefit**: Transient errors (timeouts) retry; permanent errors (validation) fail immediately.
- **Tradeoff**: Exception classification logic must be maintained.

# Architectural Decisions
- **Map exception types to retry behavior**: Connection timeouts → retry. HTTP 400 → fail. HTTP 429 → release with delay. HTTP 500 → retry with backoff.
- **Prefer explicit `$this->fail()` over uncaught exception for known unrecoverable conditions**: Makes intent clear and avoids wasting retries.
- **Use `release()` for business-logic-driven delays**: When you know the resource will be available after a specific time window.

# Tradeoffs
Release with delay | Controlled retry timing, no attempt consumed | Can hide systemic issues behind infinite release loops
Exception → retry | Automatic, no code needed | Consumes attempt; backoff may be wrong for the error type
Immediate fail | Fast failure detection, no wasted processing | Transient errors kill jobs unnecessarily

# Performance Considerations
- Each release cycle adds minimal overhead (re-queue + re-pop).
- Exception-triggered retries cost more because the exception must be thrown and caught.
- Fail path is the most expensive (DB insert + event dispatch + failed method call).
- Jobs that consistently take N attempts to process use N× the resources of a single processing.

# Production Considerations
- Monitor the ratio of releases to successful executions. High release rates indicate systemic issues.
- Log the reason for each release — distinguish "release for backoff" from "release for rate limit" in monitoring.
- Set alerts for fail rate exceeding a threshold. Zero failures is unrealistic, but a sudden spike requires investigation.
- The `failed()` method should be idempotent — it may be called multiple times for the same job in edge cases.

# Common Mistakes
- **Throwing an exception when `$this->release()` would be more appropriate**: Any throw is treated as a potential retry condition. For controlled backoff, `release()` is cleaner.
- **Using `$this->fail()` for transient errors**: `fail()` is terminal. If the error might resolve, let it retry via exception path.
- **Not distinguishing between `release()` and exception retry in logs**: Both result in re-queuing but for different reasons. Log the type for operational clarity.

# Failure Modes
- **Release → exception → release cycle**: If `release()` is called but the job also throws later in the same execution, the exception path overrides. The job may consume an attempt unexpectedly.
- **Infinite release loop**: A job that always calls `release()` without ever succeeding or failing. Consumes worker time indefinitely.
- **Silent fail with `$this->fail()` in middleware**: If middleware calls `fail()`, the job never enters the exception path. The failure may bypass logging.

# Ecosystem Usage
- **Laravel framework**: The taxonomy is embedded in `Worker::process()` and `Worker::markJobAsFailedIfAlreadyExceedsMaxAttempts()`.
- **Laravel Horizon**: Displays failure taxonomy per job — shows attempt count, next retry time, or permanent failure.
- **Spatie packages**: Webhook jobs use the exception taxonomies — transient HTTP failures retry, permanent failures move to dead letter.

# Related Knowledge Units
- K017 `$tries`, `$maxExceptions`, `retryUntil()` | K018 Backoff Strategies | K023 Dead-Letter Queue Pattern

## Research Notes
- Laravel's failure taxonomy separates transient failures (network timeouts, deadlocks) from permanent failures (validation errors, missing models) — the 	ries and maxExceptions properties handle the former, while ailed() methods handle the latter.
- The etryUntil method takes precedence over 	ries when both are defined — the job will retry until the absolute timestamp, regardless of how many attempts that takes.
- Exponential backoff in Laravel uses a base delay doubled with each attempt: ackoff => [10, 20, 40, 80, 160] — the array length defines the number of attempts before the job fails permanently.
- The dead letter queue pattern is natively supported by SQS (via Redrive Policy) and RabbitMQ (via DLX), but Laravel does not have a built-in DLQ — community solutions involve separate queue connections for failed job inspection.
- Pruning failed jobs (ailed_jobs table) should be scheduled to prevent unbounded growth — model:prune with the Prunable trait on a custom failed job model can automate this.
- The ailed() method on jobs is called when all retry attempts are exhausted — it runs in the worker process and should be lightweight (logging, notification) to avoid delaying the worker.
- Idempotency patterns for job processing require a unique job identifier and a deduplication check before processing — this is critical for payment and notification jobs where duplicate execution has real-world consequences.
- Model hydration failures in queued jobs (Illuminate\Contracts\Database\ModelIdentifier) are silent — the job fails without clear error indication, often confused with timeout issues.
