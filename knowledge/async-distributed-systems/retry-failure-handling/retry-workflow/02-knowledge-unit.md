# Metadata
Domain: Async & Distributed Systems
Subdomain: Retry & Failure Handling
Knowledge Unit: Retry Workflow (`queue:retry`, Horizon Retry Button)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Failed jobs can be retried via `queue:retry` (individual or batch retry), `queue:retry-batch` (retry all failed jobs in a batch), or the Horizon dashboard retry button. These mechanisms re-dispatch the job from the stored `failed_jobs` record — the original payload is extracted, a new job instance is unserialized, and dispatched to the original connection and queue. Retry does NOT reset the attempt counter — the job's `attempts()` reflects its total across original and retried executions. Jobs retried from Horizon appear in the dashboard as new jobs with the same UUID.

# Core Concepts
- **`queue:retry {id}`**: Retries a specific failed job by UUID or `all` for all failed jobs.
- **`queue:retry-batch {batchId}`**: Retries all failed jobs within a specific batch.
- **Horizon retry**: Dashboard button that calls the equivalent of `queue:retry` for the selected failed job.
- **No attempt reset**: The retried job's attempt count continues from where it failed. `$job->attempts()` returns the total across all retries.
- **Payload preservation**: The original job payload is re-dispatched unchanged. Deployment changes may affect deserialization.

# Mental Models
- **Rewind and replay**: Retry is like rewinding a VHS tape and pressing play again. The tape (payload) is the same. The player (worker and application code) may have been updated.
- **Resuscitation**: Failed_jobs is the morgue. Retry is the defibrillator — it shocks the job back to life and sends it back to work. But the job doesn't forget its past attempts.

# Internal Mechanics
- `queue:retry` reads the failed job record from `failed_jobs`.
- It extracts the `payload` column — a JSON string containing the serialized job.
- The command calls `$jobInstanceFromPayload->retry()` (or dispatches the underlying job directly).
- The job is dispatched to the original `connection` and `queue` from the failed record.
- On re-failure, the job's `attempts()` includes the original attempts. If `$tries` was 3 and the job used 3 attempts before failing, the retry gives exactly 1 more attempt (the counter continues).
- `queue:retry-batch` finds the batch by ID, iterates `failed_job_ids`, and retries each.
- Horizon's retry button triggers the same underlying mechanism via the Horizon API.

# Patterns
## Automated Retry Pipeline
- **Purpose**: Periodically retry failed jobs without manual intervention.
- **Benefit**: Self-healing for transient failures that resolve over time.
- **Tradeoff**: Needs idempotency; can mask persistent failures.

## Selective Retry with Filtering
- **Purpose**: Retry only failures matching specific criteria (exception type, queue, time window).
- **Benefit**: Targeted recovery without retrying everything.
- **Tradeoff**: Manual operation; possible to miss some failures.

## Retry with Escalation
- **Purpose**: On N failed retries, escalate to DLQ instead of retrying again.
- **Benefit**: Automated triage: first retry set → normal, second set → alert, third set → pause.
- **Tradeoff**: Complex state management across retry cycles.

# Architectural Decisions
- **Use `queue:retry` for ad-hoc recovery**: Developer runs manually after investigating failure cause.
- **Use Horizon retry for operational convenience**: Quick button click during incident response.
- **Use automated retry pipelines with caution**: Only for well-understood transient failures. Append backoff delay during retry to avoid immediate re-failure.
- **Consider `queue:retry-batch` for batch recovery**: More efficient than retrying each job individually.

# Tradeoffs
Manual retry (CLI/Horizon) | Controlled, intentional recovery | Slow; requires human operator
Automated retry pipeline | Self-healing, no human needed | Can amplify issues; mask systemic problems
Retry without attempt reset | Preserves failure history, no infinite loops | Job gets fewer effective retries after retry

# Performance Considerations
- Retrying many jobs at once via `queue:retry all` can flood the queue. Consider `queue:retry` with specific IDs.
- Each retry dispatches a new queue job — same cost as a new job dispatch.
- Retrying a batch via `queue:retry-batch` re-dispatches only the failed jobs in that batch, preserving batch context.
- Horizon serializes retry operations through its internal Redis — high retry volume may impact Horizon's own Redis operations.

# Production Considerations
- Retried jobs inherit the original `retryUntil()` timestamp. If the deadline has passed, the retried job fails immediately.
- Monitor retry frequency — if the same jobs are being retried repeatedly, the underlying issue isn't resolved.
- After a deployment that changes job handling (timeout, backoff, tries), old failed jobs may behave differently on retry. Test a single retry first.
- `queue:retry all` without filtering can overwhelm the queue. Use caution in high-failure-volume scenarios.

# Common Mistakes
- **Assuming retry resets attempt count**: The retried job does NOT get fresh `$tries`. If a job failed after 3 attempts with `$tries=3`, retry gives it 1 more attempt (attempt 4). It may fail immediately with the same error.
- **Retrying without fixing the underlying cause**: If the same exception is thrown, the retry fails again immediately. Always investigate before retry.
- **Using `queue:retry all` on a large failed_jobs table**: Can dispatch thousands of jobs at once, overwhelming workers and downstream services.
- **Not considering payload age**: A job that failed 30 days ago may reference data that no longer exists. Retrying it may cause errors.

# Failure Modes
- **Immediate re-failure on retry**: The exception that caused the original failure is still present. The retried job fails again, creating a cycle of failures.
- **Attempt counter overflow with `retryUntil()`**: If `retryUntil()` was based on the original dispatch time, it's likely expired by the time of retry. The retried job fails immediately with "retryUntil time has passed."
- **Payload deserialization failure on retry**: If the job class was renamed or removed, the retry command cannot reconstruct the job. The retry itself fails.
- **Horizon retry button with stale data**: The Horizon dashboard may show a failed job that has been pruned from `failed_jobs`. Clicking retry returns an error.

# Ecosystem Usage
- **Laravel framework**: `QueuedCommand` for `queue:retry`. Uses `FailedJobProviderInterface` to read and retry.
- **Laravel Horizon**: Provides the retry button in the dashboard, calls the Horizon API endpoint, which calls `queue:retry` internally.
- **Spatie packages**: Spatie webhook-client can retry failed webhook processing via its own Artisan command `webhook-client:retry`.

# Related Knowledge Units
- K016 Failure Taxonomy (where retry fits in state machine) | K020 `failed_jobs` Table (source of retry data)

## Research Notes
- Laravel's failure taxonomy separates transient failures (network timeouts, deadlocks) from permanent failures (validation errors, missing models) — the 	ries and maxExceptions properties handle the former, while ailed() methods handle the latter.
- The etryUntil method takes precedence over 	ries when both are defined — the job will retry until the absolute timestamp, regardless of how many attempts that takes.
- Exponential backoff in Laravel uses a base delay doubled with each attempt: ackoff => [10, 20, 40, 80, 160] — the array length defines the number of attempts before the job fails permanently.
- The dead letter queue pattern is natively supported by SQS (via Redrive Policy) and RabbitMQ (via DLX), but Laravel does not have a built-in DLQ — community solutions involve separate queue connections for failed job inspection.
- Pruning failed jobs (ailed_jobs table) should be scheduled to prevent unbounded growth — model:prune with the Prunable trait on a custom failed job model can automate this.
- The ailed() method on jobs is called when all retry attempts are exhausted — it runs in the worker process and should be lightweight (logging, notification) to avoid delaying the worker.
- Idempotency patterns for job processing require a unique job identifier and a deduplication check before processing — this is critical for payment and notification jobs where duplicate execution has real-world consequences.
- Model hydration failures in queued jobs (Illuminate\Contracts\Database\ModelIdentifier) are silent — the job fails without clear error indication, often confused with timeout issues.
