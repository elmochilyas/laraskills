# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: Queue Driver Architecture (sync/database/redis/sqs/beanstalkd/null)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Laravel ships six queue drivers plus a failover driver, each implementing the same `Illuminate\Contracts\Queue\Queue` contract. The driver choice determines throughput, durability, operational complexity, and ecosystem compatibility (Horizon, Horizon only works with Redis). Redis is the production default for most teams — it combines high throughput with zero additional infrastructure if Redis is already used for cache. SQS suits AWS-native serverless architectures but loses Horizon compatibility. The database driver is a fallback for low-volume applications only. Choosing correctly upfront avoids costly migrations.

# Core Concepts
- **sync**: Executes jobs immediately in the current process. No serialization, no queue storage. Used for testing and local development.
- **database**: Stores jobs in a MySQL/PostgreSQL table. Workers poll the table with `SELECT ... FOR UPDATE`. Simple infrastructure but poor throughput.
- **redis**: Uses Redis lists for queue storage, `BRPOP` for blocking pop. Supports atomic operations for unique jobs and rate limiting. Only driver compatible with Horizon.
- **sqs**: Amazon Simple Queue Service. Fully managed, auto-scaling, no servers. Supports FIFO for exactly-once ordering. Separate queue URL per named queue.
- **beanstalkd**: Simple protocol, tube-based queues. Minimal, but ecosystem support is limited.
- **null**: Discards all pushed jobs. Useful for disabling queues in testing or specific environments.
- **failover**: Meta-driver wrapping multiple connections. Dispatches to secondary if primary is unreachable.

# Mental Models
- **Interface contract**: Every driver implements `push()`, `pop()`, `delete()`, `release()`. The worker doesn't know which driver it's talking to — the contract abstracts it.
- **Storage taxonomy**: sync = no storage, database = SQL table, redis = in-memory list, sqs = remote HTTP API, beanstalkd = TCP protocol.
- **Speed vs durability spectrum**: sync (fastest, no durability) → redis (fast, memory with persistence) → database (slower, full ACID) → SQS (slowest per-op, highest durability).

# Internal Mechanics
- Each driver has a corresponding Connector class registered in `QueueManager` via service provider.
- `ConnectorInterface::connect(array $config)` returns a Queue instance.
- The `RedisQueue` uses `PhpRedis` or `Predis` to call `LPUSH` (push) and `BRPOP` (pop). Blocking pop with `block_for` option prevents busy-waiting.
- The `DatabaseQueue` inserts a row into `jobs` table, then workers poll with `SELECT * FROM jobs WHERE queue = ? LIMIT 1 FOR UPDATE SKIP LOCKED`.
- The `SqsQueue` sends HTTP requests to AWS API: `SendMessage` for push, `ReceiveMessage` for pop, `DeleteMessage` on success, `ChangeMessageVisibility` for release.
- Workers run an infinite loop: pop job → process → delete/release → repeat.

# Patterns
## Driver Selection by Scale
- **Purpose**: Match driver to expected job volume.
- **Benefits**: Avoid premature optimization on one side, production failures on the other.
- **Tradeoffs**: Database works for <1000 jobs/hour; Redis for <100K jobs/hour; SQS for unlimited scale.

## Dual-Driver Strategy
- **Purpose**: Use different drivers for different workloads (e.g., Redis + SQS).
- **Benefits**: Critical jobs get Redis speed, bulk jobs get SQS unlimited throughput.
- **Tradeoffs**: Two backends to monitor, no cross-connection job ordering.

## Failover Wrapping
- **Purpose**: Automatic HA for queue connection failures.
- **Benefits**: Graceful degradation when primary backend is unavailable.
- **Tradeoffs**: No automatic recovery when primary comes back; jobs may be duplicated during failover window.

# Architectural Decisions
- **Use Redis** if: already running Redis for cache, need Horizon, need job middleware (unique, rate-limited), want minimal operations overhead.
- **Use SQS** if: AWS-native stack, want zero infrastructure management, need Lambda integration for serverless processing, processing >100K jobs/hour.
- **Use database** if: Redis not available, job volume <100/hour, can't add infrastructure, tolerance for higher latency.
- **Use failover** if: queue availability is critical, two backends are acceptable, operational complexity is manageable.

# Tradeoffs
Redis | Fast, Horizon-compatible, atomic ops | Memory-bound, persistence tradeoffs, eviction risk
SQS | Unlimited scale, fully managed, Lambda integration | No Horizon, higher per-op cost, 256KB payload limit
Database | Zero additional infrastructure | Polling overhead, write contention at scale, no Horizon
sync | Instant execution, no infrastructure | Not distributed, loses async benefit
Beanstalkd | Simple, lightweight protocol | Dying ecosystem, limited tooling

# Performance Considerations
- **Redis**: ~10,000 jobs/second per instance. Memory: each job payload is stored in memory until processed. Eviction policies can silently drop queue data.
- **SQS**: ~300 transactions/second per queue by default (can request increase). 256KB max payload. Cost scales with volume (~$0.40/million requests).
- **Database**: Each job dispatch + pop = SQL write + SQL read. At 1000 jobs/hour, this becomes measurable load. At 10K/hour, the `jobs` table becomes a contention point.
- **Payload size**: Larger payloads increase network time and storage. SQS has a hard 256KB limit (workaround: SQS overflow storage feature).
- **Serialization overhead**: All drivers serialize job data via `serialize()` and `unserialize()`. Complex payloads (large Eloquent models) directly impact throughput.

# Production Considerations
- Separate queue Redis from cache Redis — cache eviction policies can delete queue keys.
- Set `after_commit` per connection to prevent jobs dispatched in transactions from referencing uncommitted data.
- Configure `retry_after` higher than the longest expected job runtime to prevent double-processing.
- For database driver: index the `jobs` table on `(`queue`, `reserved_at`)`. Without proper indexes, polling queries scan.
- Monitor queue length, oldest job, and failure rate per driver.

# Common Mistakes
- **Using database driver in production for moderate volume**: It works in development and fails under load. The polling query `SELECT ... FOR UPDATE` blocks other queries.
- **Not setting `after_commit` on Redis connection**: Jobs dispatched inside transactions may process before the transaction commits, causing "record not found" errors.
- **Using sync driver in production**: Forgetting to set `QUEUE_CONNECTION=redis` in production causes jobs to execute synchronously in the HTTP request, defeating the purpose.

# Failure Modes
- **Redis eviction**: Under memory pressure, Redis evicts queue keys if `maxmemory-policy` is not `noeviction`. This silently drops jobs.
- **SQS visibility timeout mismatch**: If `retry_after` > SQS visibility timeout, a job becomes visible again before Laravel considers it failed, causing double processing.
- **Database deadlock**: Under high concurrency, `SELECT ... FOR UPDATE` on the `jobs` table can cause deadlocks, especially with `SKIP LOCKED` on older MySQL versions.

# Ecosystem Usage
- **Laravel Horizon**: Only supports the Redis driver. Uses its own Redis connection for supervisor coordination and metrics, separate from the queue connection.
- **Laravel Pulse**: Monitors queue throughput and slow jobs across all drivers, not just Redis.
- **Spatie packages**: All use your configured queue connection — no driver preference.

# Related Knowledge Units
- K001 Queue Connections vs. Queues (topology context) | K040 Redis Streams as Queue Backend (Redis alternative) | K080 `block_for` Redis Option (worker polling optimization)

## Research Notes
- The Queue::route() method introduced in Laravel 11 allows mapping job classes to specific connection/queue combinations at dispatch time, evaluated lazily — this changes the mental model from dispatch-time resolution to routing-time resolution.
- Laravel 12 introduced the ailover connection driver for queue HA, but automatic failback is not supported — the primary connection must be manually restored after it recovers.
- The fter_commit option has different behavior across drivers: Redis queues honor it via transaction callbacks; SQS queues rely on the fter_commit config key at the connection level.
- Octane compatibility for queue dispatching is an ongoing concern — the QueueManager is resolved from the container and may hold stale references between requests in persistent application contexts.
- Serializing models for queued jobs uses ModelIdentifier under the hood — the trait SerializesModels handles this by converting model instances to identifiers before serialization and rehydrating them after unserialization.
- Community benchmarks show Redis queue throughput of 10,000+ jobs/second with Horizon, while SQS throughput is limited by API rate limits (3,000 messages/second per account per region initially).
