# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** K040 — Redis Streams as Queue Backend
- **Knowledge ID:** K040
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Redis Docs — Streams
  - `predis/predis`, `phpredis`

---

# Overview

Redis Streams (Redis 5.0+) provide an append-only log data structure with consumer groups, message acknowledgment, and per-message persistence — features absent from Redis Lists (the default Laravel queue backend). Unlike `LPUSH`/`BRPOP` (Lists), Streams support multiple consumers consuming the same stream independently (like Kafka consumer groups), message acknowledgment to prevent loss, and replay of unacknowledged messages via the Pending Entry List (PEL).

---

# Core Concepts

- **Stream:** Append-only log of entries. Each entry has a unique ID (timestamp-sequence).
- **Consumer group:** Group of consumers coordinating to consume a stream. Each entry delivered to ONE consumer.
- **Pending Entry List (PEL):** Entries delivered but not acknowledged. Used for crash recovery.
- **`XACK`:** Acknowledge message processing. Removes from PEL.
- **`XREADGROUP`:** Read entries as a consumer group — new + unacknowledged entries.
- **`XCLAIM`:** Transfer PEL entries from one consumer to another (dead consumer recovery).
- **Stream vs List:** Lists = simple FIFO. Streams = consumer groups, ack, replay, multi-consumer.

---

# When To Use

- Need consumer group semantics (multiple consumers, each message to one consumer)
- Need ack-based processing with crash recovery (PEL)
- Want Kafka-like features within the Redis ecosystem (no separate Kafka cluster)
- Multiple consumer groups need to independently consume the same stream

---

# When NOT To Use

- Simple single-consumer FIFO — Lists have lower overhead
- Need Kafka-level durability and long retention — Streams are memory-bound
- Sub-millisecond throughput at massive scale — Stream operations are slightly slower than Lists
- When Redis memory cannot accommodate stream data retention requirements

---

# Best Practices

- **Always use consumer groups.** Without groups, `XREAD` gives no ack support or PEL recovery — behaves like Lists but with more complexity. *Why: Consumer groups are the primary value proposition of Streams over Lists — they provide the Kafka-like semantics of at-least-once delivery, ack management, and crash recovery.*
- **Trim streams with `MAXLENGTH ~ N`.** Unbounded streams fill Redis memory. Use approximate trimming for efficiency. *Why: Stream entries persist in memory until trimmed. Without trimming, Redis memory fills up — writes fail or eviction occurs. The `~` flag enables efficient eviction (block-level) rather than entry-by-entry.*
- **Implement dead consumer detection for PEL management.** A crashed consumer never acks — PEL grows. Run a periodic job that `XCLAIM`s entries from consumers idle > 1 hour. *Why: An abandoned PEL not only leaks memory but also prevents those entries from being re-processed — they're stuck in the crashed consumer's pending list.*
- **Enable AOF persistence for durable streams.** Without AOF, Redis restart loses ALL stream data. *Why: Streams are in-memory by default — a Redis restart (crash, deployment, failover) without AOF causes total stream data loss. AOF replay restores stream state.*
- **Use a separate Redis instance for queues vs cache.** Cache eviction can delete stream data. *Why: If the same Redis instance serves both cache and streams, the cache eviction policy (`allkeys-lru`, `volatile-ttl`) may evict stream keys under memory pressure, losing queued messages.*

---

# Performance Considerations

- Streams slightly slower than Lists (XADD vs LPUSH, XREADGROUP vs BRPOP) but still sub-millisecond.
- PEL grows with unacknowledged messages — large PEL degrades `XREADGROUP` performance.
- Stream trimming (`XTRIM`) is CPU-intensive for large streams — use `MAXLENGTH ~ N` for efficiency.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not acknowledging messages | No `XACK` after processing | PEL grows unbounded — memory leak | Always XACK after successful processing |
| Streams without consumer groups | Using `XREAD` only | No ack, no PEL, no recovery | Use `XREADGROUP` with a consumer group |
| Not trimming streams | No `MAXLENGTH` | Redis memory fills up — writes fail | Set `MAXLENGTH ~ 100000` |
| Assuming durability without AOF | No RDB/AOF configured | All stream data lost on Redis restart | Enable AOF for persistence |

---

# Examples

```php
// Adding to stream (conceptual)
$redis->xadd('orders', '*', ['order_id' => 1234, 'status' => 'processing']);

// Consumer group read and ack
$messages = $redis->xreadgroup('processors', 'worker1', ['orders' => '>'], $count = 1);
foreach ($messages as $stream => $entries) {
    foreach ($entries as $id => $data) {
        processOrder($data);
        $redis->xack('orders', 'processors', [$id]);
    }
}
```

---

# Related Topics

- **K038 Kafka Topics and Partitions (K038)** — Architectural peer with consumer groups
- **K002 Queue Driver Architecture (K002)** — Redis driver comparison
