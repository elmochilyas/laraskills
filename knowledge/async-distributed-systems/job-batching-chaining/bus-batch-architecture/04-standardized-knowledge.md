# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Batching & Chaining
- **Knowledge Unit:** K008 — Bus::batch Architecture
- **Knowledge ID:** K008
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Job Batching
  - Laravel Source — `Illuminate\Bus\PendingBatch`, `Illuminate\Bus\Batch`

---

# Overview

`Bus::batch` enables parallel job orchestration with completion tracking via a `job_batches` database table. Internally, a batch is a `PendingBatch` object that stores metadata in a DB row and dispatches all jobs to the queue in bulk. Each job carries a `batchId` property. State updates use row-level locking to ensure atomic counter consistency. The architecture is designed for scatter-gather workloads where independent jobs run in parallel and a completion callback fires when all finish.

---

# Core Concepts

- **PendingBatch:** Returned by `Bus::batch($jobs)`. Fluent methods: `then()`, `catch()`, `finally()`, `allowFailures()`, `onConnection()`, `onQueue()`, `name()`, `dispatch()`.
- **Batch object:** Immutable value object. Contains state at read time. `fresh()` to re-read.
- **job_batches table:** `id` (UUID), `name`, `total_jobs`, `pending_jobs`, `failed_jobs`, `failed_job_ids` (JSON), `options`, `created_at`, `cancelled_at`, `finished_at`.
- **Row-level locking:** `updateAtomicValues()` wraps read+write in a transaction with `lockForUpdate()`.
- **Batch ID propagation:** Each job's `batchId` is set when the batch is dispatched.

---

# When To Use

- Parallel independent work units (image processing, data imports, API calls)
- Scatter-gather patterns where all results must complete before proceeding
- Progress tracking for long-running batch operations
- Fan-out processing where order doesn't matter but completion notification does

---

# When NOT To Use

- Sequential job execution — use `Bus::chain` instead
- Small numbers of jobs (< 5) — direct dispatch is simpler
- High-throughput systems where DB row lock contention is unacceptable
- Jobs that need to share state — batch jobs are independent

---

# Best Practices

- **Keep batch sizes under 10,000 jobs.** Above this, `failed_job_ids` JSON column grows large and lock contention increases. *Why: Each job completion acquires a row lock — at high concurrency, this serializes on a single DB row.*
- **Use `allowFailures()` when partial success is acceptable.** Without it, a single failure cancels the entire batch. *Why: Batch processing often involves independent units where one failure shouldn't abort the rest.*
- **Avoid serializing large objects in callbacks.** Callbacks are serialized closures stored in the `options` column — large payloads bloat storage. *Why: Callbacks are serialized via `serialize()` — large captured variables increase payload size and deserialization time.*
- **Prune old batches regularly.** The `job_batches` table grows unbounded — use `queue:prune-batches` or a scheduled job. *Why: Unlike `failed_jobs`, batch records are not automatically cleaned up — they accumulate indefinitely.*

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not calling `allowFailures()` | Expecting partial success | Batch cancels on first failure | Call `allowFailures()` if partial success is OK |
| `$this` in callback closures | Using `$this` in `->then(function () { $this->... })` | Serialization error | Use `use ($var)` instead |
| Assuming real-time progress | Reading batch once | Stale counts | Call `$batch->fresh()` |
| Large batches with progress callback | Progress fires per job | 10K extra worker jobs | Limit progress granularity |

---

# Anti-Patterns

- **Nested batches without `allowFailures`:** Inner batch failure cancels outer batch — unpredictable state.
- **Batch as a transaction unit:** Batches don't roll back. Completed jobs are not undone by failure.

---

# Examples

```php
Bus::batch([
    new ProcessOrder($order1),
    new ProcessOrder($order2),
    new ProcessOrder($order3),
])->then(function (Batch $batch) {
    // All jobs succeeded
    Cache::put('batch_done', true);
})->catch(function (Batch $batch, Throwable $e) {
    // A job failed after exhausting retries
    Log::error('Batch failed', ['batch' => $batch->id]);
})->finally(function (Batch $batch) {
    // Always runs
    $batch->fresh();
})->allowFailures()->dispatch();
```

---

# Related Topics

- **K009 Batch State Tracking with Locking (K009)** — Lock analysis
- **K011 Batch Callbacks (K011)** — then/catch/finally semantics
- **K010 Batchable Trait (K010)** — Job-batch interaction
