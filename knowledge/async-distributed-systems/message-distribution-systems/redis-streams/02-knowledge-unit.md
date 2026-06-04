# Redis Streams via `laravel-common`

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** Redis Streams
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
Redis Streams is a Redis data type (introduced in Redis 5.0) that models an append-only log structure — similar to Kafka but in-memory and significantly simpler to operate. In Laravel, Redis Streams serve as the backbone for queue processing when using the `redis` queue driver with consumer groups. The `laravel-common` package extends Redis Streams with consumer group support, enabling message acknowledgment, pending message tracking, and horizontal scaling across workers. Redis Streams offer the lowest operational overhead for teams already running Redis — typically the same Redis instance used for caching.

---

## Core Concepts
- **Stream**: An append-only log of entries with unique auto-generated IDs (timestamp-sequence) and field-value pairs — analogous to a Kafka topic in Redis
- **Consumer Group**: A group of consumers that collaboratively consume a stream — each message is delivered to one consumer in the group (like Kafka consumer groups)
- **Consumer**: A named process within a consumer group that reads and processes messages, with its own Pending Entry List (PEL)
- **PEL (Pending Entry List)**: A list of messages delivered to a consumer but not yet acknowledged — enables fault recovery via message claiming
- **XREADGROUP**: Command to read messages as part of a consumer group — returns undelivered messages or the consumer's own pending messages
- **XACK**: Acknowledges successful message processing — removes the message from the consumer's PEL
- **XCLAIM / XAUTOCLAIM**: Transfers ownership of pending messages from one consumer to another — enables recovery from consumer failures
- **Stream Trimming (XTRIM / XADD MAXLEN)**: Controls stream size by removing old entries — prevents unbounded memory growth

---

## Mental Models
1. **Redis Streams as In-Memory Kafka-Light**: Redis Streams provide Kafka-like consumer groups and append-only logs but live entirely in RAM. The tradeoff is operational simplicity (one fewer system to manage) versus memory-bound storage and lower throughput ceilings. For teams already running Redis, streams are a natural extension — no new infrastructure, no new credentials, no new monitoring.
2. **PEL as Unfinished Business List**: Each consumer has a PEL — a list of messages it received but hasn't acknowledged. Like a to-do list, items stay on the list until marked done (XACK). If a worker crashes, its to-do list is claimed by another worker (XCLAIM) who follows up on those unfinished items.

---

## Internal Mechanics
A consumer creates or joins a consumer group via `XGROUP CREATE`. The consumer issues `XREADGROUP BLOCK 2000` which blocks for up to 2 seconds waiting for new messages. When a message arrives, Redis delivers it to the consumer and adds it to the consumer's PEL. The consumer processes the message and calls `XACK` to remove it from the PEL. If the consumer crashes before XACK, the message remains in the PEL. Another consumer (or the same one after restart) can claim pending messages using `XAUTOCLAIM` (Redis 6.2+) which finds messages in the PEL that have been idle longer than a threshold.

---

## Patterns
### Consumer Group with Blocking Read
- **Purpose**: Efficient message consumption without busy-polling
- **Mechanism**: XREADGROUP with BLOCK timeout — worker waits for messages, near-zero CPU while idle
- **Benefits**: CPU efficiency, immediate message delivery, built-in load balancing across consumers
- **Tradeoffs**: Requires persistent connection to Redis; network hiccups cause worker to hang without read_timeout

### Dead-Letter Stream Pattern
- **Purpose**: Handle persistently failing messages without blocking the main stream
- **Mechanism**: After N failures (tracked via message metadata or retry count), move message to a dead-letter stream (e.g., `orders:dlt`)
- **Benefits**: Poison messages don't block processing of valid messages; DL stream can be inspected and reprocessed
- **Tradeoffs**: Requires tracking retry count in application code; DL stream needs its own monitoring

---

## Architectural Decisions
- **Choose Redis Streams when**: Existing Redis infrastructure, Horizon monitoring compatibility needed, sub-millisecond latency required, or simple consumer group workloads with low-to-moderate throughput
- **Choose SQS when**: Fully managed queues, infinite scalability, or cross-region distribution needed
- **Choose Kafka when**: Very high throughput (>100 MB/s), long-term retention (months), or event sourcing with replayability
- **Key decision**: Always set `read_timeout` on blocking reads (default has no timeout — worker hangs forever on network hiccup)

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Sub-millisecond latency | Memory-bound storage — RAM cost for large streams | Trim streams with `MAXLEN ~` to bound memory |
| Same Redis for queues + cache + sessions | Single-threaded — stream ops compete with other Redis users | Separate Redis instance for high-throughput streams |
| Consumer groups with PEL and claiming | At-least-once delivery — duplicates possible on consumer failure | Jobs must be idempotent |
| Horizon monitoring compatible | Redis Streams don't support complex routing or fan-out | Use RabbitMQ or Kafka for complex routing |

---

## Performance Considerations
Redis is single-threaded for command execution — all stream operations (XADD, XREADGROUP, XACK, XTRIM) compete for the same event loop. Approximate trimming (`MAXLEN ~ N`) is far more efficient than exact trimming. Blocking reads eliminate busy-polling — near-zero CPU while waiting. Consumer group overhead: each group maintains consumer state and PEL in memory — more groups = more memory. PEL growth impacts performance — a large PEL (millions of entries) degrades XREADGROUP performance. Memory cost per stream entry is proportional to field-value pairs stored — plan memory, use `MEMORY USAGE <key>` to estimate.

---

## Production Considerations
Always set `read_timeout` on blocking reads — the default has no timeout, a network hiccup causes the worker to hang forever. Always implement pending message claiming via `XAUTOCLAIM` — messages assigned to a crashed consumer remain pending forever unless claimed. Always call `XACK` after successful processing — without acknowledgment, messages remain pending and reprocessed. Monitor consumer group PEL length and lag — growing PEL indicates a processing failure or dead consumer. Trim streams to bound memory usage — without trimming, streams grow until Redis runs out of memory.

---

## Common Mistakes
1. **No `read_timeout` on blocking reads**: Worker hangs indefinitely on network hiccup, processing stops — set `read_timeout = 2` seconds.
2. **Missing `XACK` after processing**: Messages stay pending, reprocessed on idle timeout, causing duplicates — always call `XACK` in try/finally after processing.
3. **No pending message claiming**: Crashed consumer's pending messages lost forever — implement `XAUTOCLAIM` or periodic `XCLAIM`.
4. **Not monitoring PEL/lag**: Processing gaps invisible, consumer failures undetected — monitor `XPENDING` count, alert on threshold.
5. **No stream trimming**: Append-only grows unbounded, Redis runs out of memory — use `XADD MAXLEN ~ 100000` from the start.

---

## Failure Modes
- **Worker hang**: Network hiccup without read_timeout — worker appears alive but processes nothing
- **Duplicate flooding**: No XACK on processed messages — on idle timeout, all pending messages redelivered, flooding workers
- **Consumer crash without claiming**: Mid-processing crash leaves messages in PEL — no other consumer can process those messages unless explicitly claimed
- **Redis OOM from unbounded stream**: No trimming — stream grows until Redis runs out of memory, crash, data loss
- **Memory exhaustion**: Redis near capacity — adding stream workloads risks OOM; monitor `used_memory` before adding streams

---

## Ecosystem Usage
Laravel's built-in `redis` queue driver uses Redis Streams under the hood (Laravel 11+). The driver handles XREADGROUP, XACK, and basic consumer group management automatically. For advanced stream features (XCLAIM, dead-letter handling, PEL monitoring), the `laravel-common` package provides extended support. Beyond queue processing, Redis Streams are used for event broadcasting, real-time data pipelines, and inter-service communication within the same data center.

---

## Related Knowledge Units
### Prerequisites
- Queue Driver Architecture — Understanding Laravel queue abstraction
- Redis Fundamentals — Redis data types, persistence, replication
- Horizon Architecture — Horizon's relationship to Redis queues

### Related Topics
- Redis Streams Queue Backend — Full Laravel Redis Streams integration
- Retry and Failure Handling — Worker failure recovery patterns
- Dead-Letter Queue Pattern — DLQ implementation for stream messages

### Advanced Follow-up Topics
- Redis Streams vs Kafka — In-depth comparison for event streaming
- Redis Streams with Redis Cluster — Streams in clustered environments
- Redis Streams Consumer Group Scaling — Horizontal worker scaling

---

## Research Notes
`read_timeout` is the most commonly misconfigured setting — without it, workers appear alive but process nothing after a network blip. `XAUTOCLAIM` (Redis 6.2+) is superior to `XCLAIM` because it atomically scans the PEL and claims eligible messages. Stream trimming (`MAXLEN ~`) with the tilde (~) prefix enables approximate trimming in O(1) instead of O(N). Consumer group idle timeout is NOT configurable per consumer — set a predictable `read_timeout` to make idle timeout behavior predictable. The `laravel-common` package handles some of these details but not all (dead-letter handling, claiming, monitoring).
