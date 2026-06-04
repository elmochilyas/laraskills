# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Batching & Chaining
- **Knowledge Unit:** K009 — Batch State Tracking with Row-Level Locking
- **Knowledge ID:** K009
- **Difficulty Level:** Expert
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Source — `Illuminate\Bus\DatabaseBatchRepository`
  - MySQL/PostgreSQL row-level locking documentation

---

# Overview

Laravel batches guarantee accurate completion tracking through pessimistic row-level locking via `SELECT ... FOR UPDATE` on the `job_batches` row. Each time a batched job completes, the worker acquires a write lock on the batch row inside a database transaction. This ensures concurrent workers updating the same batch cannot count jobs twice or miss final state transitions. However, this locking strategy is a scalability bottleneck — all jobs in a batch serialize on this single row.

---

# Core Concepts

- **`lockForUpdate()`:** MySQL/PostgreSQL row-level exclusive lock.
- **`updateAtomicValues()`:** Encapsulates the read-lock-update cycle.
- **Transaction scope:** Each job completion starts a transaction, reads with `FOR UPDATE`, decrements `pending_jobs`, updates, commits.
- **Lock duration:** Microseconds for a simple update, but concurrent workers wait their turn.
- **Two-phase counting:** `recordSuccessfulJob()` decrements pending. `recordFailedJob()` decrements pending and increments failed.

---

# When To Use

- When accurate batch completion tracking is required
- When concurrent workers process the same batch
- For batch sizes under 10,000 where lock contention is acceptable

---

# When NOT To Use

- SQLite databases — table-level locking makes batch operations extremely slow
- Batches > 10K jobs with high worker concurrency — lock contention dominates
- When approximate progress tracking is sufficient — use Redis counters instead

---

# Best Practices

- **Keep batch sizes under 1,000 jobs for low contention.** Under 1K, lock wait is negligible (<1ms per lock). Above 10K, it becomes the dominant factor. *Why: Lock acquisition is serial — 10K jobs = 10K sequential lock operations regardless of worker count.*
- **Use InnoDB (MySQL) or PostgreSQL.** These engines support efficient row-level locking. SQLite uses table-level locking — every batch update locks the entire `job_batches` table. *Why: Table-level locks block ALL batch operations, not just the specific batch row.*
- **Monitor `Innodb_row_lock_current_waits` during batch-heavy operations.** Spikes indicate lock contention. *Why: The batch lock bottleneck is invisible in job logs — DB metrics reveal the true serialization point.*

---

# Performance Considerations

- Each job completion: 1 DB transaction + 1 SELECT FOR UPDATE + 1 UPDATE. For 10K jobs = 10K sequential DB round-trips.
- Lock wait time increases with concurrency — 10 workers for the same batch can cause seconds of wait per operation.
- Lock is row-level — other batch rows are unaffected.
- With `allowFailures()`, failed jobs also acquire the lock.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming parallel batch updates | Workers process in parallel but serialize on lock | Long gaps between job completion and callback firing | Monitor lock wait times |
| Lock timeout under load | `innodb_lock_wait_timeout` (default 60s) exceeded | Transaction rolled back, job retries, potential side effect duplication | Smaller batches |
| Non-transactional DB (MyISAM) | MyISAM uses table-level locking | Entire `job_batches` table locked per update | Use InnoDB |

---

# Examples

```php
// Internal locking mechanism (conceptual)
$repository->updateAtomicValues($batchId, function ($batch) {
    return [
        'pending_jobs' => $batch->pending_jobs - 1,
    ];
});
// Wrapped in: BEGIN → SELECT ... FOR UPDATE → UPDATE → COMMIT
```
