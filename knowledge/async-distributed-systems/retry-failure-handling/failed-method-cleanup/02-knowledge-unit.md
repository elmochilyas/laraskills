# Metadata
Domain: Async & Distributed Systems
Subdomain: Retry & Failure Handling
Knowledge Unit: `failed()` Method on Jobs and Cleanup
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
The `failed()` method is called on a job class when the job permanently fails (exhausts all retries). It receives the original exception as a parameter and is the designated location for cleanup, compensation, and notification logic. Unlike `catch()` batch callbacks or middleware, `failed()` is part of the job class itself — it has access to the job's constructor properties, making it natural for per-job failure handling. The `failed()` method executes after the job is stored in `failed_jobs`, and its own exceptions are caught and logged but do not affect the failure state.

# Core Concepts
- **Trigger**: `failed(Throwable $e)` is called when `$tries` is exhausted, `retryUntil()` has passed, or `$this->fail()` was called.
- **Idempotency requirement**: `failed()` may be called multiple times in edge cases (worker crash after storing in failed_jobs but before marking as such). Must be safe to run more than once.
- **Exception handling**: If `failed()` throws an exception, it is caught and logged by the framework. The job remains in failed state.
- **Timing**: `failed()` runs after the job is logged in `failed_jobs` but before the `Queue::failing` event is dispatched in some versions.
- **Constructor property access**: `failed()` can access all properties set in the constructor — this is the primary advantage over separate failure handlers.

# Mental Models
- **Safety net**: `failed()` is the job's personal safety net — what to do when all retry attempts have been exhausted and the job has permanently failed.
- **Last will and testament**: The `failed()` method is the job's last will — it runs one final time to clean up resources, notify stakeholders, and leave the system in a known state.

# Internal Mechanics
- `Worker::failJob()` calls:
  1. `$job->markAsFailed()` — updates job state.
  2. `$this->failer->log(...)` — stores in failed_jobs.
  3. `$this->callJobFailedHandler($job, $e)` — calls `$job->failed($e)`.
  4. `$this->raiseFailedJobEvent($job, $e)` — dispatches `Queue::failing` event.
- `callJobFailedHandler()` catches any exception thrown by `failed()` and logs it. The job's failed state is unaffected.
- `failed()` receives the `$e` that caused the final failure. If multiple exceptions (maxExceptions), receives the last one.

# Patterns
## Compensating Action
- **Purpose**: Undo or compensate for partial work done before failure.
- **Benefit**: System returns to consistent state despite job failure.
- **Tradeoff**: Compensation must be idempotent; may fail itself.

## Contextual Alerting
- **Purpose**: Send notification with job-specific context about the failure.
- **Benefit**: Alerting includes the exact parameters and data that caused the failure.
- **Tradeoff**: Sensitive data may be exposed in alerting channels.

## Dead-Letter Queue Dispatch
- **Purpose**: Move the failed job to a dead-letter queue for manual inspection.
- **Benefit**: Preserves the job for later analysis without cluttering failed_jobs.
- **Tradeoff**: Extra infrastructure (DLQ queue, DLQ worker).

# Architectural Decisions
- **Use `failed()` for job-specific cleanup**: Resource release (file locks, temp files, API cleanup). Separates job failure from general failure handling.
- **Use `Queue::failing` event for global concerns**: Logging, metrics, admin notifications that apply to ALL failed jobs, not job-specific ones.
- **Avoid complex logic in `failed()`**: If `failed()` itself can fail (exception), the failure is silently lost. Keep it simple.

# Tradeoffs
Job-level `failed()` | Direct access to job properties, natural per-job cleanup | Not called for all failure paths (e.g., dispatch failure)
`Queue::failing` event | Global handler for all failures | No job-specific context; must inspect payload
Both combined | Comprehensive coverage | Two places to maintain; possible overlap

# Performance Considerations
- `failed()` is called once per permanently failed job. Negligible overhead for low-moderate failure rates.
- If `failed()` performs I/O (API calls, DB queries), it adds latency to the worker's failure cleanup cycle.
- Throwing in `failed()` doesn't affect the failure state but adds log noise.

# Production Considerations
- `failed()` should avoid side effects that can't be rolled back. Since `failed()` may be called multiple times, double effects are possible.
- Log the exception in `failed()` for diagnostic purposes, even if no other cleanup is needed.
- Monitor `failed()` execution time — slow cleanup delays the worker's return to processing.
- If `failed()` dispatches another job, that dispatch is synchronous and carries the same timeout risk.

# Common Mistakes
- **Not calling `parent::failed()` in subclasses**: If your job extends a base job that has cleanup in `failed()`, the parent's `failed()` must be explicitly called.
- **Assuming `failed()` is only called once**: Edge cases (worker crash after failed_jobs storage, retry from failed_jobs) may trigger `failed()` multiple times.
- **Throwing exceptions in `failed()`**: The exception is caught and logged, but it means the cleanup failed silently. `failed()` should catch its own exceptions.
- **Using `failed()` for logging that should be in middleware**: General logging (job class, queue, runtime) should be in job middleware, not `failed()`.

# Failure Modes
- **Exception in `failed()` is silently caught**: If `failed()` throws, the failure is logged but no automatic retry of the cleanup. Manual intervention required.
- **`failed()` not called for batch failures**: When a job fails inside a non-allowFailures batch, the batch is cancelled. The job's `failed()` is called, but the batch's `catch()` is also called — both must handle cleanup.
- **`failed()` on retried job from failed_jobs**: When `queue:retry` is used, the job is re-dispatched. If it fails again, `failed()` is called again — the same cleanup runs twice.
- **`failed()` with deleted model**: If the job used `SerializesModels` and the model was deleted, `failed()` may try to access a null model. Guard against this.

# Ecosystem Usage
- **Laravel framework**: `Worker::callJobFailedHandler()` wraps the `failed()` call in try/catch. Failure of `failed()` does not bubble.
- **Laravel Horizon**: Horizon's retry button calls `queue:retry` which re-dispatches the job. On subsequent failure, `failed()` is called again.
- **Spatie webhook-server**: Webhook jobs define `failed()` for logging and dead-letter management.

# Related Knowledge Units
- K016 Failure Taxonomy (where `failed()` fits) | K020 `failed_jobs` Table and DynamoDB Storage (where it's logged)

## Research Notes
- Laravel's failure taxonomy separates transient failures (network timeouts, deadlocks) from permanent failures (validation errors, missing models) — the 	ries and maxExceptions properties handle the former, while ailed() methods handle the latter.
- The etryUntil method takes precedence over 	ries when both are defined — the job will retry until the absolute timestamp, regardless of how many attempts that takes.
- Exponential backoff in Laravel uses a base delay doubled with each attempt: ackoff => [10, 20, 40, 80, 160] — the array length defines the number of attempts before the job fails permanently.
- The dead letter queue pattern is natively supported by SQS (via Redrive Policy) and RabbitMQ (via DLX), but Laravel does not have a built-in DLQ — community solutions involve separate queue connections for failed job inspection.
- Pruning failed jobs (ailed_jobs table) should be scheduled to prevent unbounded growth — model:prune with the Prunable trait on a custom failed job model can automate this.
- The ailed() method on jobs is called when all retry attempts are exhausted — it runs in the worker process and should be lightweight (logging, notification) to avoid delaying the worker.
- Idempotency patterns for job processing require a unique job identifier and a deduplication check before processing — this is critical for payment and notification jobs where duplicate execution has real-world consequences.
- Model hydration failures in queued jobs (Illuminate\Contracts\Database\ModelIdentifier) are silent — the job fails without clear error indication, often confused with timeout issues.
