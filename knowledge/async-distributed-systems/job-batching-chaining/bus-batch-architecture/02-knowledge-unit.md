# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Batching & Chaining
Knowledge Unit: `Bus::batch` Architecture and `job_batches` Table
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
`Bus::batch` enables parallel job orchestration with completion tracking via a `job_batches` database table. Internally, a batch is a `PendingBatch` object that stores metadata in a DB row (ID, name, total/pending/failed counts, options, timestamps) and dispatches all jobs to the queue in bulk. Each job carries a `batchId` property set via the `Batchable` trait. State updates use row-level locking (`SELECT ... FOR UPDATE`) to ensure atomic counter consistency across concurrent workers. The architecture is designed for scatter-gather workloads where independent jobs run in parallel and a completion callback fires when all finish.

# Core Concepts
- **`PendingBatch`**: Returned by `Bus::batch($jobs)`. Fluent methods: `then()`, `catch()`, `finally()`, `allowFailures()`, `onConnection()`, `onQueue()`, `name()`, `dispatch()`.
- **`Batch` object**: Immutable value object read from the repository. Contains state at read time. `fresh()` to re-read.
- **`job_batches` table schema**: `id` (UUID string, primary), `name`, `total_jobs`, `pending_jobs`, `failed_jobs`, `failed_job_ids` (JSON array), `options` (serialized callbacks/ config), `created_at`, `cancelled_at`, `finished_at`.
- **Row-level locking**: `updateAtomicValues()` wraps read+write in a DB transaction with `->lockForUpdate()`. Ensures that concurrent workers don't corrupt counts.
- **Batch ID propagation**: Each job's `$batchId` property is set when the batch is dispatched. The job references its batch via `$this->batch()`.

# Mental Models
- **Air traffic control**: The batch is a flight of independent planes (jobs) that all take off together. Each plane reports when it lands (success) or crashes (failure). Control tower tracks how many are still in the air. When all have landed, the tower signals "all clear" (then/finally).
- **Ledger with locks**: Think of the batch row as a shared ledger. Only one person (worker) can update the ledger at a time (row lock), preventing double-counting.

# Internal Mechanics
- `Bus::batch($jobs)` returns `new PendingBatch($jobs)`.
- `PendingBatch::dispatch()` calls `$repository->store($this)` which inserts a row in `job_batches` with `total_jobs=0, pending_jobs=0`.
- `$batch->add($jobs)` iterates jobs, sets `batchId` via `withBatchId($id)`, wraps chains, then calls `$repository->incrementTotalJobs()`.
- Finally, all jobs are bulk-dispatched to the queue.
- On job completion, `Batchable::ensureSuccessfulBatchJobIsRecorded()` fires `$batch->recordSuccessfulJob($uuid)` → `decrementPendingJobs()` → lock → update → check if done.
- On job failure, `$batch->recordFailedJob($uuid)` increments `failed_jobs` and adds to `failed_job_ids`.
- When `pending_jobs` hits 0, `markAsFinished()` is called, which triggers `then()` and `finally()` callbacks.
- The `catch()` callback fires when `failed_jobs > 0` AND the batch is finished.

# Patterns
## Fan-Out Parallel Processing
- **Purpose**: Dispatch independent work units simultaneously.
- **Benefit**: Total processing time = max(single job time), not sum.
- **Tradeoff**: Database lock contention at scale; monitoring complexity.

## Progress Tracking Pipeline
- **Purpose**: Drive a progress bar or status UI from batch state.
- **Benefit**: User-facing progress for long-running operations.
- **Tradeoff**: Polling the batch table for updates; stale progress on cache.

## Nested Batch with allowFailures
- **Purpose**: Tolerate partial failures within a batch while still completing.
- **Benefit**: Non-critical failures don't cancel the entire operation.
- **Tradeoff**: Complexity: you must check per-job failure state in callbacks.

# Architectural Decisions
- **Batch size limits**: Single dispatch call works for thousands of jobs. For >10K, consider chunking into multiple batches.
- **Row locking concern**: `SELECT FOR UPDATE` on the batch row creates a hot spot. At high throughput (e.g., 100+ concurrent job completions per second), lock contention reduces throughput.
- **Callback serialization**: `then()`, `catch()`, `finally()` closures are serialized into `options` column. They must be self-contained, not reference `$this`.

# Tradeoffs
Row-level locking per job completion | Accurate counts, no race conditions | Contention at scale; batch throughput capped by DB write speed
Serialized callbacks in DB | Survive worker restarts | Deployment hazard: code changes before callback runs
Job-level retry (no batch retry) | Follows standard retry rules | No batch-wide retry policy; `queue:retry-batch` required

# Performance Considerations
- Each job completion triggers a DB transaction with `FOR UPDATE` lock. At 1000 jobs, that's 1000 lock acquisitions on the same row.
- The batch table is not sharded — all jobs in a batch contend on the same row.
- Callbacks are serialized closures stored in the `options` column. Large closures increase storage and deserialization time.
- For batches with 10K+ jobs, the `failed_job_ids` JSON array grows and may exceed MySQL JSON column practical limits.

# Production Considerations
- Batch `job_batches` table grows unbounded. Prune via `queue:prune-batches` or scheduled job.
- Monitor `finished_at` — batches stuck in pending state indicate leak (jobs dispatched but never completed).
- Callback closures that reference `$this` fail on serialization in `catch()` (explicitly unsupported).
- Batch cancellation via `$batch->cancel()` does NOT stop in-flight jobs. Use `SkipIfBatchCancelled` middleware.

# Common Mistakes
- **Not calling `allowFailures()` then expecting `finally()` to fire**: Without `allowFailures()`, the first failure cancels the batch. `finally()` fires only when all jobs ran exactly once.
- **Storing large objects in callbacks**: `then(function (Batch $batch) use ($heavyObject) { ... })` — the `$heavyObject` is serialized into the `options` column.
- **Assuming batch progress is real-time**: The `Batch` object is read from DB at creation. Call `fresh()` to get latest counts.
- **Forgetting `use ($batch)` in closures**: Callbacks receive `Batch $batch` but may need external scope variables via `use`.

# Failure Modes
- **Lock contention at high throughput**: Multiple workers trying to `SELECT ... FOR UPDATE` on the same batch row create a queue of DB threads. Mitigation: reduce batch size, use smaller parallel groups.
- **Orphaned batch**: If a worker crashes after processing a job but before updating the batch, pending count never decrements. No automatic recovery.
- **Callback deserialization failure**: Deploying code that changes the callback closure class/namespace breaks in-flight batches.
- **`failed_job_ids` column overflow**: MySQL JSON column has 1GB limit, but practical query performance degrades well before that.

# Ecosystem Usage
- **Laravel framework**: `Bus::batch` is used internally for batched notifications and queued broadcasting to groups.
- **Laravel Horizon**: Shows batch jobs grouped in the dashboard with batch ID filtering.
- **Spatie packages**: Not directly related, but webhook batch dispatch can use `Bus::batch` for parallel webhook delivery.

# Related Knowledge Units
- K009 Batch State Tracking with Row-Level Locking (lock analysis) | K011 Batch Callbacks (then/catch/finally semantics) | K012 `allowFailures()` Behavior

## Research Notes
- Job batches in Laravel use a Redis-backed BatchRepository that tracks batch state (total jobs, pending jobs, failures) — the atch:table Artisan command creates a migration for a database-backed fallback.
- The llowFailures method on a batch allows remaining jobs to continue processing even when some jobs in the batch fail — this is distinct from the catch callback which fires when any job fails.
- Batch of chains pattern (Bus::chunk) creates independent chains that each execute sequentially — failure in one chain does not affect other chains, unlike a single chain where failure stops execution.
- The Bus::batch and Bus::chain interaction has known limitations — chains within batches cannot have their own catch/finally callbacks, and batch-level callbacks fire independently of chain completion.
- Batch deployment hazards occur when pushing new batch-based code to production — running jobs from the old deployment may not recognize the new batch structure, causing orphaned batches.
- The Batchable trait provides cancel() and cancelled() methods for cooperative cancellation — the job must periodically check $this->batch()->cancelled() to support cancellation mid-execution.
- Batch state locking uses Laravel's cache lock to prevent race conditions on batch updates — Redis locks are recommended for high-throughput batch environments.
- Laravel 12 introduced the atchProgress() helper on job batches, providing a percentage-based progress indicator for real-time UI updates.
