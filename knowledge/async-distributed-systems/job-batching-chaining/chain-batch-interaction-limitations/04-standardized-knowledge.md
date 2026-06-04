# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Batching & Chaining
- **Knowledge Unit:** K089 — Chain-Batch Interaction Limitations
- **Knowledge ID:** K089
- **Difficulty Level:** Expert
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Job Batching & Chaining
  - Laravel Source — `Illuminate\Bus\PendingBatch`, `Illuminate\Bus\PendingChain`

---

# Overview

The interaction between chains and batches has several undocumented limitations. Chains inside batches (batch-of-chains) have the `finally()` never-firing bug when mid-chain failure occurs. Batches inside chains (chain-of-batches) complete each batch step before the chain advances, but batch cancellation from a failed inner job does not propagate correctly to the outer chain. Additionally, `allowFailures()` on the outer batch does not prevent inner chains from aborting after a failure — chain abort behavior is independent of batch failure tolerance. These limitations make complex chain-batch compositions unreliable for production workflows without workarounds.

---

# Core Concepts

- **Batch-of-chains:** `Bus::batch([[$a1, $a2], [$b1, $b2]])` — parallel chains under batch tracking.
- **Chain-of-batches:** `Bus::chain([Bus::batch([$a, $b]), Job2])` — ordered pipeline with parallel fan-out steps.
- **Independent failure domains:** Chain failures are chain-scoped. Batch failure tolerance is batch-scoped. They interact unpredictably.
- **Abandoned jobs:** When a chain aborts mid-execution, jobs after the failure are never dispatched. They exist as serialized payloads in the chain structure but are not queue jobs.
- **`total_jobs` vs actual executions:** `total_jobs` counts jobs that may never run due to chain abort. `pending_jobs` never decrements for those jobs — batch state is permanently skewed.

---

# When To Use

- Only when necessary and with full awareness of limitations
- Batch-of-chains with `then()` + `catch()` (avoiding `finally()`)
- Prototyping where reliability is not critical

---

# When NOT To Use

- Production-critical workflows without manual compensation and monitoring
- When `finally()` is needed for post-processing
- When chain-of-batches requires inner batch failure to stop the outer chain

---

# Best Practices

- **Replace batch-of-chains with separate batches.** Each logical chain gets its own `Bus::batch()` with individual callbacks. *Why: Per-chain batches avoid the abandoned-jobs problem entirely — each batch tracks only the jobs that actually run.*
- **For chain-of-batches, check inner batch state explicitly.** Before the chain advances, verify the inner batch's `failedJobs` count in the job's `handle()` method. *Why: The outer chain only sees the batch job's success/failure status — it doesn't know about partial inner batch failures.*
- **Prefer flat batch over batch-of-chains for short sequences (2-3 jobs).** Flatten chains into individual batch jobs and handle ordering constraints in job code. *Why: Removes composition complexity — the batch tracks every job and callbacks work correctly.*
- **Implement watchdog monitoring for unfinished batches.** Query `job_batches` where `finished_at IS NULL AND created_at < NOW() - INTERVAL 1 HOUR`. Investigate. *Why: Stuck batches from mid-chain failures are invisible in normal queue monitoring.*

---

# Performance Considerations

- Batch-of-chains is efficient — all chains run concurrently; no serialization bottleneck.
- Chain-of-batches serializes parallelism — outer chain waits for each batch to complete before proceeding.
- Abandoned jobs waste serialization effort — `PrepareBatchChain` serializes all chain jobs upfront, even ones that never run.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| `allowFailures()` does not fix chain abort | Confusing batch-scoped and chain-scoped failure handling | Chain still breaks; `finally()` still doesn't fire | Use `then()` + `catch()` |
| Chain-of-batches with `allowFailures()` advances on partial failure | Outer chain only checks batch job success | Downstream jobs operate on incomplete data | Explicitly check batch state in job |
| Not testing mid-chain failure in batch | Coverage gap | Undiscovered in production until a chain fails mid-execution | Test all combination failure scenarios |

---

# Examples

```php
// Instead of batch-of-chains:
Bus::batch([[$a1, $a2], [$b1, $b2]])
    ->finally(fn($b) => cleanup()) // NEVER FIRES on mid-chain failure
    ->dispatch();

// Use separate batches with a coordinator:
$batchA = Bus::batch([$a1, $a2])->finally(fn($b) => cleanupA())->dispatch();
$batchB = Bus::batch([$b1, $b2])->finally(fn($b) => cleanupB())->dispatch();
```

---

# Related Topics

- **K012 allowFailures Behavior (K012)** — Batch vs chain failure scope
- **K013 Bus::chain Sequential Jobs (K013)** — Chain abort mechanics
- **K014 Batch of Chains Pattern (K014)** — The finally() bug in detail
