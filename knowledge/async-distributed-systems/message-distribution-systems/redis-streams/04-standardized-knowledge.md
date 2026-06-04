# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** Redis Streams via `laravel-common`
- **Knowledge ID:** K040
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-04
- **Source References:**
  - Redis Documentation — Streams Intro
  - Laravel Source — `Illuminate\Queue\RedisQueue`
  - `laravel-common` Redis Streams Implementation
  - Redis — XREADGROUP, XACK, XCLAIM, XPENDING

---

# Overview

Redis Streams is a Redis data type introduced in Redis 5.0 that models an append-only log structure — similar to Kafka but in-memory and significantly simpler to operate. In the Laravel ecosystem, Redis Streams serve as the backbone for queue processing when using the `redis` queue driver with consumer groups. The `laravel-common` package extends Redis Streams with consumer group support, enabling message acknowledgment, pending message tracking, and horizontal scaling across workers.

Unlike SQS (fully managed) and Kafka (distributed commit log), Redis Streams offer the lowest operational overhead for teams already running Redis — typically the same Redis instance used for caching, sessions, and rate limiting. Redis Streams provide blocking reads with timeout, consumer group management, and message claiming (XCLAIM/ XAUTOCLAIM) for fault-tolerant processing.

Engineers choose Redis Streams when: they already operate Redis infrastructure, need Horizon monitoring compatibility, require sub-millisecond latency, and don't need Kafka's long-term retention or SQS's managed scaling. The primary tradeoff is memory-based storage (data is RAM-bound unless configured with persistence and replication).

---

# Core Concepts

- **Stream:** An append-only log of entries. Each entry has a unique auto-generated ID (timestamp-sequence) and a set of field-value pairs. Think of it as a Kafka topic in Redis.
- **Consumer Group:** A group of consumers that collaboratively consume a stream. Each message is delivered to one consumer in the group (like Kafka consumer groups). Messages are load-balanced across group members.
- **Consumer:** A named process within a consumer group that reads and processes messages. Each consumer has its own PEL (Pending Entry List).
- **PEL (Pending Entry List):** A list of messages delivered to a consumer but not yet acknowledged. PEL tracking enables fault recovery — if a consumer crashes, its pending messages can be claimed by other consumers.
- **XREADGROUP:** The command to read messages as part of a consumer group. Returns messages that haven't been delivered to any consumer yet, or the consumer's own pending messages.
- **XACK:** Acknowledges successful message processing. Removes the message from the consumer's PEL. Without XACK, messages remain pending and are reprocessed after idle timeout.
- **XCLAIM / XAUTOCLAIM:** Transfers ownership of pending messages from one consumer to another, enabling recovery from consumer failures. `XAUTOCLAIM` (Redis 6.2+) automates this process.
- **XPENDING:** Inspects the PEL — shows pending message count, oldest pending, and per-consumer breakdown. Primary tool for consumer group health monitoring.
- **Blocking Read (BLOCK):** `XREADGROUP BLOCK timeout` makes the consumer wait for new messages instead of busy-polling. Critical for reducing CPU usage. Default Laravel `read_timeout` should be set for reconnection safety.
- **Stream Trimming (XTRIM / XADD MAXLEN):** Controls stream size by removing old entries. Without trimming, streams grow unbounded, consuming all available memory.
- **Entry ID:** Auto-generated `<ms>-<seqNumber>` format. Can be manual for exact idempotency. The `*` wildcard auto-generates from current time.

---

# When To Use

- **Existing Redis infrastructure:** The same Redis instance used for caching, sessions, rate limiting can host streams, reducing operational complexity.
- **Horizon monitoring required:** Horizon natively supports Redis queue driver with stream consumer groups. No special configuration needed.
- **Sub-millisecond latency:** Redis operates entirely in memory (with optional persistence). Message round-trip is < 1ms versus SQS's 20-100ms.
- **Low-to-moderate throughput (< 100 MB/s):** Redis Streams handle millions of messages per second on modest hardware. Throughput is limited by Redis's single-threaded event loop.
- **Simple consumer group workloads:** A few consumer groups with straightforward processing patterns benefit from Redis Streams' simplicity.
- **Temporary or development environments:** Redis Streams are easy to set up and tear down. No cloud console or infrastructure-as-code needed.
- **Reusable Redis infrastructure:** If Redis is already required (cache, session, rate limiting), adding streams imposes minimal additional operational cost.

---

# When NOT To Use

- **High throughput (> 1M messages/second, > 100 MB/s):** Redis is single-threaded for command execution. At extreme throughput, stream operations compete with other Redis users (cache, sessions).
- **Long message retention (> 7 days):** Redis is memory-bound. Storing weeks of stream data in RAM is expensive. Use Kafka for log-based long-term retention.
- **Exactly-once delivery required across consumer failures:** Redis Streams provide at-least-once delivery with consumer groups. Duplicate processing can occur on consumer failure and XCLAIM.
- **Cross-datacenter replication:** Redis replication is asynchronous and does not handle cross-region scenarios well. Use SQS or Kafka for geo-distributed systems.
- **Message replay from arbitrary points:** Redis Streams do not support Kafka-style offset management across consumer groups. Replaying requires re-creating consumer groups.
- **Complex routing or fan-out:** Redis Streams don't support topic exchange patterns (RabbitMQ) or pub-sub fan-out (SNS+SQS). Use RabbitMQ or Kafka for complex routing.
- **Redis memory pressure:** If Redis is already near capacity, adding streams risks out-of-memory failures. Monitor `used_memory` before adding stream workloads.

---

# Best Practices

- **Always set `read_timeout` on blocking reads.** The default Laravel blocking read has no timeout — a network hiccup causes the worker to hang forever. *Why: Blocking reads wait indefinitely by default. A missed Redis response due to network issues leaves the worker alive but processing nothing. The 2-second timeout forces reconnection, recovering from transient failures.*
- **Always implement pending message claiming.** Messages assigned to a crashed consumer remain pending forever unless claimed. Use `XAUTOCLAIM` (Redis 6.2+) or periodic `XCLAIM` for older versions. *Why: When a consumer crashes mid-processing, its PEL entries are stuck. No other consumer can process those messages unless explicitly claimed. Without claiming, the messages are effectively lost.*
- **Always call `XACK` after successful processing.** Without acknowledgment, messages remain pending and will be reprocessed after the idle timeout, causing duplicates. *Why: The PEL persists acknowledged-but-unacknowledged messages. On idle timeout (default 2 × read_timeout), all pending messages are redelivered, flooding workers with duplicates.*
- **Monitor consumer group PEL length and lag.** Growing PEL indicates a processing failure or dead consumer. Alert when PEL exceeds threshold. *Why: Unlike Horizon's built-in queue monitoring, Redis Streams consumer groups require explicit monitoring. Without it, processing failures go undetected until backlog is critical.*
- **Trim streams to bound memory usage.** Use `XADD MAXLEN ~ 100000` (approximate trimming — more efficient than exact) or `XTRIM` periodically. Without trimming, streams grow until Redis runs out of memory. *Why: Streams are append-only logs. Each new entry adds memory consumption. Unbounded streams will eventually crash Redis.*
- **Use consumer groups for production — never raw XREAD.** Consumer groups provide message distribution, acknowledgment, pending list tracking, and claiming — essential for fault-tolerant processing. *Why: XREAD delivers every message to every consumer — no load balancing, no acknowledgment, no failure recovery. It's akin to pub-sub, not queue processing.*
- **Set up dead-letter handling for persistently failing messages.** Track retry count via stream message metadata. After N failures, move to a dead-letter stream for manual inspection. *Why: Without a dead-letter mechanism, workers waste cycles on unprocessable messages forever, delaying valid messages behind them.*

---

# Architecture Guidelines

- **One stream per message type or logical queue.** Avoid mixing unrelated message types in a single stream — it makes consumer group scheduling, monitoring, and dead-letter handling harder.
- **One consumer group per stream per processing purpose.** If two different handlers need to process the same stream, use separate consumer groups. Each group independently tracks its own offset and PEL.
- **Consumer name should be unique per process instance.** Typically `hostname:pid` or Kubernetes pod name. Duplicate consumer names in the same group cause message redelivery confusion.
- **Separate Redis connection for streams if throughput is high.** High-volume stream operations can starve cache operations of Redis event loop time. Use separate Redis instances for cache vs streams when both are high-throughput.
- **Use stream naming conventions with colons.** Example: `orders:queue`, `orders:dlt`, `notifications:email`. Colons are Redis convention for namespace hierarchy and visible in `XINFO` output.
- **Stream data should be idempotent.** Design message handlers to tolerate duplicate delivery. Claiming and idle timeout can cause redelivery — idempotency prevents side-effect duplication.
- **Back up stream consumers with monitoring.** `XPENDING` and `XINFO GROUPS` should feed into a health dashboard or alerting system. Don't rely on manual `redis-cli` checks.
- **Co-locate consumer workers with Redis for latency.** Redis Streams work best when consumers are on the same network (or same server) as Redis. Cross-region latency negates the sub-millisecond advantage.

---

# Performance Considerations

- **Redis is single-threaded for command execution.** All stream operations (XADD, XREADGROUP, XACK, XTRIM) compete for the same event loop. A slow `XADD` with `MAXLEN` can block other commands.
- **Approximate trimming (`MAXLEN ~ N`) is far more efficient than exact trimming (`MAXLEN N`).** Exact trimming scans the entire stream on every write. Approximate trimming uses a probabilistic eviction strategy — much lower CPU overhead.
- **Blocking reads (`BLOCK timeout`) eliminate busy-polling.** A worker with blocking read uses near-zero CPU while waiting for messages. Without it, workers poll continuously at high CPU.
- **Consumer group overhead:** Each consumer group maintains consumer state and PEL in memory. More consumer groups = more memory usage. Avoid creating hundreds of groups per stream.
- **PEL growth impacts performance.** If consumers fail to acknowledge messages, the PEL grows. A large PEL (millions of entries) degrades XREADGROUP performance because Redis scans the PEL.
- **Stream ID is monotonic and time-sorted.** `XREAD` and `XREADGROUP` with `>` (new messages only) are O(log N) with stream length. Reading by ID range is efficient.
- **Memory cost:** Each stream entry stores field-value pairs as Redis strings. A typical queue message (job payload) may consume 2-10KB. Plan memory accordingly. Use `MEMORY USAGE <key>` to estimate.

---

# Security Considerations

- **No access control in Redis by default.** Anyone who can connect to Redis can read, write, or delete streams. Use `RENAME_COMMAND` to disable dangerous commands (FLUSHALL, CONFIG, etc.) in production.
- **Redis ACLs (Redis 6+):** Use ACL-based access control to restrict users to specific commands and keys. Stream consumers should only have access to their own stream key pattern.
- **Network isolation is critical.** Redis should never be exposed to the public internet. Use private networks, VPCs, or Unix domain sockets. Redis authentication (`REQUIREPASS`) is a minimal mitigation, not a security boundary.
- **Encryption in transit:** Redis does not encrypt traffic by default. Use TLS/SSL (Redis 6+) or a VPN/SSH tunnel for production Redis connections.
- **Sensitive data in stream messages:** Stream entries are stored in Redis memory in plaintext. Never include passwords, PII, API keys, or secrets without encryption. Encrypt sensitive payloads at the application level.
- **Stream data persistence:** Redis streams persist to disk based on RDB/AOF configuration. Ensure persistence is enabled for production (AOF with `appendfsync everysec`). Without persistence, all stream data is lost on Redis restart.
- **Resource exhaustion via unbounded streams:** An unauthenticated or misconfigured stream producer can fill Redis memory by adding entries without trimming. Set up memory limits (`maxmemory`) and eviction policies.

---

# Common Mistakes

| Description | Why Developers Make It | Consequences | Better Approach |
|---|---|---|---|
| No `read_timeout` on blocking reads | Default has no timeout, team assumes reliable network | Worker hangs indefinitely on network hiccup, processing stops | Set `read_timeout = 2` seconds |
| Missing `XACK` after processing | Forget to acknowledge, acknowledgment not in default pattern | Messages stay pending, reprocessed on idle timeout, duplicates | Always call `XACK` in try/finally after processing |
| No pending message claiming | Assume consumer failures are rare or auto-recover | Crashed consumer's pending messages lost forever | Implement `XAUTOCLAIM` or periodic `XCLAIM` |
| Not monitoring PEL/lag | No built-in dashboard like Horizon | Processing gaps invisible, consumer failures undetected | Monitor `XPENDING` count, alert on threshold |
| No stream trimming | Append-only grows unbounded, "we'll add trimming later" | Redis runs out of memory, crash, data loss | Use `XADD MAXLEN ~ 100000` from the start |
| Raw XREAD without consumer groups | Simpler to implement, works in development | No load balancing, no ack, no PEL, no failure recovery | Always use `XREADGROUP` for production |
| No dead-letter handling | Rely on retry mechanism alone | Poison messages retried forever, consuming worker time | Move to DL stream after N failures |

---

# Examples

**Laravel redis-stream connection with read_timeout:**
```php
// config/queue.php
'connections' => [
    'redis-stream' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => 'default',
        'retry_after' => 90,
        'block_for' => null,
        'after_commit' => true,
        'read_timeout' => 2, // Critical: reconnect after 2s idle
    ],
],
```

**Manual stream consumer with acknowledgment:**
```php
$streamKey = 'orders:queue';
$groupName = 'orders-processors';
$consumerName = gethostname() . ':' . getmypid();

// Create consumer group (idempotent)
$redis->xgroup('CREATE', $streamKey, $groupName, '0', true);

// Blocking read with timeout
$entries = $redis->xreadgroup(
    $groupName,
    $consumerName,
    [$streamKey => '>'],
    1,     // count
    2000  // block ms
);

foreach ($entries[$streamKey] ?? [] as $id => $data) {
    try {
        processMessage($data);
        $redis->xack($streamKey, $groupName, [$id]);
    } catch (RetryableException $e) {
        // Let idle timeout handle retry — or use XCLAIM after delay
    } catch (PermanentException $e) {
        // Move to dead-letter stream
        $redis->xadd('orders:dlt', '*', $data + ['_error' => $e->getMessage()]);
        $redis->xack($streamKey, $groupName, [$id]);
    }
}
```

**Pending message claiming with XAUTOCLAIM (Redis 6.2+):**
```php
// Claim messages pending > 1 hour from any consumer in the group
$claimed = $redis->xautoclaim(
    'orders:queue',
    'orders-processors',
    $consumerName,
    3600000,  // min idle time (ms) — 1 hour
    '0-0',    // start from beginning
    ['COUNT' => 100]
);

foreach ($claimed['entries'] ?? [] as $id => $data) {
    try {
        processMessage($data);
        $redis->xack('orders:queue', 'orders-processors', [$id]);
    } catch (Throwable $e) {
        // Log and let next claiming cycle handle
        Log::warning('Claimed message processing failed', ['id' => $id, 'error' => $e->getMessage()]);
    }
}
```

**Consumer group health monitoring:**
```php
$pending = $redis->xpending('orders:queue', 'orders-processors');
if ($pending['pending'] > 100) {
    alert("Consumer group orders-processors has {$pending['pending']} pending messages");
}

$info = $redis->xinfo('groups', 'orders:queue');
foreach ($info as $group) {
    $consumers = $redis->xinfo('consumers', 'orders:queue', $group['name']);
    foreach ($consumers as $consumer) {
        if ($consumer['pending'] > 50) {
            alert("Consumer {$consumer['name']} has {$consumer['pending']} pending messages");
        }
    }
}
```

---

# Related Topics

**Prerequisites:**
- K002 Queue Driver Architecture — Understanding Laravel queue abstraction
- K010 Redis Fundamentals — Redis data types, persistence, replication
- K011 Horizon Architecture — Horizon's relationship to Redis queues

**Closely Related Topics:**
- K040 Redis Streams Queue Backend — Full Laravel Redis Streams integration
- K024 Retry and Failure Handling — Worker failure recovery patterns
- K023 Dead-Letter Queue Pattern — DLQ implementation for stream messages

**Advanced Follow-Up Topics:**
- K042 Redis Streams vs Kafka — In-depth comparison for event streaming
- K043 Redis Streams with Redis Cluster — Streams in clustered environments
- K044 Redis Streams Consumer Group Scaling — Horizontal worker scaling

**Cross-Domain Connections:**
- Redis Administration — Persistence, replication, memory management
- Horizon Configuration — Queue monitoring with Redis backend
- Cache Integration — Sharing Redis between cache and streams

---

# AI Agent Notes

- **read_timeout is the most commonly misconfigured setting.** Without it, workers appear alive but process nothing after a network blip. Always validate this in code reviews.
- **XAUTOCLAIM (Redis 6.2+) is superior to XCLAIM** because it atomically scans the PEL and claims eligible messages. Manual XCLAIM requires iterating XPENDING results, which is error-prone.
- **Stream trimming (`MAXLEN ~`) with the tilde (~) prefix is critical** — it enables approximate trimming that runs in O(1) instead of O(N). Always use `~` unless you have a specific reason for exact trimming.
- **Consumer group idle timeout is NOT configurable per consumer** — Redis uses a formula based on the last message delivery time. Set a predictable `read_timeout` to make idle timeout behavior predictable.
- **`laravel-common` handles some of these details** (group creation, XACK, read loop) but not all (dead-letter handling, claiming, monitoring). Review the specific version's implementation.
- **Redis Streams are NOT compatible with Laravel Horizon's queue monitoring** for anything beyond basic queue depth. Advanced stream health metrics (PEL, per-consumer state) require custom monitoring.
- **When consumer groups are exhausted (all messages delivered, all pending), XREADGROUP returns nothing** until new messages arrive. The blocking read is essential for worker efficiency.
