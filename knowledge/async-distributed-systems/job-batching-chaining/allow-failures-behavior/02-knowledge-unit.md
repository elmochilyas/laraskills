# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Batching & Chaining
Knowledge Unit: `allowFailures()` Behavior and `then` vs `catch` Semantics
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
`allowFailures()` is the opt-in mechanism that tells a batch to continue processing remaining jobs even after individual jobs fail. Without it, the first job failure marks the batch as cancelled, and subsequent jobs that check `cancelled()` will abort. The semantics of `then()` vs `catch()` are directly affected by this flag: `then()` only fires when ALL jobs succeed; `catch()` only fires when ANY job failed. With `allowFailures()`, a batch can have successful and failed jobs — `catch()` fires for failures but other jobs continue unaffected.

# Core Concepts
- **without `allowFailures()`**: First job failure calls `$batch->cancel()`. Jobs already dispatched run to completion but new jobs check `cancelled()`.
- **with `allowFailures()`**: Job failures increment `failed_jobs` count, but the batch continues dispatching and processing remaining jobs.
- **`then()` vs `catch()`**: Mutually exclusive per batch execution. If `failed_jobs > 0`, `catch()` fires, not `then()`. If `failed_jobs === 0`, `then()` fires, not `catch()`.
- **`finally()`**: Fires in both cases (assuming `allJobsHaveRanExactlyOnce` condition is met).
- **`allowFailures()` does not silence errors**: Failed jobs still go to `failed_jobs` table, still trigger `failed()` method, and still decrement `pending_jobs`.

# Mental Models
- **Rocket launch with redundant engines**: `allowFailures()` = "if one engine fails, the others keep firing." Without it = "any engine failure aborts the entire mission."
- **Exam grading**: Without `allowFailures()`: the first wrong answer fails the entire exam. With `allowFailures()`: wrong answers are counted, but the rest of the exam is still graded.

# Internal Mechanics
- `PendingBatch::allowFailures()` sets an internal `$this->allowFailures = true` flag.
- On job failure, `recordFailedJob()` updates the batch. Then it checks `$this->allowFailures`.
  - If `false`: calls `$batch->cancel()`.
  - If `true`: only records the failure, no cancellation.
- The `Batch` object exposes `allowFailures()` method returning the flag.
- When checking `cancelled()` in a job, the returned value is `cancelled_at !== null` — set either by explicit `cancel()` or by automatic cancellation when `allowFailures` is `false`.
- The `catch()` callback is triggered in `recordSuccessfulJob()` or `recordFailedJob()` when `pendingJobs === 0` AND `failedJobs > 0`.

# Patterns
## Resilient Batch Processing
- **Purpose**: Process all work regardless of individual item failures.
- **Benefit**: 100 out of 100 items processed, 3 failures logged — rather than 3 failures cancelling 97 valid items.
- **Tradeoff**: Post-batch logic must handle partial failure state.

## Batch with Fallback Path
- **Purpose**: Run a fallback for failures while successes proceed.
- **Benefit**: `catch()` triggers compensatory action, `then()` fires for successes.
- **Tradeoff**: Compensatory logic must be idempotent and parallel-safe.

## Failure Tally in Catch
- **Purpose**: Aggregate failure context in `catch()` for alerting.
- **Benefit**: Single notification with failure summary rather than per-job failures.
- **Tradeoff**: Callback runs once; all failure context must be accessible at that point.

# Architectural Decisions
- **Use `allowFailures()` for**: Independent operations where one failure doesn't invalidate others (processing batches, sending individual notifications).
- **Skip `allowFailures()` for**: Atomic operations where partial completion is unacceptable (multi-step financial reconciliation, sequential data migration).
- **Always pair `allowFailures()` with `catch()`**: Without a `catch()` callback, failures are silently swallowed by the allowFailures flag.

# Tradeoffs
With `allowFailures()` | Maximum throughput; all jobs attempt | Partial failure state; post-processing is more complex
Without `allowFailures()` | Clear fail-fast semantics | Wasted work on remaining jobs; possible re-execution
`then()` + `catch()` combined | Explicit success vs failure handling | Two callbacks to maintain; potential missed edge cases

# Performance Considerations
- `allowFailures()` may increase total job throughput because cancelled jobs don't waste worker time. Jobs already dispatched to workers still run.
- At scale, the batch continues dispatching even with failures, maintaining pressure on the queue.
- No additional overhead from `allowFailures()` itself — it's a boolean check in the failure path.

# Production Considerations
- `allowFailures()` does NOT prevent the `failed_jobs` table from filling up. Each failure is recorded.
- Monitor the ratio of `failed_jobs` to `total_jobs` in the batch. A high ratio indicates systemic issues, not just transient failures.
- Batch retry via `queue:retry-batch` re-dispatches only the failed jobs. With `allowFailures()`, successful jobs are not re-executed.
- The `catch()` callback fires for every batch that has failures, even single failures. Ensure `catch()` is idempotent.

# Common Mistakes
- **Using `allowFailures()` without `catch()`**: Failures are silently absorbed. No alerting, no logging. Only visible in failed_jobs table.
- **Assuming `allowFailures()` prevents `failed()` method execution**: The `failed()` method on individual jobs still runs. `allowFailures()` only affects whether the batch continues.
- **Expecting `then()` to fire with partial failures**: `then()` requires zero failures. With `allowFailures()`, if any job fails, `catch()` fires instead.
- **Not checking batch failure state in `finally()`**: Since `then()` and `catch()` are mutually exclusive but `finally()` always runs, use `finally()` for decisions that need failure awareness.

# Failure Modes
- **Silent partial failure**: With `allowFailures()` and no `catch()` callback, a batch completes with failures but no code runs to detect this. The application may think the batch fully succeeded.
- **`allowFailures()` with chain inside batch**: If a chain within a batch has a mid-chain failure, that chain's remaining jobs are never dispatched. `allowFailures()` doesn't help because the inner chain aborted before dispatch — the batch still sees pending jobs that will never execute.
- **False sense of resilience**: `allowFailures()` lets individual jobs fail, but if the failure is caused by shared infrastructure (database down, API rate limit), the remaining jobs will also fail.

# Ecosystem Usage
- **Laravel framework**: `allowFailures()` pattern used in queued notification batches where per-recipient failure is acceptable.
- **Laravel Horizon**: Shows `allowFailures` state in batch details in the dashboard.
- **Spatie packages**: Not directly used, but pattern applicable to webhook batch delivery.

# Related Knowledge Units
- K008 Bus::batch Architecture (batch lifecycle) | K011 Batch Callbacks (then/catch/finally semantics) | K014 Batch of Chains Pattern (interaction with allowFailures)

## Research Notes
- Job batches in Laravel use a Redis-backed BatchRepository that tracks batch state (total jobs, pending jobs, failures) — the atch:table Artisan command creates a migration for a database-backed fallback.
- The llowFailures method on a batch allows remaining jobs to continue processing even when some jobs in the batch fail — this is distinct from the catch callback which fires when any job fails.
- Batch of chains pattern (Bus::chunk) creates independent chains that each execute sequentially — failure in one chain does not affect other chains, unlike a single chain where failure stops execution.
- The Bus::batch and Bus::chain interaction has known limitations — chains within batches cannot have their own catch/finally callbacks, and batch-level callbacks fire independently of chain completion.
- Batch deployment hazards occur when pushing new batch-based code to production — running jobs from the old deployment may not recognize the new batch structure, causing orphaned batches.
- The Batchable trait provides cancel() and cancelled() methods for cooperative cancellation — the job must periodically check $this->batch()->cancelled() to support cancellation mid-execution.
- Batch state locking uses Laravel's cache lock to prevent race conditions on batch updates — Redis locks are recommended for high-throughput batch environments.
- Laravel 12 introduced the atchProgress() helper on job batches, providing a percentage-based progress indicator for real-time UI updates.
