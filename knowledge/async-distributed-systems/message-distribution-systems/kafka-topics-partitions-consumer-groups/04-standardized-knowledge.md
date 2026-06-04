# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** K038 — Kafka Topics, Partitions, Consumer Groups
- **Knowledge ID:** K038
- **Difficulty Level:** Expert
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Apache Kafka Docs
  - `mateusjunges/laravel-kafka` package

---

# Overview

Apache Kafka is a distributed event log platform fundamentally different from queue systems. Messages are stored durably in **topics** — append-only logs partitioned across brokers. Each **partition** is an ordered, immutable sequence of records. **Consumer groups** track their position (offset) per partition, enabling independent consumption and replay. This provides high throughput, per-partition ordering, and reprocessing capability — none of which traditional queues offer naturally.

---

# Core Concepts

- **Topic:** Category/feed name for messages. Append-only log.
- **Partition:** Unit of parallelism within a topic. Each partition is an ordered log. Messages ordered within a partition, not across partitions.
- **Offset:** Sequential ID for each message within a partition. Consumers track current offset.
- **Consumer group:** Set of consumers coordinating to consume partitions. Each partition assigned to one consumer in the group.
- **Broker:** Kafka server storing partitions and serving requests.
- **Replication factor:** Copies of each partition across brokers for fault tolerance.
- **Retention policy:** How long messages are kept (time/size based). Messages persist after consumption — not deleted.

---

# When To Use

- Message replay capability required (reprocess from a point in time)
- Long-term message retention (days or months)
- High throughput (>100K msgs/sec)
- Event sourcing or audit log patterns
- Ordered processing per entity (user ID, order ID) via key-based partitioning

---

# When NOT To Use

- Simple job queues with point-to-point messaging — RabbitMQ or Redis is simpler
- Low-latency requirements — Kafka's durability model adds latency
- Complex routing (topic exchange patterns) — Kafka only does key-based partition routing
- Small deployments where operational overhead of a Kafka cluster is unjustified

---

# Best Practices

- **Set partition count = max expected consumer group size × 2.** This allows room for consumer scaling and rebalancing overhead. *Why: The number of partitions is the maximum parallelism for a consumer group. If you have 5 consumers but only 3 partitions, 2 consumers are idle. Buffer by 2x for future growth and rebalance distribution.*
- **Use meaningful message keys for ordering guarantees.** Key by user ID, order ID, or entity ID to ensure related messages go to the same partition. *Why: Kafka partitions by key hash — messages with the same key go to the same partition, preserving order within that partition. Without a key, round-robin distribution loses entity-level ordering.*
- **Commit offsets after processing, not before.** At-least-once semantics: commit after the job's side effects are complete. *Why: Committing before processing means a crash after commit loses the message permanently (at-most-once). Committing after ensures the message is retried if processing fails.*
- **Monitor consumer lag as the primary health metric.** Lag = latest offset minus consumer offset. Growing lag = consumer can't keep up. *Why: Consumer lag is the single most important Kafka health metric — it directly measures whether consumers are keeping pace with production.*
- **Set `auto.offset.reset` intentionally.** `earliest` = start from beginning (replay). `latest` = start from now (skip history). *Why: When a new consumer group starts or committed offsets expire, this policy determines what data it sees — the wrong choice can cause data loss or unexpected replay.*

---

# Performance Considerations

- Throughput scales with partition count — 100 partitions × 10 consumers = high throughput.
- Consumer rebalancing pauses all consumption. Minimize rebalance frequency.
- Very high partition counts (>10K) stress the filesystem — each partition is a file.
- Producer `acks=all` adds latency but ensures durability. `acks=1` is faster, less durable.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming global ordering | Kafka only orders per partition | Surprise when messages across partitions arrive out of order | Use single partition or accept per-partition ordering |
| Committing offset before processing | Wrong commit order | Message loss on consumer crash | Commit after processing |
| Too many partitions for consumer count | Over-partitioning | Partition overhead with no parallelism gain | Set partition count = max consumers × 2 |
| Not handling rebalancing | Frequent consumer restarts | Repeated rebalances — processing interrupted | Use static group membership |

---

# Examples

```php
// Producer with key-based partitioning (conceptual)
$producer->send('orders', $message, key: $orderId);
// Consumer group (conceptual — via laravel-kafka package)
Consumer::create('order-processor')
    ->group('processors')
    ->topic('orders')
    ->handle(fn($message) => processOrder($message))
    ->subscribe();
```

---

# Related Topics

- **K040 Redis Streams (K040)** — Kafka-like consumer groups in Redis
- **K036 RabbitMQ Exchange Types (K036)** — Contrast architectures
