# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: Queue Connections vs. Queues Distinction
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
The connection-vs-queue distinction is the most misunderstood concept in Laravel queue configuration. A connection is a backend driver instance (Redis, SQS, database) — it defines where and how jobs are stored. A queue is a logical named channel within a connection — it defines which pile of work a job belongs to. A single Redis connection can host dozens of named queues (`high`, `default`, `low`, `webhooks`, `reports`), each processed independently by workers. Confusing these leads to infrastructure multiplication — teams create separate Redis instances per queue when they only need separate queue names.

# Core Concepts
- **Connection**: A configured backend service. Each connection has a driver type (redis, sqs, database), credentials, and driver-specific options. Defined in `config/queue.php` under `connections`.
- **Queue**: A named channel within a connection. Jobs are dispatched to a queue name. Workers subscribe to specific queue names and process jobs from those queues only.
- **Default queue**: Each connection has a `queue` attribute in config — the fallback queue name when none is specified during dispatch.
- **Worker queue subscription**: Workers specify `--queue=high,default` to process `high` first (priority ordering), then `default` when `high` is empty.
- **Failover connections**: Laravel supports a `failover` driver that chains multiple connections for high availability.

# Mental Models
- **Parking garage**: Connections are the garage building (one building, one entry/exit). Queues are different floors within it. You don't build a new garage for each floor.
- **Database analogy**: Connections are like database servers. Queues are like tables within a database. You connect to one server, but query different tables.
- **Radio channels**: One transmitter (connection) can broadcast on multiple channels (queues). Receivers (workers) tune to specific channels.

# Internal Mechanics
- When a job is dispatched, the `QueueManager` resolves the named connection from config, then calls `pushOn($queue, $payload)`.
- The driver's `push` method prepends the queue name to the job data before writing to the backend.
- For Redis: jobs go into a list keyed by `queues:{queue}`. Workers use `BRPOP` on those list keys.
- For SQS: each queue name maps to a separate SQS queue URL. Workers poll a specific URL.
- The `Queue::route()` method (Laravel 11+) maps job classes to specific connection/queue combinations, evaluated at dispatch time.
- `retry_after` is per-connection config, not per-queue — all queues on the same connection share the same visibility timeout.

# Patterns
## Queue Topology by Workload
- **Purpose**: Separate jobs by priority, resource usage, and failure tolerance onto named queues with dedicated workers.
- **Benefits**: Prevent priority inversion (slow jobs blocking fast ones), isolate failure domains, tune timeout/memory per queue type.
- **Tradeoffs**: More worker processes, more complex monitoring.

## Priority Queue Worker
- **Purpose**: Ensure time-sensitive jobs process first.
- **Benefits**: Password resets, OTPs, payment callbacks never block behind report generation.
- **Tradeoffs**: Starvation risk for low-priority queues under sustained high-priority load.

## Connection Failover
- **Purpose**: High availability when primary queue backend fails.
- **Benefits**: Jobs are automatically dispatched to secondary connection if primary is unreachable.
- **Tradeoffs**: Secondary connection must be fully configured and capable; no automatic failback.

# Architectural Decisions
- **Single connection + multiple queues** is correct for 95% of applications. Add new connections only when changing driver type or using separate Redis instances for isolation.
- **Separate connections** when: using different drivers for different jobs (e.g., Redis for latency-sensitive, SQS for high-throughput bulk), or isolating queue Redis from cache Redis.
- **Multiple connections per driver** when: using separate Redis instances per environment, or data segregation requirements mandate separate infrastructure.
- **Failover connection** when: queue availability is critical and you can tolerate the operational complexity of dual backends.

# Tradeoffs
Single connection with many queues | Lower operational overhead | All queues share `retry_after` and connection pool
Separate connections per queue type | Independent tuning per queue | More infrastructure, more config files
Failover connection | Automatic HA during outage | No automatic failback; secondary sits idle
Queue route mapping | Centralized queue assignment | Hidden dispatch logic, harder to trace

# Performance Considerations
- All queues on a single Redis connection share the same connection pool and bandwidth. A single slow `BRPOP` on one queue doesn't block others — Redis handles multiplexing.
- SQS charges per request — polling many empty queues costs the same as polling one full queue. Consolidate idle queues.
- Database driver: each queue is a separate query with `WHERE queue = ?` — indexes matter. Separate queues on database are cheaper than separate connections.

# Production Considerations
- Define topology before deploying first job. Retroactive splitting requires draining and migrating queues.
- Name queues by workload characteristic, not job class: `critical`, `default`, `media`, `sync`, `reports`.
- Workers specify `--queue` in priority order: `php artisan queue:work redis --queue=critical,default`.
- Monitor per-queue depth to detect starvation or backlog.
- `after_commit` setting is per-connection — all queues on that connection inherit the setting.

# Common Mistakes
- **Creating separate Redis instances per queue**: Connections are the infrastructure boundary; queues are logical partitions. Adding a new queue does not need a new Redis instance.
- **Confusing `queue` connection config with queue name**: The `queue` key in config is the default queue name for that connection, not a queue identifier.
- **Not setting `after_commit`**: Dispatching jobs within transactions can cause workers to process jobs referencing data that hasn't committed yet.

# Failure Modes
- **Priority inversion**: A long-running report job blocks time-sensitive password reset jobs on the same queue. Mitigation: separate queues with dedicated workers.
- **Queue starvation**: Low-priority queues never get processed because workers are saturated with high-priority jobs. Mitigation: enforce minimum worker allocation for low-priority queues.
- **Connection saturation**: A single Redis connection saturated by queue operations. Mitigation: separate queue Redis from cache Redis.

# Ecosystem Usage
- **Laravel Horizon**: Manages queue subscriptions per supervisor. Each supervisor defines which queues its workers process. Auto-balancing shifts workers between queues based on demand.
- **Spatie webhook-server**: Dispatches webhook jobs to a configurable queue, defaulting to the connection's default queue.

# Related Knowledge Units
- K002 Queue Driver Architecture (technical foundation) | K077 Queue Priority via Multiple Queues (advanced topology) | K080 `block_for` Redis Option (worker polling mechanics)

# Research Notes
Critical operational distinction often misunderstood. Queue topology decisions should be made pre-deployment, not retrofitted. The `failover` driver (Laravel 11+) adds HA capability but is rarely used in practice.

## Research Notes
- The Queue::route() method introduced in Laravel 11 allows mapping job classes to specific connection/queue combinations at dispatch time, evaluated lazily — this changes the mental model from dispatch-time resolution to routing-time resolution.
- Laravel 12 introduced the ailover connection driver for queue HA, but automatic failback is not supported — the primary connection must be manually restored after it recovers.
- The fter_commit option has different behavior across drivers: Redis queues honor it via transaction callbacks; SQS queues rely on the fter_commit config key at the connection level.
- Octane compatibility for queue dispatching is an ongoing concern — the QueueManager is resolved from the container and may hold stale references between requests in persistent application contexts.
- Serializing models for queued jobs uses ModelIdentifier under the hood — the trait SerializesModels handles this by converting model instances to identifiers before serialization and rehydrating them after unserialization.
- Community benchmarks show Redis queue throughput of 10,000+ jobs/second with Horizon, while SQS throughput is limited by API rate limits (3,000 messages/second per account per region initially).
