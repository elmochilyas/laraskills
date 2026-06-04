# Metadata
Domain: Async & Distributed Systems
Subdomain: Retry & Failure Handling
Knowledge Unit: Ignoring Missing Models in Failed Jobs
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
When a job using `SerializesModels` processes a model that was deleted between dispatch and execution, the deserialization silently sets the model property to `null`. Subsequent method calls on that property throw an error, causing the job to fail. Laravel provides the `ShouldDeleteMissing` trait to automatically delete jobs whose models don't exist during deserialization, and the support for ignoring missing models in failed jobs via `deleteWhenMissingModels` property. This prevents jobs from exhausting retries on a permanent condition — the model is gone and will never come back.

# Core Concepts
- **`SerializesModels` behavior**: On deserialization, models are re-fetched via `Model::find($id)`. If the model was deleted, `find()` returns `null`.
- **`ShouldDeleteMissing`**: A trait that, when applied to a job, causes the job to be automatically deleted if any of its serialized models return `null` during deserialization.
- **`deleteWhenMissingModels`**: A property on the job class. When `true`, the job is deleted instead of failing when a model is missing.
- **`ModelNotFoundException`**: The exception thrown when `findOrFail()` is used instead of `find()`. Jobs using `findOrFail()` fail immediately on missing models.
- **Graceful degradation**: Instead of failing, the job can skip processing when a model is missing (the model is null, handle checks for null and returns early).

# Mental Models
- **Expired ticket**: The model reference is like a ticket to an event. If the event was cancelled (model deleted) between buying the ticket and attending (job processing), the ticket is worthless. `ShouldDeleteMissing` means you throw away the worthless ticket instead of trying to use it repeatedly.
- **Foundational failure**: If the data doesn't exist, the job can't do its job. Continuing to retry is futile — it's not a transient error, it's a permanent condition.

# Internal Mechanics
- On job deserialization, `SerializesModels::__wakeup()` calls `$identifier->resolve()` for each model property.
- `ModelIdentifier::resolve()` calls `$class::find($id)`.
- If `find()` returns `null`, the property is set to `null`.
- If the job uses `ShouldDeleteMissing`: during deserialization, if any model returns null, the job marks itself for deletion — it calls `$this->delete()` instead of proceeding.
- `deleteWhenMissingModels` is checked in the `SerializesModels` trait's `__wakeup()`.
- If the job does NOT use either mechanism, the null model flows to `handle()`. If `handle()` calls `$model->someMethod()`, a `Call to a member function on null` error occurs.

# Patterns
## Guard with Null Check
- **Purpose**: Check if the model is null at the start of `handle()`.
- **Benefit**: Explicit handling — log the missing model, skip processing.
- **Tradeoff**: Boilerplate in every job; easy to forget.

## Centralized Missing Model Logging
- **Purpose**: Log all instances where jobs are deleted due to missing models.
- **Benefit**: Detect patterns — why are models being deleted before job processing?
- **Tradeoff**: Additional logging infrastructure.

## `ShouldDeleteMissing` for Deletable Jobs
- **Purpose**: Automatically clean up jobs whose models no longer exist.
- **Benefit**: Zero code in job; no wasted retry attempts.
- **Tradeoff**: Silent deletion — no failure visibility unless logged.

# Architectural Decisions
- **Use `ShouldDeleteMissing` for**: Jobs that process user-generated content (posts, comments) where deletion is expected before processing.
- **Use `deleteWhenMissingModels` for**: Jobs where you want the deletion behavior but don't want to import the trait.
- **Use explicit null checks for**: Jobs where missing model should be logged or counted as a metric, not silently skipped.
- **Avoid both for**: Jobs where a missing model is always a bug (shouldn't happen) and should always alert.

# Tradeoffs
`ShouldDeleteMissing` | Automatic, no code, no retries | Silent; no visibility into pattern
Null check in handle | Explicit logic, can log/metric | Boilerplate per job; easy to forget
Neither (exception on null) | Immediate failure visibility | Wasted retries; noise in failure logs

# Performance Considerations
- `ShouldDeleteMissing` check is part of deserialization — no additional queries beyond the model `find()`.
- Preventing retries saves worker time and queue capacity.
- No memory or storage overhead.

# Production Considerations
- Monitor the rate of jobs deleted via `ShouldDeleteMissing`. A spike may indicate a race condition — jobs dispatched before model deletion.
- Log the missing model ID and class for debugging. The trait doesn't log by default.
- For jobs with multiple serialized models, if ANY model is missing, the entire job is deleted. This may hide partial failures.
- `ShouldDeleteMissing` only checks models serialized via `SerializesModels`. Explicitly passed IDs that fail to re-fetch in `handle()` are not covered.

# Common Mistakes
- **Not using `ShouldDeleteMissing` for jobs with serialized models**: The job retries on every missing model, wasting 3-10 attempts before finally failing.
- **Assuming `ShouldDeleteMissing` prevents all null-related errors**: It only guards the deserialization phase. If a job re-fetches data from the DB in `handle()` and the model was just deleted, it still fails.
- **Not logging when `ShouldDeleteMissing` activates**: The job is silently deleted. No trace in logs or metrics. Add logging.
- **Using `deleteWhenMissingModels` with `false` but not checking for null**: The job proceeds with null models and crashes on first property access.

# Failure Modes
- **Partial null model array**: A job with 10 serialized models — if 1 is missing, all 10 are re-fetched. The 9 remaining succeed, the 1 missing causes the job to fail. The 9 successful re-fetches are wasted.
- **Race condition on model creation**: Job is dispatched with a model reference, the model is deleted by another process before the job runs. The job fails even though the dispatch was correct.
- **Soft delete confusion**: `ShouldDeleteMissing` checks for existence. A soft-deleted model still exists (deleted_at is set but record is there). The job proceeds, but the model is logically deleted — may cause unexpected behavior.
- **`ShouldDeleteMissing` with `findOrFail` in `handle()`**: The job deserializes fine (model exists). Then `handle()` calls `Model::findOrFail($id)` — if deleted between deser and handle, it throws `ModelNotFoundException` even with the trait applied.

# Ecosystem Usage
- **Laravel framework**: `ShouldDeleteMissing` trait and `deleteWhenMissingModels` property are part of `Illuminate\Queue\` namespace.
- **Laravel Horizon**: Failed jobs due to missing models show up with null-related exception messages. The `ShouldDeleteMissing` mechanism prevents these from appearing in Horizon's failed job list.
- **Spatie packages**: Spatie webhook-server jobs may include serialized models — the same pattern applies.

# Related Knowledge Units
- K005 `SerializesModels` Trait (the mechanism that triggers this) | K016 Failure Taxonomy (where missing models fit in failure classification)

## Research Notes
- Laravel's failure taxonomy separates transient failures (network timeouts, deadlocks) from permanent failures (validation errors, missing models) — the 	ries and maxExceptions properties handle the former, while ailed() methods handle the latter.
- The etryUntil method takes precedence over 	ries when both are defined — the job will retry until the absolute timestamp, regardless of how many attempts that takes.
- Exponential backoff in Laravel uses a base delay doubled with each attempt: ackoff => [10, 20, 40, 80, 160] — the array length defines the number of attempts before the job fails permanently.
- The dead letter queue pattern is natively supported by SQS (via Redrive Policy) and RabbitMQ (via DLX), but Laravel does not have a built-in DLQ — community solutions involve separate queue connections for failed job inspection.
- Pruning failed jobs (ailed_jobs table) should be scheduled to prevent unbounded growth — model:prune with the Prunable trait on a custom failed job model can automate this.
- The ailed() method on jobs is called when all retry attempts are exhausted — it runs in the worker process and should be lightweight (logging, notification) to avoid delaying the worker.
- Idempotency patterns for job processing require a unique job identifier and a deduplication check before processing — this is critical for payment and notification jobs where duplicate execution has real-world consequences.
- Model hydration failures in queued jobs (Illuminate\Contracts\Database\ModelIdentifier) are silent — the job fails without clear error indication, often confused with timeout issues.
