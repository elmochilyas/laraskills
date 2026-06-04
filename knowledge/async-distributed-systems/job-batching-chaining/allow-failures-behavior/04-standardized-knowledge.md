# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Batching & Chaining
- **Knowledge Unit:** K012 — `allowFailures()` Behavior and Callback Semantics
- **Knowledge ID:** K012
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Job Batching
  - Laravel Source — `Illuminate\Bus\PendingBatch`

---

# Overview

`allowFailures()` tells a batch to continue processing remaining jobs even after individual jobs fail. Without it, the first job failure calls `$batch->cancel()`, which sets `cancelled_at` — subsequent jobs that check `cancelled()` abort. Callback semantics are directly affected: `then()` fires only when all jobs succeeded (`failed_jobs === 0`), `catch()` fires when any job failed (`failed_jobs > 0`), and they are mutually exclusive per batch execution.

---

# Core Concepts

- **Without `allowFailures()`:** First failure calls `$batch->cancel()`. Already-dispatched jobs still run. Undispatched jobs that check `cancelled()` abort.
- **With `allowFailures()`:** Failures increment `failed_jobs` count. Batch continues dispatching. All remaining jobs attempt execution.
- **`then()` vs `catch()` mutual exclusion:** If `failed_jobs > 0`, `catch()` fires, not `then()`. If `failed_jobs === 0`, `then()` fires, not `catch()`.
- **`finally()` fires in both cases** (assuming `allJobsHaveRanExactlyOnce` condition met).
- **Does not silence errors:** Failed jobs still go to `failed_jobs` table, still trigger `failed()`, still decrement `pending_jobs`.

---

# When To Use

- Independent operations where one failure doesn't invalidate others (processing batches, sending notifications)
- Maximum-throughput scenarios where all work should be attempted regardless of individual failures
- When `catch()` callback should fire with aggregate failure context

---

# When NOT To Use

- Financial reconciliation or data migration where partial completion is unacceptable
- When silent partial failure is dangerous — without a `catch()` callback, failures are silently absorbed
- Atomic operations where any failure means the entire operation should roll back

---

# Best Practices

- **Always pair `allowFailures()` with `catch()` callback.** Without `catch()`, failures are silently absorbed. *Why: `allowFailures()` only prevents cancellation — it doesn't notify or alert. Only `catch()` provides an explicit failure pathway.*
- **Don't assume `allowFailures()` protects chains within the batch.** A chain inside a batch aborts on mid-chain failure regardless of `allowFailures()`. *Why: `allowFailures()` is batch-scoped. Chain abort is chain-internal — the batch cannot force a broken chain to dispatch remaining jobs.*
- **Check `$batch->failedJobs` in `finally()` for failure-aware decisions.** Since `then()` and `catch()` are mutually exclusive but `finally()` always runs, use `finally()` for cleanup that depends on knowing failure state. *Why: `finally()` runs regardless — checking `failedJobs` inside it allows unified post-processing.*

---

# Performance Considerations

- `allowFailures()` may increase total throughput because cancelled jobs don't waste dispatch slots. Already-running jobs still complete.
- No additional overhead from `allowFailures()` itself — it's a boolean check in the failure path.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using `allowFailures()` without `catch()` | Expecting failures to be visible | Failures silently absorbed; no alerting | Always add `catch()` |
| Assuming `then()` fires with partial failures | Not knowing then/catch mutual exclusion | Post-processing runs as if all succeeded when some failed | Use `finally()` with `failedJobs` check |
| Expecting `allowFailures()` to silence `failed()` method | Misunderstanding scope | Per-job `failed()` still runs | Accept that `failed()` is job-scoped |

---

# Anti-Patterns

- **Silent partial failure:** Batch completes with failures but no code detects it — looks like full success.
- **False sense of resilience:** `allowFailures()` lets individual jobs fail, but if failures are caused by shared infrastructure (DB down, rate limit), all remaining jobs also fail.

---

# Examples

```php
Bus::batch($jobs)
    ->allowFailures()
    ->then(function (Batch $batch) {
        // All jobs succeeded — never fires if any job failed
    })
    ->catch(function (Batch $batch, Throwable $e) {
        // Fires because failed_jobs > 0 — but only the last failure's exception
        Log::warning('Batch had failures', [
            'failed' => $batch->failedJobs,
            'total'  => $batch->totalJobs,
        ]);
    })
    ->finally(function (Batch $batch) {
        // Always runs — check state for failure-aware cleanup
        if ($batch->failedJobs > 0) {
            // partial failure path
        }
    })
    ->dispatch();
```

---

# Related Topics

- **K008 Bus::batch Architecture (K008)** — Batch lifecycle
- **K011 Batch Callbacks (K011)** — then/catch/finally semantics
- **K014 Batch of Chains Pattern (K014)** — Interaction with allowFailures and chain abort
- **K089 Chain-Batch Interaction Limitations (K089)** — Chain behavior under allowFailures
