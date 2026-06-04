# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: Queue Priority via Multiple Queues
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Laravel implements queue priority through worker queue subscriptions, not through backend priority features. Workers specify `--queue=high,default,low` and process jobs from `high` first, then `default` when `high` is empty, then `low` when both are empty. This is polling-order priority — jobs in higher-priority queues are always consumed before lower-priority ones. For Redis and database drivers, this works seamlessly on a single connection. For SQS, each priority level requires a separate SQS queue URL because SQS has no internal priority mechanism.

# Core Concepts
- **Worker priority ordering**: `--queue=critical,default,reports` configures the worker to empty `critical` before looking at `default`, and `default` before `reports`.
- **Not real-time priority**: If a `critical` job arrives while the worker is processing a `reports` job, the current job finishes first. Priority only affects the next `pop()`.
- **SQS limitation**: SQS does not support multiple queues on one URL. Each priority level needs a separate SQS queue URL and separate workers or worker subscriptions.
- **Horizon multi-queue supervisors**: Horizon supervisors can subscribe to multiple queues with priority ordering, combined with auto-balancing that shifts workers between queues based on demand.

# Mental Models
- **Airport security lanes**: One lane for first class (high priority), one for economy (low priority). The agent (worker) processes first class passengers, and when that lane is empty, starts on economy. A first class passenger arriving while an economy passenger is being processed waits for the current passenger to finish.
- **Mail sorting**: You sort envelopes into piles: urgent, standard, bulk. You always process the urgent pile first, then standard, then bulk. A new urgent envelope arriving mid-sort doesn't interrupt the current envelope.

# Internal Mechanics
- When `--queue=high,default` is passed to `queue:work`, the worker constructs a prioritized array in `Worker::getQueue()`.
- On each `pop()` cycle, the worker iterates the queue array in order. It calls `$this->getNextJob($connection, $queue)` for each queue name.
- If a queue returns a job, it processes that job. On the next `pop()` cycle, it starts again from the first queue in the list.
- This means priority is enforced per-pop — not preemptively. High-priority jobs cannot interrupt a currently processing job of any priority.
- For database driver, the query includes `WHERE queue IN ('high', 'default') ORDER BY FIELD(queue, 'high', 'default')` or equivalent.

# Patterns
## Priority Tier Isolation
- **Purpose**: Ensure critical jobs never wait behind any other type.
- **Benefit**: Password resets, OTPs, payment confirmations process instantly.
- **Tradeoff**: Dedicated workers for high-priority queues may be idle during low-volume periods.

## Backpressure via Separate Workers
- **Purpose**: Prevent a flood of low-priority jobs from starving high-priority ones.
- **Benefit**: Each priority tier has guaranteed minimum throughput.
- **Tradeoff**: More workers, more memory, more complexity.

## SQS Priority via Queue Suffix
- **Purpose**: Simulate priority in SQS where separate queues are required.
- **Benefit**: Clear naming convention (`app-high`, `app-default`, `app-low`).
- **Tradeoff**: Must configure separate workers per SQS queue URL.

# Architectural Decisions
- **Number of priority tiers**: 2-3 tiers is optimal. Beyond 3, the benefit diminishes and operational complexity increases significantly.
- **Separate Horizon supervisor per tier**: For production, run a dedicated Horizon supervisor per priority tier with independent `minProcesses`/`maxProcesses` settings.
- **SQS**: Use separate queue URLs with separate worker processes. No Horizon support.

# Tradeoffs
Polling-order priority | Simple implementation, no backend features needed | Non-preemptive; current job finishes first
Dedicated workers per tier | Zero contention between tiers | Idle workers are wasted resources
SQS separate queues per tier | Works with SQS limitations | More AWS resources to manage

# Performance Considerations
- Worker polling overhead: Each pop iteration checks all queues. Empty high-priority queues add zero latency — the `BRPOP` call immediately moves to the next queue.
- The `--sleep` option adds delay between pop iterations. Priority only matters when there are jobs to process.
- At high throughput, ensure each priority queue has enough workers to prevent backlog in higher-priority queues.

# Production Considerations
- Define priority labels based on user-facing latency sensitivity: `critical` (<5s expected), `default` (<30s), `bulk` (<1h).
- Monitor wait time per queue — not just per connection. A spike in `default` wait time should not trigger a critical alert if `critical` is processing normally.
- For Horizon, use separate supervisors per priority tier with `balance=auto` so Horizon shifts resources during demand spikes.
- Retry priority: Failed jobs from `critical` queue should be retried with higher priority than failed `bulk` jobs.

# Common Mistakes
- **Using SQS with comma-separated `--queue`**: SQS queues are separate URLs. `--queue=high,default` on SQS only processes the first queue if the second isn't a valid URL.
- **Assuming priority is preemptive**: High-priority jobs don't interrupt low-priority jobs being processed. They simply get picked first in the next pop cycle.
- **Same worker for CPU-intensive and latency-sensitive jobs**: Even with priority queues, the shared worker pool means heavy jobs block light ones. Use separate supervisors.

# Failure Modes
- **Starvation of low-priority queues**: Under sustained high-priority load, low-priority queues never get processed. Monitor oldest-job-age on all queues.
- **Priority inversion**: If a high-priority job depends on a job in a lower-priority queue, the system deadlocks. Rare but catastrophic.
- **SQS priority misconfiguration**: Creating separate SQS queues but using the same worker for all — the worker processes one queue only.

# Ecosystem Usage
- **Horizon**: Each supervisor can specify `['queue' => ['critical', 'default']]` for priority ordering. Auto-balancing then allocates more processes to busy queues within the supervisor's scope.
- **Laravel Forge**: Forge's queue configuration UI shows `--queue` field for worker priority ordering.

# Related Knowledge Units
- K001 Queue Connections vs. Queues (foundational topology) | K002 Queue Driver Architecture (SQS vs Redis priority handling)

## Research Notes
- The Queue::route() method introduced in Laravel 11 allows mapping job classes to specific connection/queue combinations at dispatch time, evaluated lazily — this changes the mental model from dispatch-time resolution to routing-time resolution.
- Laravel 12 introduced the ailover connection driver for queue HA, but automatic failback is not supported — the primary connection must be manually restored after it recovers.
- The fter_commit option has different behavior across drivers: Redis queues honor it via transaction callbacks; SQS queues rely on the fter_commit config key at the connection level.
- Octane compatibility for queue dispatching is an ongoing concern — the QueueManager is resolved from the container and may hold stale references between requests in persistent application contexts.
- Serializing models for queued jobs uses ModelIdentifier under the hood — the trait SerializesModels handles this by converting model instances to identifiers before serialization and rehydrating them after unserialization.
- Community benchmarks show Redis queue throughput of 10,000+ jobs/second with Horizon, while SQS throughput is limited by API rate limits (3,000 messages/second per account per region initially).
