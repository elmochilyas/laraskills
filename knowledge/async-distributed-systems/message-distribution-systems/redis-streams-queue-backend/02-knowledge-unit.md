# Metadata
Domain: Async & Distributed Systems
Subdomain: Message Distribution Systems
Knowledge Unit: Redis Streams as Queue Backend
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Redis Streams (introduced in Redis 5.0) provide an append-only log data structure with consumer groups, message acknowledgment, and per-message persistence — features absent from Redis Lists (the default Laravel queue backend). Unlike `LPUSH`/`BRPOP` (Lists), Streams support multiple consumers consuming the same stream independently (like Kafka consumer groups), message acknowledgment to prevent loss, and the ability to replay unacknowledged messages. While Laravel doesn't use Streams as the default Redis queue driver, they are available via `predis/predis` and community packages, and offer a more robust queue foundation for high-reliability applications.

# Core Concepts
- **Stream**: An append-only log of entries. Each entry has a unique ID (timestamp-sequence, e.g., `1516023428173-0`).
- **Consumer group**: A group of consumers that coordinate to consume a stream. Each entry is delivered to ONE consumer in the group (like Kafka).
- **Pending Entry List (PEL)**: Entries delivered to consumers but not yet acknowledged. Used for recovery — if a consumer crashes, entries remain in PEL.
- **`XACK`**: Acknowledges message processing. Removes entry from the consumer's PEL.
- **`XREADGROUP`**: Read entries as part of a consumer group. Returns new entries + unacknowledged entries.
- **`XCLAIM`**: Transfer PEL entries from one consumer to another (for dead consumer recovery). Timeout-based claiming.
- **Stream vs List**: Lists = simple FIFO. Streams = consumer groups, ack, replay, multiple consumers.

# Mental Models
- **Kafka-lite**: Redis Streams offer Kafka-like consumer group semantics but with Redis's in-memory performance and simpler operations.
- **Recorded phone messages**: The stream is an answering machine with a tape (log). Multiple assistants (consumers) in a group pick up messages. They mark each message as "handled" (ack). If an assistant doesn't mark it, another can re-claim it.

# Internal Mechanics
- `XADD mystream * field1 value1 field2 value2` — appends to stream, returns auto-generated ID.
- `XGROUP CREATE mystream mygroup $` — creates consumer group starting from latest entries (`$`) or beginning (`0`).
- `XREADGROUP GROUP mygroup consumer1 COUNT 10 BLOCK 5000 STREAMS mystream >` — read new entries (not delivered to any consumer) or pending entries.
- `XACK mystream mygroup 1516023428173-0` — acknowledge entry.
- `XPENDING mystream mygroup - + 10 consumer1` — list pending entries for a consumer.
- `XCLAIM mystream mygroup consumer2 3600000 1516023428173-0` — claim entry after 1 hour idle.
- Stream entries are stored in memory (plus optional persistence via RDB/AOF). Memory management via `MAXLENGTH` — stream trimming.

# Patterns
## Consumer Group with PEL Recovery
- **Purpose**: Ensure every message is processed at least once.
- **Benefit**: No message loss on consumer crash.
- **Tradeoff**: PEL management complexity; idle entries must be claimed.

## Stream Trimming for Capacity Management
- **Purpose**: Prevent unbounded stream growth.
- **Benefit**: Bounded memory usage.
- **Tradeoff**: Old entries are lost — not suitable for replay-beyond-trimming.

## Multi-Group Fan-Out
- **Purpose**: Multiple independent consumers read the same stream.
- **Benefit**: Each consumer group gets all entries (like Kafka fan-out).
- **Tradeoff**: Stream entries must be retained for all groups (memory).

# Architectural Decisions
- **Use Streams over Lists when**: Need consumer group semantics, need ack-based processing, need recovery from worker crashes, need multiple consumer groups.
- **Use Lists for simple queues**: Single consumer, no ack needed, highest performance.
- **Use Streams as Kafka replacement**: When you want Kafka-like consumer groups but within the Redis ecosystem (no separate Kafka cluster).
- **Stream size management**: Set `MAXLENGTH ~ 100000` to bound memory. The `~` uses efficient eviction (approximate trimming).

# Tradeoffs
Redis Streams | Consumer groups, ack, PEL recovery, Kafka-like | More complex than Lists; memory-bound; not as durable as Kafka
Redis Lists (BRPOP) | Simple, fast, familiar | No consumer groups; no ack; message loss on crash
Kafka | Durable, replay, high throughput, long retention | Operational complexity; higher latency; separate cluster

# Performance Considerations
- Streams are slightly slower than Lists for simple operations (XADD vs LPUSH, XREADGROUP vs BRPOP) but still sub-millisecond.
- Memory: stream entries persist until trimmed or evicted. List entries are removed on pop. Streams use more memory per message.
- PEL grows with unacknowledged messages. A consumer that fails to ack can accumulate a large PEL.
- Stream trimming (`XTRIM`) is CPU-intensive for large streams. Use `MAXLENGTH ~ N` for efficient approximate trimming.
- `XREADGROUP` with pending entries fetches PEL entries — if PEL is large, performance degrades.

# Production Considerations
- Stream entries consume memory until trimmed. Monitor stream length and set appropriate `MAXLENGTH`.
- PEL monitoring: If a consumer crashes without acknowledging, PEL grows. Implement a dead consumer detector that `XCLAIM` entries.
- Consumer group re-creation: Deleting and re-creating a consumer group restarts from the beginning (if `$` not used). Be careful.
- Redis persistence (AOF) is recommended for stream durability. Without it, all stream data is lost on restart.
- For high-throughput queues using streams, consider a separate Redis instance to avoid cache eviction interfering with queued messages.
- Streams work with Redis Cluster, but consumer groups and XREADGROUP with cross-node consistency have limitations.

# Common Mistakes
- **Not acknowledging messages**: PEL grows unbounded. Implement XACK after successful processing.
- **Using streams without consumer groups**: Without groups, consumers use XREAD (non-blocking, no ack). Same as obsolete Lists but more complex.
- **Not trimming streams**: Stream grows indefinitely. Redis memory fills up. Old entries consume memory for no purpose.
- **Assuming stream entries are durable**: Without AOF persistence, Redis restart loses all stream data. Not suitable for reliability-critical data.
- **XCLAIM without proper idle timeout**: Setting too-short idle timeout claims entries from slow-but-active consumers, causing duplicate processing.

# Failure Modes
- **PEL overflow**: A consumer crashes silently. PEL grows until memory runs out or `XCLAIM` operations become slow.
- **Duplicate processing on XCLAIM**: Consumer A processed an entry but didn't ack before being claimed by Consumer B. Both consumers processed the same entry.
- **Stream out of memory**: Streams not trimmed. Redis memory fills up. Redis starts evicting keys (if eviction policy permits) or rejecting writes.
- **Consumer group deletion accidentally**: Re-creating consumer group with `$` skips ALL existing entries. Data loss.
- **Redis Streams with Cluster limitations**: `XREADGROUP` with `>` works, but `XACK` and `XCLAIM` require targeting the correct cluster node.

# Ecosystem Usage
- **Laravel framework**: Does NOT use Redis Streams as the default queue driver. Uses Redis Lists (BRPOP).
- **Community packages**: `laravel-queue-redis-stream-driver` provides Stream-based queue driver for Laravel.
- **Redis**: Streams are a core Redis 5.0+ feature. `predis/predis` and `phpredis` both support stream commands.
- **Spatie packages**: Not directly related, but any Laravel queue package can use Stream-backed connections.

# Related Knowledge Units
- K002 Queue Driver Architecture (Redis driver comparison) | K038 Kafka Topics, Partitions, Consumer Groups (architectural peer)

## Research Notes
- RabbitMQ exchange types (direct, topic, fanout, headers) enable different routing strategies — direct routes by routing key, topic supports wildcard patterns, fanout broadcasts to all queues, headers routes by message header attributes.
- RabbitMQ dead letter queues require configuring both the source queue's x-dead-letter-exchange argument and the dead letter queue's binding — messages are dead-lettered when they exceed TTL, are rejected, or exceed queue length limits.
- Kafka topics are partitioned for parallel consumption — the number of partitions determines the maximum consumer parallelism within a consumer group, and partition assignment is handled automatically by the consumer group coordinator.
- Amazon SQS visibility timeout is the period during which a consumed message is hidden from other consumers — if the message is not deleted within the timeout, it becomes visible again, potentially causing duplicate processing.
- Redis Streams as a queue backend (Laravel 12+) offer consumer groups, pending message lists, and message acknowledgment — this is more feature-rich than the default Redis list-based queue.
- The lucas/phpdotenv dependency is not required for SQS queue configuration — all SQS connection parameters (key, secret, region, bucket) are set in config/queue.php.
- Community packages like mateusjunges/laravel-kafka and ladimir-yuldashev/laravel-queue-rabbitmq provide Laravel-native queue drivers for Kafka and RabbitMQ.
- Message ordering guarantees vary by backend: Redis lists preserve FIFO within a single queue, SQS standard queues offer at-least-once delivery without strict ordering, Kafka preserves ordering within a partition.
