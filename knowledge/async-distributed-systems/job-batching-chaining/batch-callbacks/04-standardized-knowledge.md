# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Batching & Chaining
- **Knowledge Unit:** K011 — Batch Callbacks
- **Knowledge ID:** K011
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Job Batching
  - Laravel Source — `Illuminate\Bus\PendingBatch`

---

# Overview

Laravel batches expose five lifecycle callbacks: `before()` (after batch creation, before job dispatch), `progress()` (after each successful job), `then()` (all jobs succeeded), `catch()` (any job failed), and `finally()` (batch finished regardless). Callbacks are serialized closures stored in the `options` column of `job_batches`, executed when the triggering condition is met.

---

# Core Concepts

- **`before()`:** Runs after batch DB row created, before job dispatch. For pre-flight checks.
- **`progress()`:** Runs after each successful job. Receives `Batch`. For progress tracking.
- **`then()`:** Runs when all jobs succeed and `pending_jobs` reaches 0.
- **`catch()`:** Runs when batch finishes with failures. Receives `Batch` and `Throwable`.
- **`finally()`:** Runs when all jobs ran exactly once regardless of outcome.
- **Callback serialization:** All callbacks serialized via `serialize()` in `options` column.

---

# When To Use

- Post-batch notification (all orders processed → send summary email)
- Progress reporting (update frontend for long-running operations)
- Resource cleanup regardless of success/failure
- Conditional post-processing based on batch outcome

---

# When NOT To Use

- Complex business logic in callbacks — dispatch a dedicated job instead
- When callback deserialization failure would be catastrophic — closures reference classes that may change

---

# Best Practices

- **Use `finally()` only when you understand its limitation.** `finally()` requires `allJobsHaveRanExactlyOnce` — it does NOT fire if chain jobs after a failure were never dispatched (known bug in batch-of-chains). *Why: `finally()` checks `pendingJobs - failedJobs === 0` — undispatchable chain jobs remain pending, preventing `finally()` from ever firing.*
- **Avoid `$this` in callbacks.** Closures are serialized and executed in a different context — `$this` may not serialize correctly. *Why: PHP serializes the entire object graph of `$this` — unexpected behavior when unserialized in the worker.*
- **Keep callbacks thin — dispatch a new job for complex work.** Callbacks run in a worker and should be fast. Offload heavy processing to a new job. *Why: The batch is "done" only after callbacks complete — slow callbacks delay the batch finish time.*
- **Use `then()` + `catch()` over `finally()` for explicit success/failure paths.** More readable and predictable. *Why: `then()` and `catch()` have clear semantics — `finally()` has a subtle condition that may not fire as expected.*

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| `$this` in closures | Referring to `$this` inside callback | Serialization error or wrong context | Use `use ($specificVar)` |
| Relying on `finally()` always running | Not knowing `allJobsHaveRanExactlyOnce` condition | finally() never fires for batch-of-chains with failures | Use `then()` + `catch()` instead |
| No `allowFailures()` with `catch()` | First failure cancels batch | `catch()` fires but remaining jobs skipped | Combine `allowFailures()` + `catch()` |
| Progress callback on 10K jobs | Progress fires per job | 10K extra callback jobs | Batch progress or sample-based reporting |

---

# Examples

```php
Bus::batch($jobs)
    ->then(function (Batch $batch) {
        Mail::to($batch->name)->send(new BatchComplete);
    })
    ->catch(function (Batch $batch, Throwable $e) {
        Log::error('Batch failed', ['id' => $batch->id, 'error' => $e->getMessage()]);
    })
    ->finally(function (Batch $batch) {
        Cache::forget('batch_'.$batch->id);
    })
    ->allowFailures()
    ->dispatch();
```

---

# Related Topics

- **K008 Bus::batch Architecture (K008)** — Batch lifecycle
- **K012 allowFailures Behavior (K012)** — Interaction with callbacks
- **K014 Batch of Chains Pattern (K014)** — finally() bug details
