# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: `block_for` Redis Option for Worker Polling
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
The `block_for` configuration option in the Redis queue connection controls how long the worker's `BRPOP` call blocks waiting for a job. Without it (or set to `null`), the worker polls Redis in a tight loop — every iteration executes `BRPOP` with a 0-second timeout, which returns immediately if no job is available, then sleeps for `--sleep` seconds. With `block_for` set to a positive value (e.g., 5), `BRPOP` blocks on the Redis server side for up to that many seconds, eliminating all polling traffic when the queue is idle. This dramatically reduces Redis CPU usage and network round-trips for idle queues.

# Core Concepts
- **`BRPOP`**: Redis blocking list pop command. Takes a timeout in seconds. Returns an element immediately if available, otherwise blocks until an element arrives or the timeout expires.
- **Polling behavior**: Without `block_for`, `BRPOP` with timeout 0 returns immediately. Worker must sleep (`--sleep`) before retrying. Each cycle is a Redis round-trip even when queue is empty.
- **Blocking behavior**: With `block_for=5`, `BRPOP` holds the Redis connection open for up to 5 seconds waiting. If a job arrives within those 5 seconds, it returns immediately. No polling traffic.
- **Connection utilization**: Blocking `BRPOP` keeps a Redis connection occupied per worker process. If you have 50 worker processes with `block_for=5`, you have 50 idle-but-connected Redis connections.

# Mental Models
- **Doorbell vs checking**: Without `block_for`, the worker checks the mailbox every `--sleep` seconds (polling — checking even when empty). With `block_for`, the worker rings the doorbell and waits (blocking — only actives when a job arrives).
- **Phone call vs voicemail checking**: Polling: repeatedly calling your voicemail to check for messages. Blocking: staying on the line and the system tells you when a message arrives.

# Internal Mechanics
- `RedisQueue::pop()` calls `$this->getConnection()->brpop($this->queue, $this->blockFor)`.
- If `blockFor` is `null`, it's converted to 0 (immediate return).
- If a job is available: `BRPOP` returns immediately with `[queue_name, payload]`.
- If no job and `block_for=5`: Redis holds the connection. The worker thread blocks at the Redis client level. After 5 seconds, Redis returns `null`.
- When a job is pushed while a worker is blocking: Redis immediately returns the job to the `BRPOP` caller. The worker processes without waiting for the timeout.
- Multiple workers blocking on the same queue: Redis delivers each job to one worker. The others remain blocked.
- On job receipt, the worker processes, then loops back to `pop()`. If more jobs exist, `BRPOP` returns the next immediately. If empty, it blocks again.

# Patterns
## Idle Queue Management
- **Purpose**: Minimize Redis load when queues are frequently empty.
- **Benefit**: Drastically reduces Redis operations for low-volume queues.
- **Tradeoff**: Occupies Redis connections longer; connection pool sizing matters.

## Workload-Specific `block_for`
- **Purpose**: Tune per-queue based on expected job arrival pattern.
- **Benefit**: High-volume queues use low/no block_for (jobs available immediately); low-volume queues use high block_for (idle waiting).
- **Tradeoff**: Configuration per connection; cannot set per queue.

## Zero `block_for` with Cluster
- **Purpose**: When using Redis Cluster.
- **Benefit**: Avoids cross-node blocking complexities.
- **Tradeoff**: Higher polling overhead; increased worker CPU usage.

# Architectural Decisions
- **Set `block_for` to null or 0 for high-throughput queues**: Jobs are always available, so blocking adds no benefit. The `BRPOP` returns immediately with a job.
- **Set `block_for` to 5-10 for low-volume queues**: Reduces Redis CPU by 95%+ during idle periods. The worker responds to new jobs within the block timeout.
- **Set `block_for` to null for Redis Cluster**: `BRPOP` across cluster nodes is unreliable. Use polling with `--sleep`.
- **Set `block_for` proportionally to `--sleep`**: If `--sleep=3` and `block_for=5`, the worker blocks for 5 seconds, then if no job, loops and blocks again. The `--sleep` is bypassed because `BRPOP` already waited.

# Tradeoffs
High `block_for` (e.g., 10) | Near-zero Redis CPU when queue idle | Holds Redis connections per worker; jobs wait up to 10s in worst case
Zero/No `block_for` | Immediate loop, no connection held | Redis CPU increases from polling; `--sleep` delays responsiveness
Moderate (3-5) | Balanced Redis load and latency | Still some idle connection time; tuning required per workload

# Performance Considerations
- Without `block_for`, each worker executes ~1 `BRPOP` + 1 `--sleep` cycle per iteration when idle. At `--sleep=3`, that's 20 round-trips/minute per worker. 50 workers = 1000 round-trips/minute of idle traffic.
- With `block_for=5`, idle workers execute ~1 `BRPOP` every 5 seconds. That's 12 round-trips/minute per worker, but each holds a connection for 5 seconds.
- The connection pool must be sized to account for blocking workers. If `phpredis` has a connection pool of 10, 10 blocking workers consume the entire pool.
- Blocking `BRPOP` does not consume Redis CPU — it's an event-driven wait in Redis's event loop.

# Production Considerations
- Monitor Redis connected clients — each worker process with `block_for` adds one idle connection.
- If using `phpredis` persistent connections, blocking workers do not release connections back to the pool during the block period.
- Redis single-threaded model: a `BRPOP` call blocks the connection but not the Redis server. Other clients can still operate.
- For Predis (pure PHP), blocking connections tie up PHP process I/O — ensure PHP-FPM or worker process limits account for this.

# Common Mistakes
- **Setting `block_for` but not adjusting `--sleep`**: With `block_for` active, `--sleep` is redundant. The worker doesn't sleep — it blocks on `BRPOP`. Setting both can cause confusion in timing behavior.
- **Setting `block_for` too high with Predis**: Predis is blocking I/O in PHP. A 30-second `block_for` keeps the PHP process unresponsive for 30 seconds. Process signals (SIGTERM) are not processed during this block.
- **Using `block_for` with Redis Cluster**: `BRPOP` is not guaranteed to work correctly across cluster nodes. Jobs on other nodes may not trigger the block release.

# Failure Modes
- **Worker unresponsiveness**: With `block_for=30`, a worker is unresponsive to signals for up to 30 seconds. SIGTERM for graceful shutdown is delayed.
- **Connection pool exhaustion**: If all Redis connections in the pool are blocking on `BRPOP`, other Redis operations (cache, session, rate limiting) may queue up.
- **Silent blocking failures**: If the Redis server drops the connection during a `BRPOP`, the worker may not notice and continue waiting. Implement heartbeat or connection checks.

# Ecosystem Usage
- **RedisQueue**: The `block_for` option was introduced in Laravel 6.x and is specific to the Redis driver.
- **Horizon**: Horizon workers set their own blocking behavior internally, not using `block_for`. Horizon uses its own connection management.
- **Laravel Forge**: Forge's queue configuration exposes `block_for` as an advanced Redis option.

# Related Knowledge Units
- K002 Queue Driver Architecture (Redis driver context) | K058 `--max-jobs`, `--max-time` Worker Recycling (worker lifecycle)

## Research Notes
- The Queue::route() method introduced in Laravel 11 allows mapping job classes to specific connection/queue combinations at dispatch time, evaluated lazily — this changes the mental model from dispatch-time resolution to routing-time resolution.
- Laravel 12 introduced the ailover connection driver for queue HA, but automatic failback is not supported — the primary connection must be manually restored after it recovers.
- The fter_commit option has different behavior across drivers: Redis queues honor it via transaction callbacks; SQS queues rely on the fter_commit config key at the connection level.
- Octane compatibility for queue dispatching is an ongoing concern — the QueueManager is resolved from the container and may hold stale references between requests in persistent application contexts.
- Serializing models for queued jobs uses ModelIdentifier under the hood — the trait SerializesModels handles this by converting model instances to identifiers before serialization and rehydrating them after unserialization.
- Community benchmarks show Redis queue throughput of 10,000+ jobs/second with Horizon, while SQS throughput is limited by API rate limits (3,000 messages/second per account per region initially).
