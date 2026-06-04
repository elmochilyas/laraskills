# Metadata
Domain: Async & Distributed Systems
Subdomain: Message Distribution Systems
Knowledge Unit: RabbitMQ Exchange Types (Direct/Fanout/Topic/Headers)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
RabbitMQ's routing flexibility comes from its exchange types. Unlike Laravel's Redis driver (simple list push/pop), RabbitMQ decouples publishers from queues through exchanges. **Direct** routes messages to queues by exact routing key. **Fanout** broadcasts to all bound queues. **Topic** routes by pattern-matched routing keys. **Headers** routes by message header attributes. When using RabbitMQ as a Laravel queue driver (via `vyuldashev/laravel-queue-rabbitmq`), understanding exchanges is critical for routing messages to the correct workers.

# Core Concepts
- **Exchange**: The router that receives messages from producers and routes them to queues based on exchange type and routing rules.
- **Binding**: The link between an exchange and a queue, with an optional routing key.
- **Direct exchange**: Routes to queues whose binding key exactly matches the message's routing key.
- **Fanout exchange**: Routes to ALL bound queues, ignoring the routing key. Broadcast pattern.
- **Topic exchange**: Routes by wildcard matching (`*.orders.#`). Pattern-based routing.
- **Headers exchange**: Routes based on message header attributes (key-value pairs). Used for complex routing logic.

# Mental Models
- **Post office exchange**: Direct = registered mail (specific address). Fanout = public announcement board (everyone sees it). Topic = department mail (matches patterns like "engineering.*"). Headers = mail with specific stamps (routed by envelope markings).
- **Router fabric**: Exchanges are like network routers. Direct = static route. Fanout = broadcast. Topic = longest-prefix match. Headers = policy-based routing.

# Internal Mechanics
- A producer publishes to an exchange with a routing key: `channel->basic_publish($msg, 'exchange_name', 'routing_key')`.
- The exchange receives the message and evaluates bindings.
- For direct: exact match of routing_key to binding_key.
- For topic: binding_key patterns with `*` (matches one word) and `#` (matches zero or more words).
- For fanout: no routing key check — all bound queues receive.
- For headers: message headers must match binding arguments (`x-match = all` or `any`).
- In Laravel, the queue driver maps Laravel's queue concept to RabbitMQ routing keys. Each queue name becomes a binding key.

# Patterns
## Work Queue with Direct Exchange
- **Purpose**: Distribute jobs to workers by type.
- **Benefit**: Precise routing — email jobs go to email workers only.
- **Tradeoff**: More exchanges/bindings as job types grow.

## Broadcast with Fanout Exchange
- **Purpose**: Send an event to all services/workers.
- **Benefit**: One publish, multiple consumers — no per-consumer dispatch.
- **Tradeoff**: All bound queues receive ALL messages — network overhead.

## Topic-Based Routing
- **Purpose**: Route by hierarchical pattern (e.g., `us.orders.created`).
- **Benefit**: Flexible subscription granularity.
- **Tradeoff**: Routing key convention must be consistent across producers.

# Architectural Decisions
- **Use direct exchange for**: Simple Laravel queue patterns where one queue = one job type.
- **Use topic exchange for**: Multi-service routing where different consumers need different subsets of messages.
- **Use fanout for**: Event broadcast patterns (cross-service domain events).
- **Use headers for**: Complex routing based on metadata, not message content.

# Tradeoffs
Direct exchange | Simple, exact routing, easy to debug | Rigid; one routing key per binding
Fanout exchange | Broadcast to all, no routing overhead | Cannot selectively route; all consumers get all messages
Topic exchange | Flexible routing, pattern matching | Pattern overhead; routing key convention must be standardized
Headers exchange | Most flexible, routes on metadata | Most complex; headers must be set on every message

# Performance Considerations
- Direct exchange: O(1) routing — fastest.
- Fanout: O(n) where n = bound queues — each message delivered to all queues.
- Topic: pattern matching adds CPU overhead per message.
- Headers: header comparison adds CPU overhead; slower than direct.
- For high-throughput Laravel queues using RabbitMQ, direct exchange is most common.
- Network latency: RabbitMQ adds one network hop between Laravel producer and queue.

# Production Considerations
- RabbitMQ management UI is essential for monitoring exchange/queue/binding configuration.
- Exchange durability: durable exchanges survive broker restarts. Required for production.
- Bindings are not automatically cleaned up when queues are deleted — monitor stale bindings.
- Dead-letter exchanges: configure per-exchange for failed message handling.
- Prefetch count (`basic.qos`): controls how many messages are sent to a consumer at once. Must be tuned per worker.

# Common Mistakes
- **Using topic exchange when routing keys are always exact**: Direct exchange is simpler and faster.
- **Not setting exchange durability**: Non-durable exchanges disappear on broker restart. All messages in bound queues become unroutable.
- **Mixing exchange types on the same queue**: A queue bound to multiple exchanges with different types — routing behavior becomes non-obvious.
- **Assuming binding order matters**: RabbitMQ does not guarantee message ordering across consumers with different binding patterns.

# Failure Modes
- **Unroutable messages**: Message published to an exchange with no matching binding. Message is silently dropped (or returned to publisher, depending on `mandatory` flag).
- **Binding key mismatch**: Producer uses routing key `order.created`, but binding key is `order.*` — doesn't match in direct exchange. Works in topic exchange.
- **Exchange misspelling**: Producer publishes to non-existent exchange. RabbitMQ drops the message. (Server-side `mandatory` flag at channel level can detect this.)
- **Queue name collision in bindings**: Same queue bound to different exchanges — might receive unexpected messages.

# Ecosystem Usage
- **`vyuldashev/laravel-queue-rabbitmq`**: Maps Laravel queue connections to RabbitMQ exchanges and queues. Configurable exchange name and type.
- **Laravel framework**: RabbitMQ is not a built-in driver. All RabbitMQ integration is through community packages.
- **Spatie packages**: Not directly involved, but Spatie webhook-server can use RabbitMQ-backed Laravel queues.

# Related Knowledge Units
- K037 RabbitMQ Dead-Letter Queues (routing related) | K040 Redis Streams as Queue Backend (contrast with RabbitMQ)

## Research Notes
- RabbitMQ exchange types (direct, topic, fanout, headers) enable different routing strategies — direct routes by routing key, topic supports wildcard patterns, fanout broadcasts to all queues, headers routes by message header attributes.
- RabbitMQ dead letter queues require configuring both the source queue's x-dead-letter-exchange argument and the dead letter queue's binding — messages are dead-lettered when they exceed TTL, are rejected, or exceed queue length limits.
- Kafka topics are partitioned for parallel consumption — the number of partitions determines the maximum consumer parallelism within a consumer group, and partition assignment is handled automatically by the consumer group coordinator.
- Amazon SQS visibility timeout is the period during which a consumed message is hidden from other consumers — if the message is not deleted within the timeout, it becomes visible again, potentially causing duplicate processing.
- Redis Streams as a queue backend (Laravel 12+) offer consumer groups, pending message lists, and message acknowledgment — this is more feature-rich than the default Redis list-based queue.
- The lucas/phpdotenv dependency is not required for SQS queue configuration — all SQS connection parameters (key, secret, region, bucket) are set in config/queue.php.
- Community packages like mateusjunges/laravel-kafka and ladimir-yuldashev/laravel-queue-rabbitmq provide Laravel-native queue drivers for Kafka and RabbitMQ.
- Message ordering guarantees vary by backend: Redis lists preserve FIFO within a single queue, SQS standard queues offer at-least-once delivery without strict ordering, Kafka preserves ordering within a partition.
