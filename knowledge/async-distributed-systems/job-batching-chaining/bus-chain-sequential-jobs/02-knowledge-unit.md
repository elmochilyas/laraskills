# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Batching & Chaining
Knowledge Unit: `Bus::chain` for Sequential Job Execution
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
`Bus::chain` provides ordered, sequential job execution with fail-fast semantics. A chain runs jobs one after another: job 1 must succeed before job 2 starts. If any job in the chain exhausts its retries, the entire chain aborts — remaining jobs are never dispatched. This is fundamentally different from `Bus::batch` (parallel, tolerant of failure). Chains are the correct tool when each step depends on the previous one's side effects, and partial execution would leave the system in an inconsistent state. The chain's only lifecycle hook is `catch()` — there is no `then()` or `finally()`.

# Core Concepts
- **Chain dispatch**: `Bus::chain([$job1, $job2, $job3])->dispatch()` — jobs execute in order.
- **Fail-fast**: If `$job1` fails (exhausts retries), `$job2` and `$job3` are never dispatched.
- **`catch()` callback**: The only lifecycle hook. Fires when any job in the chain fails after retries are exhausted.
- **`onConnection()` / `onQueue()`**: Applies to all jobs in the chain. Individual jobs can override via their own properties.
- **Chain vs batch composition**: Chains can contain batch operations and vice versa (batch-of-chains, chain-of-batches).

# Mental Models
- **Assembly line**: Each station (job) processes sequentially. If station 2 fails, station 3 never sees the work. The line stops and alerts the supervisor (catch callback).
- **Dominoes**: One falls, the next falls. But if a domino doesn't fall, the rest stay standing.

# Internal Mechanics
- `Bus::chain($jobs)` returns `Illuminate\Bus\PendingChain`.
- `PendingChain::dispatch()` dispatches the first job with a `$chained` property containing the serialized next jobs.
- Each job in the chain has its `$chained` array populated with the remaining jobs, serialized.
- When a job completes successfully, the worker checks `$job->chained[]`. If present, it dispatches the next job (from the serialized chain).
- This means chain progression is driven by the successful job, not by a central coordinator.
- On failure, the chain stops because the failed job never triggers the chain advancement.
- The `catch()` callback fires when the `failed()` method is called on any job in the chain (after retries exhausted).

# Patterns
## Transactional Workflow
- **Purpose**: Ensure a series of dependent operations either all succeed or the chain aborts.
- **Benefit**: Automatic rollback semantics via the fail-fast mechanism.
- **Tradeoff**: No automatic compensation; previous jobs' effects are not rolled back.

## Idempotent Step Chain
- **Purpose**: Chain steps that are safe to retry individually.
- **Benefit**: Each job handles its own $tries and backoff; chain only advances on definitive success.
- **Tradeoff**: Chain success depends on each step's transient error tolerance.

## Catch-Based Compensation
- **Purpose**: Revert or compensate for partially completed chain work.
- **Benefit**: The catch callback fires once with the exception context.
- **Tradeoff**: Catch callback is serialized; must not reference `$this`.

# Architectural Decisions
- **Use `Bus::chain` when**: Job B depends on job A's success, partial completion is worse than no completion, ordering is critical.
- **Use `Bus::batch` when**: Jobs are independent, parallel execution is desired, completion callbacks are needed.
- **Chain size limit**: Practical limit is ~10 jobs. Beyond that, consider a saga pattern or workflow engine.

# Tradeoffs
Fail-fast sequencing | Clear ordering, no partial execution | No automatic compensation; previous jobs' effects remain
Per-job retry | Each step handles its own failures independently | Chain can stall on a repeatedly failing job
catch() only callback | Single point for failure handling | No success/progress/finally callbacks

# Performance Considerations
- Chain throughput = sum of individual job times. No parallelism.
- Chain jobs cannot execute concurrently by definition — each job must wait for the previous.
- The serialization of `$chained` array adds overhead proportional to chain length.
- The `catch()` callback is serialized into the first job's payload — it's carried through the entire chain.

# Production Considerations
- Chain jobs should be idempotent. If a worker crashes after job 1 completes but before job 2 dispatches, the chain breaks. Manual recovery is needed.
- The `catch()` callback fires in the context of the failed job. It has access to the exception via `$e`.
- Monitor for "broken chains" — chains where an intermediate job completed but the next job was never dispatched. Indicates worker crash or timeout.
- On deployment, in-flight chains continue with the old code. New code takes effect for new chains.

# Common Mistakes
- **Using chains for independent work**: If jobs don't depend on each other, use `Bus::batch` for parallelism.
- **Assuming chain rollback**: Chain failure does NOT undo previously completed jobs. Each job's side effects persist. Use compensating actions in `catch()` if needed.
- **Not setting per-job `$timeout`**: A chain is only as fast as its slowest job. Ensure each job has an appropriate `$timeout`.
- **Relying on chain ordering for distributed consistency**: Network partitions, worker crashes, and timing issues can break chain ordering guarantees.

# Failure Modes
- **Broken chain on worker crash**: Worker processes job 1 successfully, commits work, but crashes before dispatching job 2. Job 1's work is done, but job 2 never runs. No automatic recovery.
- **`catch()` callback on all jobs (sync queue only)**: On sync queue, `failed()` is called on ALL previously successful jobs when a chain fails. On async queues, only the failed job's `failed()` is called. This inconsistency is a known behavior.
- **Chain timeout accumulation**: If each of 5 jobs takes 10 seconds, the chain takes 50 seconds. Total timeout is the sum, not the max. Ensure worker `--timeout` covers the total chain duration.

# Ecosystem Usage
- **Laravel framework**: Used internally for queued listener chains and notification sending sequences.
- **Laravel Horizon**: Displays chain jobs linked together in the dashboard.
- **Spatie packages**: Webhook delivery chains can use `Bus::chain` for ordered webhook dispatch to multiple endpoints.

# Related Knowledge Units
- K008 Bus::batch Architecture (contrast: parallel vs sequential) | K014 Batch of Chains Pattern (composition) | K089 Chain-Batch Interaction Limitations

## Research Notes
- Job batches in Laravel use a Redis-backed BatchRepository that tracks batch state (total jobs, pending jobs, failures) — the atch:table Artisan command creates a migration for a database-backed fallback.
- The llowFailures method on a batch allows remaining jobs to continue processing even when some jobs in the batch fail — this is distinct from the catch callback which fires when any job fails.
- Batch of chains pattern (Bus::chunk) creates independent chains that each execute sequentially — failure in one chain does not affect other chains, unlike a single chain where failure stops execution.
- The Bus::batch and Bus::chain interaction has known limitations — chains within batches cannot have their own catch/finally callbacks, and batch-level callbacks fire independently of chain completion.
- Batch deployment hazards occur when pushing new batch-based code to production — running jobs from the old deployment may not recognize the new batch structure, causing orphaned batches.
- The Batchable trait provides cancel() and cancelled() methods for cooperative cancellation — the job must periodically check $this->batch()->cancelled() to support cancellation mid-execution.
- Batch state locking uses Laravel's cache lock to prevent race conditions on batch updates — Redis locks are recommended for high-throughput batch environments.
- Laravel 12 introduced the atchProgress() helper on job batches, providing a percentage-based progress indicator for real-time UI updates.
