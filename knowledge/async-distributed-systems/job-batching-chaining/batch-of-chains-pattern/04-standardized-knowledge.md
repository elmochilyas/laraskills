# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Batching & Chaining
- **Knowledge Unit:** K014 — Batch of Chains Pattern and `finally()` Edge Case
- **Knowledge ID:** K014
- **Difficulty Level:** Expert
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Job Batching
  - Laravel Source — `Illuminate\Bus\PendingBatch`, `Illuminate\Bus\PrepareBatchChain`

---

# Overview

The "batch of chains" pattern — `Bus::batch([[$a1, $a2], [$b1, $b2]])` — combines parallel batch execution with sequential chains within each unit. Each chain runs independently in order, while all chains execute in parallel across workers. However, a critical edge case exists: if a job fails mid-chain (e.g., `$a1` succeeds, `$a2` fails), the remaining jobs in that chain are never dispatched. The batch's `finally()` callback never fires because `allJobsHaveRanExactlyOnce()` evaluates to `false` — those undispatched jobs remain in the "pending" count forever.

---

# Core Concepts

- **Batch of chains:** Array of arrays passed to `Bus::batch()`. Each inner array is a chain.
- **Independent chain execution:** Each chain runs sequentially. Multiple chains run in parallel.
- **Mid-chain failure abort:** If job N in a chain fails, jobs N+1...end of that chain are never dispatched.
- **`finally()` never fires:** The condition requires every job to have run exactly once. Mid-chain failures leave undispatched jobs that were counted in `total_jobs` but never decremented from `pending_jobs`. `pending_jobs - failed_jobs` is never 0.
- **Internal mechanism:** `PendingBatch::add()` detects sub-arrays and calls `PrepareBatchChain::prepare()` for each, wrapping the rest as chained jobs of the first.

---

# When To Use

- Multi-step pipelines where each unit is independent but steps within a unit are sequential
- Parallel processing of ordered workflows (process multiple orders, each with sequential stages)

---

# When NOT To Use

- When `finally()` is required for critical post-processing — it's unreliable
- When any chain could have mid-chain failures — leads to abandoned jobs and stuck batches
- Production-critical workflows without a monitoring watchdog for stuck batches

---

# Best Practices

- **Use `then()` + `catch()` instead of `finally()` for batch-of-chains.** `then()` fires when all jobs ran successfully (no failures). `catch()` fires when all jobs ran with some failures. Both are reliable. *Why: `finally()` has the abandoned-jobs bug — `then()` and `catch()` only depend on jobs that actually ran, not those that were never dispatched.*
- **Implement a watchdog for stuck batches.** Check for batches with `finished_at = null` but age > expected max runtime. Cancel or complete them manually. *Why: Stuck batches from mid-chain failures accumulate in `job_batches` and won't be cleaned up automatically.*
- **Consider separate batches per chain instead of batch-of-chains.** N independent batches with individual callbacks are more reliable. *Why: Each batch tracks its own chain independently — no shared `finally()` issue, no cross-chain interference.*
- **Limit chain length within a batch to 2-3 jobs.** Shorter chains reduce mid-chain failure probability. *Why: The probability of at least one chain having a mid-chain failure increases with chain count and length.*

---

# Performance Considerations

- Efficient for parallel pipelines — all chains run concurrently across workers.
- Abandoned jobs waste serialization effort — the batch accounted for jobs that never run.
- Stuck batches (no `finished_at`) are not pruned by normal cleanup — they accumulate in the table.

---

# Security Considerations

- A stuck batch with stale data could be reaped by a watchdog that re-dispatches work — ensure idempotency.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming `allowFailures()` fixes the `finally()` bug | Thinking allowFailures dispatches aborted chain jobs | `finally()` still doesn't fire — chain jobs are never dispatched | Use `then()` + `catch()` |
| Using `finally()` for critical post-processing | Not knowing the abandoned-jobs edge case | Post-processing never runs; batch looks "in progress" forever | Use `then()` + `catch()` or watchdog |
| Not testing mid-chain failure scenario | Only testing all-success and all-failure | Bug discovered in production | Test mid-chain failure explicitly |

---

# Examples

```php
Bus::batch([
    [$jobA1, $jobA2, $jobA3], // chain A
    [$jobB1, $jobB2],          // chain B
])->then(function (Batch $batch) {
    // All jobs in all chains succeeded
})->catch(function (Batch $batch, Throwable $e) {
    // Some jobs failed but all dispatched jobs ran
})->dispatch();
```

---

# Related Topics

- **K011 Batch Callbacks (K011)** — `finally()` semantics
- **K012 allowFailures Behavior (K012)** — Interaction with chain abort
- **K089 Chain-Batch Interaction Limitations (K089)** — Deeper composition analysis
