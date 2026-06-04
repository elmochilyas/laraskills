# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: Job Lifecycle State Machine
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary
Every queued job progresses through a defined state machine: **dispatched → queued → popped → processing → (released/exception/failed) → completed**. The Worker class drives this lifecycle in an infinite loop. Understanding the exact state transitions, especially the "release → re-queued → re-popped → retry" cycle and the "exception → failed → store" terminal transition, is essential for debugging stuck jobs, timing out behavior, and retry logic anomalies. The state machine is not documented anywhere as a single diagram — it's derived from the Worker source code.

# Core Concepts
- **Dispatched**: Job has been pushed to the queue backend via `PendingDispatch` destructor. Payload exists in backend storage.
- **Popped**: Worker has retrieved the job from the backend. The job is now "reserved" (not visible to other workers during `retry_after` window).
- **Processing**: Worker is executing `$job->handle()`. Middleware runs before and after.
- **Released**: Job called `$this->release($delay)`. The job is re-queued with a delay. `$attempts` increments.
- **Exception thrown**: `handle()` threw an exception. Worker checks if `$attempts < $tries`. If yes: release with backoff. If no: mark as failed.
- **Failed**: Job has exhausted all retry attempts. The worker stores in `failed_jobs` table (or DynamoDB). `$job->failed()` is called.
- **Completed**: Job executed successfully (no exception). Worker deletes the job from the backend.

# Mental Models
- **Pinball machine**: The job is the ball. It travels through lanes (dispatched → queued → popped), hits bumpers (middleware), may fall into drains (exceptions that release the ball for another try), and eventually ends in the success basket or the failure gutter.
- **Finite state machine**: Each state has allowed transitions. From "failed" you cannot go back to "processing" — that requires external action (`queue:retry`).

# Internal Mechanics

```
dispatched → queued → popped → [middleware] → handle()
                                                ↓
                                         success? → delete() → completed
                                        /         \
                                  exception → attempts < tries?
                                               /              \
                                         release()         fail()
                                             ↓                 ↓
                                          re-queued        failed_jobs
```

- State transitions are driven by the Worker's `process()` method.
- On `pop()`, the driver marks the job as "reserved" (Redis: remove from list + place on reserved list; SQS: change visibility timeout; Database: set `reserved_at`).
- On success: `$job->delete()` removes from backend.
- On exception: `$job->release($backoff)` re-pushes the job to the queue with updated `attempts`.
- `maxExceptions` is checked separately — it allows exceptions even if `$tries` is not exhausted.
- Failed jobs are stored via `$this->fail()` which dispatches `Queue::failing` event and calls `$job->failed()`.

# Patterns
## Graceful Degradation on State Machine Edges
- **Purpose**: Handle non-standard state transitions programmatically.
- **Benefit**: Keep the machine progressing even at edge cases.
- **Tradeoff**: More complex worker logic; possible infinite loops.

## Manual State Injection
- **Purpose**: Force a job to a specific state (e.g., force-fail a stuck job).
- **Benefit**: Operational intervention without code changes.
- **Tradeoff**: Can bypass retry logic and idempotency checks.

## State Monitoring via Events
- **Purpose**: Observe state transitions for logging, alerting, or metrics.
- **Benefit**: Real-time visibility into job lifecycle.
- **Tradeoff**: Event listener overhead on every transition.

# Architectural Decisions
- **Release → re-queue should always have delay**: Immediate re-release without delay causes tight retry loops that flood the queue.
- **Fail is terminal**: Once a job is marked failed, the framework does not automatically retry. Only external triggers (`queue:retry`, Horizon retry button) re-enter the state machine.
- **Delete is final**: A completed job is removed from the queue. No audit trail by default. Use events for persistence.

# Tradeoffs
Release with backoff | Allows transient errors to resolve naturally | Delays valid jobs; backoff tuning is trial-and-error
Immediate fail on first exception | Fast failure, no wasted processing | Fragile — transient errors kill jobs unnecessarily
Manual state injection via queue:retry | Operational safety valve | Requires human intervention; no automation

# Performance Considerations
- Each state transition involves at least one backend operation (queue push/pop/delete). For Redis: one `BRPOP`, one `LPUSH` (on release), one `DELETE` (on success).
- Failed jobs add another backend write (DB insert or DynamoDB put).
- The state machine operates per-job — at high throughput (1000+ jobs/sec), the cumulative overhead of transitions is measurable.

# Production Considerations
- Monitor fail rate as the ratio of terminal "failed" states to total "completed" states.
- Stuck jobs in "processing" state (reserved but never completed) indicate worker crashes or timeout misconfiguration.
- `attempts` count persists across workers — if you change `$tries` from 3 to 10, all existing attempts count toward the new limit.
- The "released" state is invisible in most queue backends — a released job looks like a new job in the queue.

# Common Mistakes
- **Modifying `$tries` while jobs are in flight**: The new `$tries` value applies to the next retry attempt, so partially-processed jobs may use unexpected retry counts.
- **`release()` in a batch job that ignores batch state**: Releasing a batch job re-executes it, but the batch's progress tracking may double-count or mis-tally events.
- **Calling `delete()` after `release()`**: If both are called, `delete()` takes precedence and the job is removed entirely, skipping the retry.

# Failure Modes
- **Infinite release loop**: A job that always throws an exception and has `$tries = 0` (or no `$tries` set) retries forever. The worker keeps re-queuing it.
- **Phantom processing jobs**: If a worker crashes after popping a job but before deleting it, the job sits in "processing" state until `retry_after` expires. It then re-enters "queued" state.
- **State machine deadlock**: A job that requires external data to progress but that data will never arrive (e.g., waiting on a webhook that depends on this job completing). No timeout mechanism breaks the cycle.

# Ecosystem Usage
- **Laravel Horizon**: Supervisors track worker state and can detect stuck processes. Horizon's "retry" button re-enters failed jobs into the state machine.
- **Laravel Pulse**: Records job completion metrics — failed vs. succeeded state distribution.
- **Laravel's `Queue::failing` event**: Fires at the "dispatched → failed" transition. Used by monitoring and alerting systems.

# Related Knowledge Units
- K016 Failure Taxonomy (release/exception/fail) | K024 Retry Workflow (re-entering the state machine)

## Research Notes
- The Queue::route() method introduced in Laravel 11 allows mapping job classes to specific connection/queue combinations at dispatch time, evaluated lazily — this changes the mental model from dispatch-time resolution to routing-time resolution.
- Laravel 12 introduced the ailover connection driver for queue HA, but automatic failback is not supported — the primary connection must be manually restored after it recovers.
- The fter_commit option has different behavior across drivers: Redis queues honor it via transaction callbacks; SQS queues rely on the fter_commit config key at the connection level.
- Octane compatibility for queue dispatching is an ongoing concern — the QueueManager is resolved from the container and may hold stale references between requests in persistent application contexts.
- Serializing models for queued jobs uses ModelIdentifier under the hood — the trait SerializesModels handles this by converting model instances to identifiers before serialization and rehydrating them after unserialization.
- Community benchmarks show Redis queue throughput of 10,000+ jobs/second with Horizon, while SQS throughput is limited by API rate limits (3,000 messages/second per account per region initially).
