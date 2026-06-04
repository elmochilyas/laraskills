# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Batching & Chaining
Knowledge Unit: Batch of Chains Pattern and `finally()` Callback Edge Cases
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary
The "batch of chains" pattern — `Bus::batch([ [$a1, $a2], [$b1, $b2], [$c1, $c2] ])` — combines parallel batch execution with sequential chains within each unit. Each chain runs independently in order, while all chains execute in parallel across available workers. This enables complex multi-step pipelines. However, a critical edge case exists: if a job fails mid-chain (e.g., $a1 succeeds, $a2 fails), the remaining jobs in that chain ($a3, $a4) are never dispatched. The batch's `finally()` callback never fires because `allJobsHaveRanExactlyOnce()` evaluates to `false` — those undispatched jobs remain in the "pending" count forever.

# Core Concepts
- **Batch of chains**: An array of arrays passed to `Bus::batch()`. Each inner array is a chain. Outer batch tracks all chains.
- **Independent chain execution**: Each chain runs its jobs sequentially. Multiple chains can run in parallel across workers.
- **Mid-chain failure abort**: If job N in a chain fails, jobs N+1...end of that chain are never dispatched.
- **`finally()` never fires**: This is the known edge case. The batch condition for `finally()` requires every job to have run exactly once (success or fail). Mid-chain failures leave jobs that never ran, so the condition never becomes true.

# Mental Models
- **Factory production lines**: Multiple assembly lines (chains) run simultaneously in one factory (batch). Each line has sequential stations. If a station on line A breaks, line A stops but lines B and C continue. However, the factory manager (batch finally) waits indefinitely for line A's broken stations to report, which they never do.
- **Restaurant service**: Multiple tables (chains), each with course-by-course service (sequence). If table 2's main course fails to arrive, the remaining courses for table 2 are cancelled. The manager waits for dessert service at table 2, which never happens.

# Internal Mechanics
- The `batch-of-chains` is constructed by passing an array where element is an array: `Bus::batch([[$a1, $a2], [$b1, $b2]])`.
- `PendingBatch::add()` detects sub-arrays and calls `PrepareBatchChain::prepare()` for each.
- `PrepareBatchChain` sets `allOnQueue`/`allOnConnection` on the first job of each chain, then wraps the rest as chained jobs.
- The batch's `total_jobs` = number of top-level jobs across all chains. For `[[$a1, $a2, $a3], [$b1, $b2]]`, `total_jobs = 5`.
- When `$a2` fails (the second job of chain A), jobs `$a3` is never dispatched.
- The batch's `pending_jobs` count includes `$a3` (it was counted at dispatch time but never decremented).
- `allJobsHaveRanExactlyOnce()` checks `($this->pendingJobs - $this->failedJobs) === 0`. Since `$a3` is still pending and not failed, this is `pending_jobs > 0`, so `finally()` never fires.

# Patterns
## Manual Completion Tracking
- **Purpose**: Sidestep the `finally()` bug by tracking completion independently.
- **Benefit**: Reliable post-processing regardless of mid-chain failures.
- **Tradeoff**: More code, custom tracking state.

## Chain-Safe Error Handling
- **Purpose**: Prevent mid-chain failures by making jobs handle errors internally.
- **Benefit**: Chain always completes (even with compensatory action on failure).
- **Tradeoff**: Jobs swallow errors; failure visibility is reduced.

## Per-Chain Batch
- **Purpose**: Use separate batches per logical chain instead of batch-of-chains.
- **Benefit**: Each batch tracks its own chains independently; no shared `finally()` issue.
- **Tradeoff**: Lose unified batch callback across all work.

# Architectural Decisions
- **Avoid batch-of-chains with `finally()`**: The `finally()` callback is unreliable when any chain has a mid-chain failure. Use `then()` + `catch()` or manual tracking instead.
- **Use `allowFailures()` for chain completion**: Even with `allowFailures()`, mid-chain failures still leave undispatched jobs — `finally()` still doesn't fire. `allowFailures()` doesn't fix this.
- **Consider per-chain jobs as individual batches**: Instead of one batch-of-chains, dispatch N batches (one per chain) with individual callbacks.

# Tradeoffs
Batch of chains with finally() | Single callback for all work, concise code | Unreliable: finally() doesn't fire on mid-chain failure
Individual batches per chain | Reliable per-chain callbacks | More batch rows, separate tracking
Manual completion tracking | Complete control, reliable | Custom code, custom state management

# Performance Considerations
- The batch-of-chains pattern is efficient for parallel pipelines — each chain runs independently.
- The `finally()` bug means batches may remain in "pending" state indefinitely. Monitor for orphaned batches.
- Each chain's jobs are serialized into the parent chain structure — long chains increase serialization payload.

# Production Considerations
- Monitor for unfinished batches (no `finished_at` set). These are likely batch-of-chains with mid-chain failures.
- If the `finally()` bug is hit, batch completion callbacks never fire. Post-processing (cleanup, notification) must be triggered manually.
- The bug is a framework behavior, not likely to be fixed due to the design of chain-abandonment semantics.
- Workaround: Use `then()` + `catch()` instead of `finally()`. Only works if no mid-chain failures — but if all chains complete (no failures), `then()` fires. `catch()` fires for batches with failures that completed all their jobs.

# Common Mistakes
- **Assuming `allowFailures()` fixes the `finally()` bug**: `allowFailures()` allows other chains to continue, but mid-chain failures still leave undispatched jobs in the failed chain. `finally()` still doesn't fire.
- **Using `finally()` for critical post-processing**: If `finally()` is the trigger for post-batch work, it's unreliable in batch-of-chains. Use `then()` + `catch()` or manual tracking.
- **Not testing the mid-chain failure scenario**: Most teams test all-success and all-failure paths but not the specific mid-chain-failure-in-batch-of-chains case. This is where the bug manifests.

# Failure Modes
- **`finally()` never fires (the bug)**: The batch sits with `finished_at = null` forever. Already logged as a framework issue.
- **False completion with `then()`**: If a chain has a mid-chain failure but enough other chains complete, `then()` may fire if no jobs actually failed (only undispatched). This is incorrect — the batch didn't fully succeed.
- **Leaked batch rows**: Batches stuck in pending state (due to the finally bug) are not pruned by normal cleanup. They accumulate in `job_batches` table.

# Ecosystem Usage
- **Laravel framework**: The batch-of-chains pattern is documented but the `finally()` limitation is not. Framework tests cover the base case without mid-chain failures.
- **Laravel Horizon**: Shows batches with no `finished_at` as still running — cannot distinguish "truly running" from "stuck due to mid-chain failure."
- **Spatie packages**: Not directly related, but teams using batch-of-chains for multi-step webhook pipelines should be aware of this limitation.

# Related Knowledge Units
- K008 Bus::batch Architecture | K011 Batch Callbacks (finally semantics) | K012 allowFailures() Behavior | K089 Chain-Batch Interaction Limitations

## Research Notes
- Job batches in Laravel use a Redis-backed BatchRepository that tracks batch state (total jobs, pending jobs, failures) — the atch:table Artisan command creates a migration for a database-backed fallback.
- The llowFailures method on a batch allows remaining jobs to continue processing even when some jobs in the batch fail — this is distinct from the catch callback which fires when any job fails.
- Batch of chains pattern (Bus::chunk) creates independent chains that each execute sequentially — failure in one chain does not affect other chains, unlike a single chain where failure stops execution.
- The Bus::batch and Bus::chain interaction has known limitations — chains within batches cannot have their own catch/finally callbacks, and batch-level callbacks fire independently of chain completion.
- Batch deployment hazards occur when pushing new batch-based code to production — running jobs from the old deployment may not recognize the new batch structure, causing orphaned batches.
- The Batchable trait provides cancel() and cancelled() methods for cooperative cancellation — the job must periodically check $this->batch()->cancelled() to support cancellation mid-execution.
- Batch state locking uses Laravel's cache lock to prevent race conditions on batch updates — Redis locks are recommended for high-throughput batch environments.
- Laravel 12 introduced the atchProgress() helper on job batches, providing a percentage-based progress indicator for real-time UI updates.
