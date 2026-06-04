# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Batching & Chaining
Knowledge Unit: `Batchable` Trait and Cancellation Checks
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
The `Batchable` trait provides a batched job with awareness of its parent batch, enabling cancellation checks, access to batch metadata, and self-cancellation. When a batch is cancelled (either by `$batch->cancel()` or by an unhandled job failure without `allowFailures()`), already-queued jobs in that batch can still run unless they check `$this->bail()` or use the `SkipIfBatchCancelled` middleware. The trait bridges job execution context with batch state, which is critical for implementing graceful cancellation in parallel workloads.

# Core Concepts
- **`batch()` method**: Returns the `Batch` object from the repository by reading `$this->batchId`. Calls `$this->batchRepository->find($this->batchId)`.
- **`cancelled()` method**: Returns `$this->batch()->cancelled()` — checks if `cancelled_at` is non-null on the batch row.
- **`bail()` method**: Calls `$this->delete()` on the job and returns `true` if the batch is cancelled. Used as a guard at the top of `handle()`.
- **`batchId` property**: Set by `PendingBatch::dispatch()` → `$batch->add($jobs)`. Persisted as part of the job payload.
- **`SkipIfBatchCancelled` middleware**: A job middleware that calls `$this->bail()` before the job executes. Apply via `middleware()` method.
- **`$batch->cancel()`**: Sets `cancelled_at` and `finished_at` on the batch row. Does not delete queued jobs.

# Mental Models
- **Recall button**: `cancel()` pulls the fire alarm. Jobs already running (in workers) won't hear it unless they check. Jobs still in the queue hear it when they start, via `bail()` or `SkipIfBatchCancelled`.
- **Message in a bottle**: The batch state is a message left at a central location. Each job checks this message when it starts. If the message says "cancelled," the job aborts.

# Internal Mechanics
- `$batch->cancel()` writes `cancelled_at = now()` to the DB row.
- `Batchable::bail()` calls `$this->batch()?->cancelled()`. If true, calls `$this->delete()` to remove the job from the queue, then returns `true`.
- `SkipIfBatchCancelled::handle($job, $next)` calls `if ($job->bail()) { return; }` before `$next($job)`.
- `Batchable::ensureSuccessfulBatchJobIsRecorded()` (called after `handle()`) checks `class_uses_recursive($command)` for `Batchable` before recording success.
- If the batch was cancelled during job execution, the success recording still runs — the job completed, so its completion is counted.

# Patterns
## Early Abort with `bail()`
- **Purpose**: Prevent CPU waste on cancelled batches.
- **Benefit**: Worker reclaims capacity immediately.
- **Tradeoff**: Cancelled job's failure is not tracked in batch (it deletes quietly).

## Guard with `SkipIfBatchCancelled`
- **Purpose**: Centralized cancellation check without code in each job.
- **Benefit**: Reduces boilerplate; consistent behavior across all batched jobs.
- **Tradeoff**: Applies to all jobs in a class; cannot conditionally skip the check.

## Batch Self-Cancellation
- **Purpose**: A job can cancel the entire batch on detecting an unrecoverable condition.
- **Benefit**: Fail-fast for the whole group when one job knows the operation is doomed.
- **Tradeoff**: Cancellation doesn't stop in-flight jobs — those still run.

# Architectural Decisions
- **Use `SkipIfBatchCancelled`** on: long-running batched jobs (media processing, API calls) where you don't want to waste time after cancellation.
- **Skip `bail()` check on**: idempotent jobs that should run even if cancelled (e.g., logging, cleanup).
- **Manual `bail()` check inside `handle()`**: For jobs where you want to decide mid-execution based on complex logic.

# Tradeoffs
`bail()` at start of handle | Fast abort, worker reclaims immediately | Extra DB query on every batched job
`SkipIfBatchCancelled` middleware | Zero code in job, consistent behavior | Cannot conditionally skip; applies to all instances
No cancellation check | Job runs even if cancelled | Wasted resources; possible side effects post-cancel

# Performance Considerations
- `$this->batch()` triggers a `find()` query — a primary key lookup on `job_batches` table. ~1ms per call.
- `bail()` calls `batch()` + reads `cancelled_at`. Two operations but negligible latency.
- If a job calls `batch()` multiple times (e.g., in `bail()` and later for progress), consider caching the Batch object.

# Production Considerations
- Cancellation does NOT prevent dispatch of pending batch jobs already in the queue. They remain queued until a worker picks them up and checks the cancellation state.
- The `cancelled()` check relies on DB state. If the DB is unavailable, `batch()` throws an exception, and the cancellation check may fail.
- A cancelled batch with `allowFailures()` may still have `cancelled_at` set — the cancellation mark is independent of the allowFailures setting.

# Common Mistakes
- **Calling `bail()` but not returning after**: `$this->bail()` returns `true` if cancelled. You must `return;` after calling it, or the job continues executing.
- **Assuming cancellation stops dispatched jobs**: Cancellation only sets a DB flag. Jobs already in the queue remain unless `bail()` or `SkipIfBatchCancelled` is applied.
- **Not using `SkipIfBatchCancelled` on post-cancel dispatched jobs**: If you dispatch a new batch job after cancellation (e.g., in a callback), the new job's batch context is the original batch. It respects cancellation.

# Failure Modes
- **`batch()` returns null**: If the batch was pruned from the DB before the job runs, `$this->batch()` returns `null`. `cancelled()` on null throws.
- **Race condition on cancellation timing**: A job checks `cancelled()`, sees `false`, starts processing, then another process cancels the batch. The job completes even though the batch is cancelled.
- **Orphaned batch after partial cancellation**: If some jobs in a cancelled batch succeed before cancellation, those completions update the batch state. The batch may finish with mixed cancelled/completed state.

# Ecosystem Usage
- **Laravel framework**: Used in `SendQueuedNotifications` when batch-dispatched notifications need to respect batch cancellation.
- **Laravel Horizon**: Batch jobs in Horizon dashboard show cancellation state.
- **Spatie packages**: Not directly related, but pattern is applicable to batched webhook delivery.

# Related Knowledge Units
- K008 Bus::batch Architecture (batch lifecycle) | K011 Batch Callbacks (interaction with cancelled state)

## Research Notes
- Job batches in Laravel use a Redis-backed BatchRepository that tracks batch state (total jobs, pending jobs, failures) — the atch:table Artisan command creates a migration for a database-backed fallback.
- The llowFailures method on a batch allows remaining jobs to continue processing even when some jobs in the batch fail — this is distinct from the catch callback which fires when any job fails.
- Batch of chains pattern (Bus::chunk) creates independent chains that each execute sequentially — failure in one chain does not affect other chains, unlike a single chain where failure stops execution.
- The Bus::batch and Bus::chain interaction has known limitations — chains within batches cannot have their own catch/finally callbacks, and batch-level callbacks fire independently of chain completion.
- Batch deployment hazards occur when pushing new batch-based code to production — running jobs from the old deployment may not recognize the new batch structure, causing orphaned batches.
- The Batchable trait provides cancel() and cancelled() methods for cooperative cancellation — the job must periodically check $this->batch()->cancelled() to support cancellation mid-execution.
- Batch state locking uses Laravel's cache lock to prevent race conditions on batch updates — Redis locks are recommended for high-throughput batch environments.
- Laravel 12 introduced the atchProgress() helper on job batches, providing a percentage-based progress indicator for real-time UI updates.
