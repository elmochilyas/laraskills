# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Batching & Chaining
Knowledge Unit: Batch Callbacks (before/progress/then/catch/finally)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Laravel batches expose five lifecycle callbacks: `before()` (runs after batch creation but before job dispatch), `progress()` (runs after each successful job), `then()` (all jobs succeeded), `catch()` (any job failed after exhausting retries), and `finally()` (batch finished regardless of outcome). Callbacks are serialized closures stored in the `options` column of `job_batches`, executed by a worker when the triggering condition is met. The most critical nuance is that `finally()` only fires when all jobs have run exactly once — this condition fails for partially-dispatched chains within batches, a known edge case.

# Core Concepts
- **`before()`**: Runs after batch DB row is created but before any job dispatches. Useful for pre-flight checks, resource allocation.
- **`progress()`**: Runs after each successful individual job. Receives `Batch`. Useful for progress tracking (e.g., WebSocket updates).
- **`then()`**: Runs when all jobs succeed and `pending_jobs` reaches 0. Does NOT run if any job failed.
- **`catch()`**: Runs when the batch finishes with failures AND `failed_jobs > 0`. Receives `Batch` and `Throwable`.
- **`finally()`**: Runs when `pending_jobs - failed_jobs === 0` (all jobs ran exactly once). Runs regardless of success/failure.
- **Callback serialization**: All callbacks are serialized via `serialize()` and stored in the `options` column.

# Mental Models
- **try/catch/finally**: `then()` = try block success, `catch()` = caught exception, `finally()` = always runs. But the analogy breaks: `finally()` has the "ran exactly once" condition.
- **Olympics medals**: `then()` = gold ceremony (all winners), `catch()` = consolation (some lost), `finally()` = closing ceremony (happens regardless).

# Internal Mechanics
- Callbacks are stored as `$batch->options['callbacks']` (or similar internal structure) in `PendingBatch`.
- `PendingBatch::dispatch()` serializes the options via `$repository->store($this)`.
- `recordSuccessfulJob()` checks `pendingJobs === 0`, then runs `then()` (if no failures) and `finally()` (always).
- `recordFailedJob()` is called after the job exhausts its retries. It increments `failed_jobs`, then on batch finish fires `catch()` and `finally()`.
- `before()` fires at dispatch time, in the calling process, not in a worker.
- `progress()` fires inside the worker after each successful job completion.
- The `finally()` condition is checked in `UpdatedBatchJobCounts::allJobsHaveRanExactlyOnce()`: `($this->pendingJobs - $this->failedJobs) === 0`.

# Patterns
## Progress-Reporting Batch
- **Purpose**: Update a frontend progress bar for long-running batch operations.
- **Benefit**: User sees live progress for import/export operations.
- **Tradeoff**: Progress callback fires per job; increases callback execution overhead.

## Conditional Post-Processing
- **Purpose**: Run cleanup only if batch failed, not on success.
- **Benefit**: `catch()` triggers rollback, `then()` does nothing extra.
- **Tradeoff**: Serialized callbacks, deployment hazard.

## Safe Cleanup via finally()
- **Purpose**: Release resources regardless of outcome.
- **Benefit**: Guaranteed cleanup (in theory).
- **Tradeoff**: Known bug: `finally()` not firing on mid-chain failure in batch-of-chains.

# Architectural Decisions
- **Use `finally()` for resource cleanup**: File locks, temp directories, semaphores. But be aware of the `allJobsHaveRanExactlyOnce` limitation.
- **Use `then()` + `catch()` over `finally()`**: More explicit about success vs failure paths. Combine with `allowFailures()` for comprehensive coverage.
- **Avoid serialized closures for complex logic**: Closures should be thin — dispatch a new job for complex post-batch work.

# Tradeoffs
Serialized callbacks | Survive worker restarts; stored durably | Deployment hazard; cannot reference `$this`
`finally()` for cleanup | Runs on all completion paths | Broken for batch-of-chains with mid-chain failure
Progress callback per job | Real-time visibility | Overhead per job; slow for large batches

# Performance Considerations
- Each callback invocation is a queue job dispatch — the callback is unserialized and executed by a worker.
- `progress()` fires after every single job. For 10K jobs, that's 10K worker-executed callbacks. Significant overhead.
- Callback execution adds to the batch's time-to-completion. The batch is not "done" until callbacks finish.
- Serialized closures in `options` column — large closures increase storage and deserialization time at callback time.

# Production Considerations
- Callbacks should be idempotent. If the callback job fails and retries, it runs again.
- The `finally()` callback fires inside a worker. Exception in `finally()` fails the callback job, but the batch is already marked finished. Retry manually.
- Monitor for batches stuck in pending state — common cause is `finally()` never firing due to the mid-chain failure bug.
- Callbacks reference external scope via `use ()`. All used variables are serialized — keep them small.

# Common Mistakes
- **Using `$this` in callbacks**: Closures are serialized and executed elsewhere. `$this` may not serialize or points to wrong context. Use `use ($specificVar)` instead.
- **Assuming `finally()` always runs**: The `allJobsHaveRanExactlyOnce` condition means `finally()` does NOT fire if jobs in a chain after a failure were never dispatched.
- **Not using `allowFailures()` with `catch()`**: Without `allowFailures()`, the first failure cancels the batch. `catch()` fires, but remaining jobs are skipped. `finally()` may not fire.

# Failure Modes
- **finally() not firing (batch-of-chains)**: When a job fails mid-chain, remaining chain jobs are never dispatched. The `allJobsHaveRanExactlyOnce` condition fails because those jobs are still "pending." `finally()` never fires.
- **Callback deserialization failure**: If the callback references a class that was renamed or removed between dispatch and callback execution, deserialization fails. The callback job fails silently.
- **Progress callback on cancelled jobs**: `progress()` fires only for successful jobs. If a batch is cancelled mid-flight, already-completed jobs still trigger `progress()`, but cancelled jobs don't.
- **Exception in callback swallows batch state**: If `then()` throws, the batch is already marked finished. The exception fails the callback job, but the batch state is unchanged.

# Ecosystem Usage
- **Laravel framework**: Batch callbacks are used in queued notification batches for post-processing.
- **Laravel Horizon**: Callback execution appears as separate jobs in the dashboard.
- **Spatie packages**: Not directly used, but pattern applicable to batch webhook delivery with completion hooks.

# Related Knowledge Units
- K008 Bus::batch Architecture (lifecycle context) | K012 `allowFailures()` Behavior (interaction with callbacks) | K014 Batch of Chains Pattern (finally() bug)

## Research Notes
- Job batches in Laravel use a Redis-backed BatchRepository that tracks batch state (total jobs, pending jobs, failures) — the atch:table Artisan command creates a migration for a database-backed fallback.
- The llowFailures method on a batch allows remaining jobs to continue processing even when some jobs in the batch fail — this is distinct from the catch callback which fires when any job fails.
- Batch of chains pattern (Bus::chunk) creates independent chains that each execute sequentially — failure in one chain does not affect other chains, unlike a single chain where failure stops execution.
- The Bus::batch and Bus::chain interaction has known limitations — chains within batches cannot have their own catch/finally callbacks, and batch-level callbacks fire independently of chain completion.
- Batch deployment hazards occur when pushing new batch-based code to production — running jobs from the old deployment may not recognize the new batch structure, causing orphaned batches.
- The Batchable trait provides cancel() and cancelled() methods for cooperative cancellation — the job must periodically check $this->batch()->cancelled() to support cancellation mid-execution.
- Batch state locking uses Laravel's cache lock to prevent race conditions on batch updates — Redis locks are recommended for high-throughput batch environments.
- Laravel 12 introduced the atchProgress() helper on job batches, providing a percentage-based progress indicator for real-time UI updates.
