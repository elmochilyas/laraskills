# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Batching & Chaining
Knowledge Unit: Batch State Tracking with Row-Level Locking
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary
Laravel batches guarantee accurate completion tracking through pessimistic row-level locking via `SELECT ... FOR UPDATE` on the `job_batches` row. Each time a batched job completes (success or failure), the worker acquires a write lock on the batch row inside a database transaction. This ensures that concurrent workers updating the same batch cannot count jobs twice or miss final state transitions. However, this locking strategy is a scalability bottleneck — all jobs in a batch serialize on this single row, regardless of how many workers process them.

# Core Concepts
- **`lockForUpdate()`**: MySQL/PostgreSQL row-level exclusive lock. The transaction holds the lock until commit.
- **`updateAtomicValues()`**: The method in `DatabaseBatchRepository` that encapsulates the read-lock-update cycle.
- **Transaction scope**: Each job completion starts a transaction, reads the batch row with `FOR UPDATE`, decrements `pending_jobs`, updates the row, and commits.
- **Lock duration**: Microseconds for a simple update, but a concurrent worker must wait its turn. Under high concurrency, queue depth on the DB lock creates latency.
- **Two-phase counting**: `recordSuccessfulJob()` decrements pending jobs. `recordFailedJob()` both decrements pending and increments failed. Both use the same lock.

# Mental Models
- **Single-door room**: The batch row is a room with one door. Only one worker can enter at a time to update the whiteboard (counts). Others wait outside.
- **ATM machine**: When checking your balance (read) and withdrawing (write), the ATM locks your account so no other ATM processes simultaneously. Same principle.

# Internal Mechanics
```
DatabaseBatchRepository::updateAtomicValues($batchId, function ($batch) {
    return [
        'pending_jobs' => $batch->pending_jobs - 1,
        'failed_jobs' => $batch->failed_jobs,
    ];
});

// Internally:
$this->connection->transaction(function () use ($batchId, $callback) {
    $batch = $this->connection->table($this->table)
        ->where('id', $batchId)
        ->lockForUpdate()
        ->first();

    return tap($callback($batch), function ($values) use ($batchId) {
        $this->connection->table($this->table)
            ->where('id', $batchId)
            ->update($values);
    });
});
```
- The transaction begins, `SELECT ... FOR UPDATE` reads the current row and locks it.
- The callback computes new counts from the current row values.
- The `UPDATE` writes the new counts.
- Transaction commits, releasing the lock.
- Any other worker's `SELECT ... FOR UPDATE` on the same batch row blocks until the commit.

# Patterns
## Batch Size Capping
- **Purpose**: Limit parallelism to reduce lock contention.
- **Benefit**: Fewer concurrent updates = less lock wait time.
- **Tradeoff**: Reduced throughput; jobs process in smaller waves.

## Spread Across Batch IDs
- **Purpose**: Distribute large workloads across multiple batch IDs.
- **Benefit**: Each batch row has its own lock — no cross-batch contention.
- **Tradeoff**: No single "all done" callback; must coordinate completion yourself.

## Optimistic Offload
- **Purpose**: Use counters outside the batch table for high-throughput tracking; report final state back to batch.
- **Benefit**: Avoid row lock bottleneck for intermediate tracking.
- **Tradeoff**: Complex, defeats purpose of built-in batching.

# Architectural Decisions
- **Batch size vs lock contention**: For batches under 1000 jobs, lock contention is negligible (<1ms per lock). For 10K+ jobs with many workers, lock wait time becomes the dominant factor.
- **Database choice**: MySQL 8.0+ with InnoDB handles row locks efficiently. Postgres uses `SELECT FOR UPDATE` equivalently. SQLite has table-level locking — very poor for concurrent batch updates.
- **Custom progress tracking**: If lock contention is unacceptable, replace batch tracking with Redis counters or independent tracking table.

# Tradeoffs
`SELECT FOR UPDATE` | Correct counts under all concurrency | Contention at scale; DB load from lock waits
No locking (optimistic read) | No contention, higher throughput | Race conditions: missed transitions, double counting
Redis-based tracking | No DB locking, fast counters | No transactional safety; potential count loss on crash

# Performance Considerations
- Each job completion in a batch is: 1 DB transaction + 1 SELECT FOR UPDATE + 1 UPDATE. For 10K jobs, that's 10K sequential DB round-trips (lock contention serializes them).
- Lock wait time increases with concurrency. 10 workers completing jobs simultaneously for the same batch: average lock wait ~ (9 × job_count / 2 / commit_time). Can reach seconds per operation.
- The lock is row-level, not table-level. Other batches or table operations are not affected.
- With `allowFailures()`, failed jobs also acquire the lock — failures contribute to the same contention.

# Production Considerations
- Monitor DB thread count and lock wait time during batch-heavy operations. Spike in `Innodb_row_lock_current_waits` is diagnostic.
- The batch lock primarily affects the batch completion pipeline, not the job execution itself. Jobs process in parallel; only the final state update is serial.
- For latency-sensitive workloads below the batch lock, use smaller batches (100-500 jobs) with more rapid completion callbacks.
- The batch table should be on a database with good row-level lock performance (InnoDB or Postgres). Avoid SQLite for any batched workload.
- The lock timeout defaults to 60 seconds in MySQL. If a lock wait exceeds this, the transaction is rolled back, the job fails, and the batch counts become incorrect.

# Common Mistakes
- **Assuming parallel workers mean parallel batch updates**: Workers process jobs in parallel but serialize on the batch state update. The bottleneck is invisible in job logs — appears as a long gap between job completion and callback firing.
- **Not considering lock timeouts under load**: Under heavy batch load, long lock waits can hit `innodb_lock_wait_timeout` (default 60s). The job re-queues and retries, potentially duplicating side effects.
- **Using non-transactional database (MyISAM)**: Row-level locking requires InnoDB. MyISAM uses table-level locking — each batch update locks the entire `job_batches` table.

# Failure Modes
- **Lock deadlock**: Rare case where two workers hold locks on resources the other needs. InnoDB detects and rolls back one transaction. The worker's job fails and retries — but the batch state may now be double-counted.
- **Lock wait timeout**: Worker holds the lock, a DB maintenance operation (index rebuild, backup) runs, other workers hit lock wait timeout. Their jobs fail but the batch state never updates.
- **Split-brain with lock**: If a worker acquires the lock, processes the update, but crashes before the transaction commits, the lock is released without the update. The job's completion is lost.
- **Replica drift**: If the batch table is read from a read replica (not the write connection), the `useWritePdo()` call in `find()` might not propagate to the lock query. Using replicas for batch reads gives stale data.

# Ecosystem Usage
- **Laravel framework**: The `DatabaseBatchRepository` is the production implementation. No alternative provided — all batches use row-level locking.
- **Laravel Horizon**: Does not change the batching mechanism. Batch state is still tracked via the database table.
- **Spatie packages**: No direct usage, but projects using Spatie for batch webhooks may encounter lock contention at scale.

# Related Knowledge Units
- K008 Bus::batch Architecture (context) | K012 `allowFailures()` Behavior (failure impact on locking)

## Research Notes
- Job batches in Laravel use a Redis-backed BatchRepository that tracks batch state (total jobs, pending jobs, failures) — the atch:table Artisan command creates a migration for a database-backed fallback.
- The llowFailures method on a batch allows remaining jobs to continue processing even when some jobs in the batch fail — this is distinct from the catch callback which fires when any job fails.
- Batch of chains pattern (Bus::chunk) creates independent chains that each execute sequentially — failure in one chain does not affect other chains, unlike a single chain where failure stops execution.
- The Bus::batch and Bus::chain interaction has known limitations — chains within batches cannot have their own catch/finally callbacks, and batch-level callbacks fire independently of chain completion.
- Batch deployment hazards occur when pushing new batch-based code to production — running jobs from the old deployment may not recognize the new batch structure, causing orphaned batches.
- The Batchable trait provides cancel() and cancelled() methods for cooperative cancellation — the job must periodically check $this->batch()->cancelled() to support cancellation mid-execution.
- Batch state locking uses Laravel's cache lock to prevent race conditions on batch updates — Redis locks are recommended for high-throughput batch environments.
- Laravel 12 introduced the atchProgress() helper on job batches, providing a percentage-based progress indicator for real-time UI updates.
