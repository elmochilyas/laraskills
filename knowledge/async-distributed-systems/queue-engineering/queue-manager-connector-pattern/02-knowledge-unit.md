# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: QueueManager and Connector Pattern
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
The `QueueManager` is the central registry and factory for all queue connections in Laravel. It implements the Manager pattern used throughout the framework (DatabaseManager, CacheManager, FilesystemManager). It lazily resolves connections on first access, caches them for the request lifetime, and delegates to driver-specific Connector classes to instantiate Queue instances. Understanding this architecture is essential for adding custom queue drivers, extending existing ones, or debugging connection resolution issues.

# Core Concepts
- **Manager pattern**: A factory class that resolves named instances of a service lazily. `QueueManager` implements both `Factory` (creating connections) and `Monitor` (observing events like worker stopping).
- **Connector pattern**: Each driver has a Connector class implementing `ConnectorInterface` with a single `connect(array $config)` method that returns a Queue instance.
- **Lazy resolution**: Connections are created on first `connection()` call, not when the manager is instantiated.
- **Registration**: Connectors are registered via service provider bootstrapping (e.g., `QueueServiceProvider`). Custom drivers can register via `Queue::extend()` or `Queue::addConnector()`.
- **`__call` proxy**: Method calls on the manager are proxied to the default connection via `__call`, enabling `Queue::push(...)` to work as a static facade.

# Mental Models
- **Factory vending machine**: You press the button (connection name), the machine fabricates the product (Queue instance) using the right recipe (Connector + config). The machine remembers what it made so subsequent requests are instant.
- **Plugin architecture**: New drivers register their Connector — the rest of the system (Worker, dispatch, queue commands) works unchanged because it all talks to the Queue contract.
- **Service locator**: The manager is a centralized registry for named queue service instances, accessed throughout the application.

# Internal Mechanics
- `QueueServiceProvider` registers connectors during `register()`:
  - `null` → `NullConnector`
  - `sync` → `SyncConnector`
  - `database` → `DatabaseConnector`
  - `redis` → `RedisConnector`
  - `sqs` → `SqsConnector`
  - `beanstalkd` → `BeanstalkdConnector`
  - `failover` → `FailoverConnector`
- `resolve($name)` reads config from `queue.connections.$name`, gets the driver type, calls the registered connector closure, passes config to `connect()`.
- The connector returns a Queue instance that gets `setConnectionName($name)` called.
- The resolved connection is cached in `$this->connections[$name]` for the remainder of the request.
- `connection()` always returns a `Queue` contract instance — the rest of the framework never touches raw Redis/SQS APIs.
- The `FailoverConnector` wraps an array of connection names in a `FailoverQueue` that tries each in sequence.

# Patterns
## Custom Driver Registration
- **Purpose**: Add support for non-built-in queue backends (RabbitMQ, Kafka, Google Pub/Sub).
- **Benefit**: Full integration with dispatch, workers, and the rest of the queue ecosystem.
- **Tradeoff**: Must implement the full Queue contract (push, pop, delete, release, size, etc.), which is non-trivial for feature-rich brokers.

## Connection Middleware
- **Purpose**: Decorate queue connections with cross-cutting behavior (logging, metrics, rate limiting).
- **Benefit**: Centralized instrumentation without modifying job classes.
- **Tradeoff**: Adds latency per queue operation; must be careful with error propagation.

## Failover Strategy
- **Purpose**: Wrap multiple connections so jobs survive a backend outage.
- **Benefit**: High availability without application-level retry logic.
- **Tradeoff**: Complexity of managing two backends; no automatic failback.

# Architectural Decisions
- **When to add a custom driver**: When the built-in drivers don't meet your needs (e.g., using Kafka for event sourcing) and the existing connector pattern supports clean integration.
- **When to extend existing drivers**: When you need driver-specific behavior (e.g., custom SQS message attributes) but want to keep the Laravel queue contract. Extend the Queue class rather than writing from scratch.
- **When to use `Queue::extend()` vs service provider**: `extend()` is for runtime registration in service providers; service provider registration is for permanent drivers.

# Tradeoffs
Manager pattern with lazy resolution | Zero overhead for unused connections | Connection errors surface on first use, not boot
Connector separation | Clean driver interface, easy to test per driver | Boilerplate for simple drivers
`__call` proxy | Convenient facade-style usage | Opaque when debugging connection routing

# Performance Considerations
- Connection resolution is one-time per connection name per request/worker. Negligible overhead.
- Each `connection()` call returns the cached instance — no re-resolution.
- The `resolve()` method reads config from the config array (in-memory) and calls one connector closure. Microsecond-scale cost.
- Custom connectors should connect lazily (e.g., Redis/SQS handle connection inside their `connect()` method, but the actual TCP connection may be deferred).

# Production Considerations
- If using multiple connections on the same worker, each connection maintains its own persistence (Redis connection, SQS HTTP client). Monitor total open connections.
- `QueueManager` is a singleton — connections persist for the worker's lifetime. For long-running workers, ensure connections handle reconnection gracefully.
- The manager emits events (`QueuePaused`, `WorkerStopping`) that can be used for monitoring and graceful shutdown.

# Common Mistakes
- **Adding a new connection for every queue name**: The manager resolves by connection name. Queue names are a separate concern. One connection can serve many queues.
- **Custom connector never returns a Queue contract**: The return type is `Illuminate\Contracts\Queue\Queue`. Not implementing the full contract leads to runtime errors.
- **Re-resolving connections on every job**: Using `Queue::connection('name')` repeatedly returns the same cached instance, which is correct.

# Failure Modes
- **Connector registration failure**: If a custom connector has a bug in `connect()`, the error surfaces on first job dispatch, not at boot. Hard to detect pre-deployment.
- **Singleton connection leak**: The cached connection may hold stale credentials or broken sockets. Long-running workers need reconnect logic.
- **Failover false positive**: If the primary connection fails to push but the job was actually written, the failover resends — potential duplication.

# Ecosystem Usage
- **Horizon**: Does not use the standard `QueueManager`. It creates its own Redis connection directly via `Horizon::use()` and bypasses the normal connector/manager flow.
- **Spatie packages**: Rely on the standard `QueueManager` — they dispatch jobs through `Bus::dispatch()` which goes through the manager.

# Related Knowledge Units
- K001 Queue Connections vs. Queues (distinction) | K004 Job Serialization and Payload Envelope (payload structure)

## Research Notes
- The Queue::route() method introduced in Laravel 11 allows mapping job classes to specific connection/queue combinations at dispatch time, evaluated lazily — this changes the mental model from dispatch-time resolution to routing-time resolution.
- Laravel 12 introduced the ailover connection driver for queue HA, but automatic failback is not supported — the primary connection must be manually restored after it recovers.
- The fter_commit option has different behavior across drivers: Redis queues honor it via transaction callbacks; SQS queues rely on the fter_commit config key at the connection level.
- Octane compatibility for queue dispatching is an ongoing concern — the QueueManager is resolved from the container and may hold stale references between requests in persistent application contexts.
- Serializing models for queued jobs uses ModelIdentifier under the hood — the trait SerializesModels handles this by converting model instances to identifiers before serialization and rehydrating them after unserialization.
- Community benchmarks show Redis queue throughput of 10,000+ jobs/second with Horizon, while SQS throughput is limited by API rate limits (3,000 messages/second per account per region initially).
