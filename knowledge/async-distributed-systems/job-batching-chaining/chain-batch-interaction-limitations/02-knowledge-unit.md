# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Batching & Chaining
Knowledge Unit: Chain-Batch Interaction Limitations
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary
The interaction between chains and batches has several undocumented limitations. Chains inside batches (batch-of-chains) have the `finally()` never-firing bug when mid-chain failure occurs. Batches inside chains (chain-of-batches) complete each batch step before the chain advances, but batch cancellation from a failed inner job does not propagate correctly to the outer chain. Additionally, `allowFailures()` on the outer batch does not prevent inner chains from aborting after a failure — chain abort behavior is independent of batch failure tolerance. These limitations make complex chain-batch compositions unreliable for production workflows without workarounds.

# Core Concepts
- **Batch-of-chains**: `Bus::batch([[$a1, $a2], [$b1, $b2]])` — parallel chains under batch tracking.
- **Chain-of-batches**: `Bus::chain([Bus::batch([$a, $b]), Job2])` — ordered pipeline with parallel fan-out steps.
- **Independent failure domains**: Chain failures are chain-scoped. Batch failure tolerance is batch-scoped. They interact unpredictably.
- **Abandoned jobs**: When a chain aborts mid-execution, jobs after the failure are never dispatched. They exist as serialized payloads in the chain structure but are not queue jobs.

# Mental Models
- **Forked railroad**: Batch-of-chains is like multiple railroad lines (chains) running in parallel. If one line has a derailment (failure), the trains behind the derailment on that line never move. The station master (batch callback) can only declare "all trains arrived" when every scheduled train on every line has arrived — but the ones behind the derailment never will.
- **Nested Russian doll**: Chain-of-batches = outer doll opens (chain step), revealing inner dolls (batch jobs). The next outer doll doesn't open until all inner dolls are done.

# Internal Mechanics
- In batch-of-chains, `PendingBatch::add()` detects sub-arrays and wraps each as a chain. `total_jobs = sum of chain lengths`. `pending_jobs` initialized to this total.
- When a chain job fails, `$this->fail()` is called. For non-last jobs in chain, remaining serialized jobs in `$this->chained` are never dispatched.
- But those remaining jobs were counted in `total_jobs` and `pending_jobs`. They stay in the pending count forever.
- `allJobsHaveRanExactlyOnce()` returns `false` because `pending_jobs > 0` and `failed_jobs` doesn't cover the aborted jobs.
- In chain-of-batches, the batch is an inner operation. The outer chain's next job dispatches only when the current job completes successfully. If the inner batch's `then()` fires, the chain advances. If the inner batch's `catch()` fires (but the batch job didn't throw — the batch handled it via `allowFailures()`), the chain may still advance because the batch job itself succeeded.
- This means a chain-of-batches with `allowFailures()` may advance even though some inner batch jobs failed — the chain only checks whether the outer batch job succeeded.

# Patterns
## Independent Failure Recovery
- **Purpose**: Handle mid-chain failures within a batch-of-chains manually.
- **Benefit**: Post-processing runs regardless of mid-chain failures.
- **Tradeoff**: Custom tracking; no reliance on batch callbacks.

## Batch-in-Chain with Completion Check
- **Purpose**: Verify batch completion state before allowing chain to advance.
- **Benefit**: Guard against advancing after partial batch failure.
- **Tradeoff**: Code to check batch state before chain progression.

## Replace Batch-of-Chains with Separate Batch Dispatch
- **Purpose**: Avoid composition issues entirely.
- **Benefit**: Each chain is its own batch; individual callbacks work correctly.
- **Tradeoff**: No single "all done" callback.

# Architectural Decisions
- **Avoid batch-of-chains for production workflows**: The `finally()` bug and abandoned-job pattern make it unreliable. Use separate batches with per-batch callbacks and a coordinator job.
- **Avoid chain-of-batches for critical ordering**: The inner batch's composite state (some jobs succeeded, some failed) is not communicated to the outer chain. Use explicit state checks.
- **Prefer flat batch over batch-of-chains**: If chains are short (2-3 jobs), flatten them into a single batch and handle ordering constraints in individual job code.

# Tradeoffs
Batch-of-chains | Parallel pipeline execution, single tracking ID | finally() bug; abandoned jobs; unreliable callbacks
Separate batches per chain | Reliable per-chain callbacks | No unified completion callback
Chain-of-batches | Ordered fan-out | Inner batch failure state not propagated to chain

# Performance Considerations
- Batch-of-chains is efficient for parallel work — all chains run concurrently.
- Chain-of-batches serializes parallelism: the outer chain waits for each batch to complete before proceeding.
- Abandoned jobs (from mid-chain failure) waste the serialization effort that went into preparing them.

# Production Considerations
- Monitor for unfinished batches where `pending_jobs > 0` but `finished_at = null`. These are likely batch-of-chains with mid-chain failures.
- For batch-of-chains with critical post-processing, implement a watchdog that detects stuck batches and triggers manual completion.
- Consider limiting chain length within batches to 2-3 jobs max to reduce the probability of mid-chain failure.
- Test all composition configurations (batch-of-chains, chain-of-batches) with failure scenarios before production.

# Common Mistakes
- **Assuming `allowFailures()` on batch fixes chain abort**: `allowFailures()` affects whether the batch continues dispatching OTHER chains. A chain that aborted mid-execution is still broken regardless of `allowFailures()`.
- **Using `finally()` for critical post-processing in batch-of-chains**: `finally()` is unreliable in this configuration. Use `then()` + `catch()` + independent monitoring.
- **Not testing the mid-chain failure + batch combination**: Most tests only cover all-success or all-failure. The mid-chain failure in a batch is rarely tested.
- **Assuming chain-of-batches rolls back on inner failure**: The outer chain only sees the batch job completion status. If the batch job succeeded (even with inner failures under `allowFailures()`), the chain advances.

# Failure Modes
- **Orphaned chain jobs**: Mid-chain failure leaves remaining chain jobs as serialized payloads in the job's `$chained` property. No automatic cleanup.
- **Double counting in batch**: A batched chain job fails and is retried. On success, the batch counts it as succeeded. If the original failure was already counted as failed, both success and failure are now counted — `total_jobs` vs actual completions mismatch.
- **Chain-of-batches with partial failure**: Inner batch has some failed jobs (under `allowFailures()`). The outer chain believes the step "succeeded" (the batch job didn't throw). Downstream chain jobs operate on partial data.
- **Infinite batch waiting**: Batch-of-chains where one chain has a mid-chain failure. The batch has `pending_jobs = X` forever. No timeout mechanism cancels it.

# Ecosystem Usage
- **Laravel framework**: These limitations exist in the core framework. The `finally()` not-firing scenario on batch-of-chains is a known issue with acknowledged limitations in the design.
- **Laravel Horizon**: Cannot detect batch-of-chains composition — shows all jobs under one batch ID.
- **Spatie packages**: Not directly affected, but teams using Spatie with batch-of-chains patterns should test these edge cases.

# Related Knowledge Units
- K012 `allowFailures()` Behavior | K013 `Bus::chain` Sequential Jobs | K014 Batch of Chains Pattern (the finally() bug)

## Research Notes
- Job batches in Laravel use a Redis-backed BatchRepository that tracks batch state (total jobs, pending jobs, failures) — the atch:table Artisan command creates a migration for a database-backed fallback.
- The llowFailures method on a batch allows remaining jobs to continue processing even when some jobs in the batch fail — this is distinct from the catch callback which fires when any job fails.
- Batch of chains pattern (Bus::chunk) creates independent chains that each execute sequentially — failure in one chain does not affect other chains, unlike a single chain where failure stops execution.
- The Bus::batch and Bus::chain interaction has known limitations — chains within batches cannot have their own catch/finally callbacks, and batch-level callbacks fire independently of chain completion.
- Batch deployment hazards occur when pushing new batch-based code to production — running jobs from the old deployment may not recognize the new batch structure, causing orphaned batches.
- The Batchable trait provides cancel() and cancelled() methods for cooperative cancellation — the job must periodically check $this->batch()->cancelled() to support cancellation mid-execution.
- Batch state locking uses Laravel's cache lock to prevent race conditions on batch updates — Redis locks are recommended for high-throughput batch environments.
- Laravel 12 introduced the atchProgress() helper on job batches, providing a percentage-based progress indicator for real-time UI updates.
