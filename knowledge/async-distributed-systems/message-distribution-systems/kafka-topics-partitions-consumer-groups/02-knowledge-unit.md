# Metadata
Domain: Async & Distributed Systems
Subdomain: Message Distribution Systems
Knowledge Unit: Kafka Topics, Partitions, Consumer Groups, Offsets
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary
Apache Kafka is a distributed event log platform fundamentally different from queue systems. Messages in Kafka are stored durably in **topics** (append-only logs partitioned across brokers). Each **partition** is an ordered, immutable sequence of records. **Consumer groups** track their position (offset) per partition, enabling independent consumption and replay. This architecture provides high throughput, ordered delivery per partition, and the ability to reprocess historical data — capabilities traditional queues don't offer. Laravel integration via community packages enables Kafka as a queue backend, but the mental model differs significantly from push-based queues.

# Core Concepts
- **Topic**: A category/feed name for messages. Analogous to a table in a database.
- **Partition**: A unit of parallelism within a topic. Each partition is an ordered log. Messages within a partition are ordered; across partitions, order is not guaranteed.
- **Offset**: A sequential ID for each message within a partition. Consumers track their current offset.
- **Consumer group**: A set of consumers that coordinate to consume partitions. Each partition is assigned to one consumer in the group.
- **Broker**: A Kafka server that stores partitions and serves consumer/producer requests.
- **Replication factor**: Number of copies of each partition across brokers (fault tolerance).
- **Retention policy**: How long messages are kept (time or size-based). Unlike queues, Kafka doesn't delete messages after consumption.

# Mental Models
- **Library archive vs inbox**: Kafka is a library archive (messages are stored and indexed). Traditional queues are inboxes (messages are removed when read). In a library, multiple patrons can read the same book at different positions (different consumer groups, different offsets).
- **Tape recorder vs sticky note**: Kafka is a tape recorder — you can record (produce), play (consume), rewind (replay), and fast-forward (seek). A queue is a sticky note — you read it once and throw it away.

# Internal Mechanics
- Producer sends messages to a topic. Messages are distributed across partitions based on key (hash) or round-robin.
- Each partition is stored as an append-only commit log on disk.
- Consumer group member A is assigned partitions 0, 1. Member B gets partitions 2, 3.
- Each member tracks its offset per partition: the next message to read.
- On `poll()`, the consumer fetches messages from its assigned partitions starting from its current offset.
- After processing, the consumer commits the offset (saves position).
- If a consumer crashes, its partitions are reassigned to other group members (rebalance). New member starts from the last committed offset.
- Offset retention: The committed offset is stored in a Kafka internal topic (`__consumer_offsets`) or in an external store.

# Patterns
## Event Sourcing with Kafka
- **Purpose**: Use Kafka as the event store for event sourcing.
- **Benefit**: Immutable log, replay capability, audit trail.
- **Tradeoff**: Event sourcing complexity; snapshot management needed.

## Competing Consumers via Consumer Groups
- **Purpose**: Distributed processing of a topic's messages.
- **Benefit**: Parallel consumption with partition-level ordering.
- **Tradeoff**: Partition count limits parallelism; rebalancing pauses consumption.

## Replay Recovery
- **Purpose**: Reset consumer offset to reprocess messages from a specific time.
- **Benefit**: Recovery from processing bugs or data corruption.
- **Tradeoff**: Requires careful offset management; downstream systems must be idempotent.

# Architectural Decisions
- **Use Kafka when**: You need message replay, long-term retention, high throughput (>100K msgs/sec), or event sourcing.
- **Use RabbitMQ/Redis for**: Traditional job queues, low-latency point-to-point messaging, complex routing.
- **Partition count**: Higher = more parallelism but more overhead. Rule of thumb: partition count = max expected consumer group size × 2.
- **Key-based partitioning**: Use a meaningful key (user ID, order ID) to ensure related messages go to the same partition (maintaining order per entity).

# Tradeoffs
Kafka | Replay, high throughput, long retention, ordered per partition | Higher latency per message; operational complexity; not a traditional queue
RabbitMQ | Low latency, complex routing, DLQ | Lower throughput; messages deleted after consumption
Redis (list) | Low latency, simple, familiar | No persistence guarantees; limited throughput; no replay

# Performance Considerations
- Kafka throughput scales with partition count. 100 partitions × single consumer = limited benefit. 100 partitions × 10 consumers = high throughput.
- Latency: producer `acks=all` (wait for all replicas) adds latency but ensures durability. `acks=1` is faster but less durable.
- Consumer lag: the difference between the latest offset and consumer offset. High lag indicates processing bottleneck.
- Consumer rebalancing: during a rebalance, partition assignment changes, and no messages are processed. Rebalancing frequency should be minimized.
- Each partition is stored as a file on disk. Very high partition counts (>10K) can stress the filesystem.

# Production Considerations
- Monitor consumer lag as the primary health metric. Lag growing = consumer can't keep up.
- Plan retention based on replay requirements and storage budget. 7 days is common; 30 days for event sourcing.
- Set `auto.offset.reset` to `earliest` or `latest` — determines behavior when no committed offset exists.
- Idempotent producers (enable `enable.idempotence=true`) prevent message duplication on producer retry.
- Avoid rebalance storms: consumers joining/leaving rapidly cause cascading rebalances. Use static group membership if supported.
- Kafka for Laravel queues: ensure the consumer (worker) commits offsets after processing, not before. At-least-once processing.

# Common Mistakes
- **Using Kafka as a traditional queue**: Kafka is an event log. Messages persist after consumption. Queue semantics (delete after read) must be implemented via compaction or retention.
- **Too many partitions**: Partition consumption is sequential within a consumer. More partitions than needed causes overhead without benefit.
- **Not handling rebalancing**: Consumer rebalancing pauses all consumption. If consumers restart frequently, processing is interrupted repeatedly.
- **Committing offsets before processing**: If the consumer commits the offset then crashes, messages are lost (at-most-once semantics). Commit after processing for at-least-once.
- **Assuming global ordering**: Kafka only guarantees ordering within a partition, not across partitions. Global ordering requires a single partition (limits parallelism).

# Failure Modes
- **Consumer rebalancing at scale**: Large consumer groups (50+ members) rebalance slowly. Rebalance time increases with group size.
- **Offset commit failure**: If offset commit to Kafka fails, the consumer may re-process messages on restart (duplicate processing).
- **Disk space exhaustion**: Retention policy misconfigured or message volume exceeds disk — Kafka stops accepting new messages.
- **Leader election during partition**: Brown-out: one broker becomes leader for all partitions. Other brokers are idle. Uneven load distribution.
- **ZooKeeper/KRaft failure**: If the consensus system fails, the entire Kafka cluster becomes unavailable.

# Ecosystem Usage
- **Laravel framework**: No built-in Kafka driver. Community packages provide integration.
- **`mateusjunges/laravel-kafka`**: Popular Laravel Kafka package. Provides Kafka as a queue connection with consumer, producer, and topic management.
- **Spatie packages**: Not directly Kafka-related, but event sourcing with Spatie + Kafka is a common production pattern.

# Related Knowledge Units
- K036 RabbitMQ Exchange Types (contrast architecture) | K040 Redis Streams as Queue Backend (Kafka-like traits in Redis)

## Research Notes
- RabbitMQ exchange types (direct, topic, fanout, headers) enable different routing strategies — direct routes by routing key, topic supports wildcard patterns, fanout broadcasts to all queues, headers routes by message header attributes.
- RabbitMQ dead letter queues require configuring both the source queue's x-dead-letter-exchange argument and the dead letter queue's binding — messages are dead-lettered when they exceed TTL, are rejected, or exceed queue length limits.
- Kafka topics are partitioned for parallel consumption — the number of partitions determines the maximum consumer parallelism within a consumer group, and partition assignment is handled automatically by the consumer group coordinator.
- Amazon SQS visibility timeout is the period during which a consumed message is hidden from other consumers — if the message is not deleted within the timeout, it becomes visible again, potentially causing duplicate processing.
- Redis Streams as a queue backend (Laravel 12+) offer consumer groups, pending message lists, and message acknowledgment — this is more feature-rich than the default Redis list-based queue.
- The lucas/phpdotenv dependency is not required for SQS queue configuration — all SQS connection parameters (key, secret, region, bucket) are set in config/queue.php.
- Community packages like mateusjunges/laravel-kafka and ladimir-yuldashev/laravel-queue-rabbitmq provide Laravel-native queue drivers for Kafka and RabbitMQ.
- Message ordering guarantees vary by backend: Redis lists preserve FIFO within a single queue, SQS standard queues offer at-least-once delivery without strict ordering, Kafka preserves ordering within a partition.
