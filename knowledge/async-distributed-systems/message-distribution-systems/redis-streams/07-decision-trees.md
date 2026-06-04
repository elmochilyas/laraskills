# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** Redis Streams
**Generated:** 2026-06-04

---

# Decision Inventory

* Redis Streams vs Alternative Distribution Platforms
* Consumer Group vs Raw XREAD
* read_timeout Value Selection
* Pending Message Claiming Strategy
* Stream Trimming Strategy
* Dead-Letter Processing Strategy
* Consumer Name Strategy

---

# Architecture-Level Decision Trees

---

## Redis Streams vs Alternative Distribution Platforms

### Decision Context

Choosing between Redis Streams, SQS, Kafka, or RabbitMQ for message distribution.

### Decision Criteria

- Existing infrastructure (Redis already deployed?)
- Horizon monitoring requirement
- Throughput requirements
- Retention and replay requirements
- Latency sensitivity
- Operational overhead tolerance

### Decision Tree

```
Redis already in use for caching/sessions?
├── YES → Horizon monitoring required?
│   ├── YES → Use Redis Streams (only option for Horizon)
│   └── NO → Throughput < 100 MB/s AND retention < 7 days?
│       ├── YES → Use Redis Streams — low overhead, sub-ms latency
│       └── NO → Use Kafka — high throughput, long retention
└── NO → Managed service preferred?
    ├── YES → Use SQS — zero infrastructure management
    └── NO → Complex routing needed (exchanges, bindings)?
        ├── YES → Use RabbitMQ
        └── NO → Throughput < 100 MB/s?
            ├── YES → Use Redis Streams (deploy Redis)
            └── NO → Use Kafka
```

### Rationale

Redis Streams hit a sweet spot: simple operation, excellent performance, and Horizon compatibility. They're the right choice when Redis is already present and throughput is moderate. For high throughput or long retention, Kafka is superior. For zero operations, SQS is the choice.

### Recommended Default

**Default:** Redis Streams when Horizon is required or Redis is already in use; SQS for new AWS-hosted applications without Horizon dependency
**Reason:** Redis Streams minimize operational complexity when Redis is already present. SQS eliminates all queue infrastructure management.

### Risks Of Wrong Choice

- Redis Streams for high throughput: single-threaded Redis event loop becomes bottleneck, affects cache performance
- Redis Streams for long retention: memory costs explode, Redis fills up
- SQS when Horizon needed: Horizon doesn't support SQS, requires custom monitoring

### Related Rules

- set-read-timeout-for-streams (05-rules.md)

### Related Skills

- Configure and Manage Redis Streams (06-skills.md)

---

## Consumer Group vs Raw XREAD

### Decision Context

Whether to use consumer groups (XREADGROUP) or raw stream reads (XREAD) for consuming Redis Streams.

### Decision Criteria

- Horizontal scaling requirement
- Load-balanced message distribution
- Acknowledgment and reliability
- Pending message tracking

### Decision Tree

```
Multiple worker processes consuming the same stream?
├── YES → Messages should be distributed (not broadcast)?
│   ├── YES → Use consumer groups (XREADGROUP) — load-balanced
│   │   └── Required features: ack, PEL, claiming, scaling
│   └── NO → All workers should receive all messages?
│       ├── YES → Use raw XREAD — broadcast delivery
│       └── NO → Default to consumer groups
└── NO → Single consumer, reliability not critical?
    ├── YES → Raw XREAD acceptable (development only)
    └── NO → Single consumer, production reliability needed?
        ├── YES → Use consumer groups (even for one consumer)
        │   └── Benefit: PEL tracking, failure recovery via claiming
        └── NO → Default to consumer groups
```

### Rationale

Consumer groups provide message distribution, acknowledgment, pending tracking, and failure claiming — essential for production reliability. Raw XREAD delivers every message to every consumer (broadcast) with no acknowledgment or state tracking. Raw XREAD is only appropriate for fan-out notification patterns or development.

### Recommended Default

**Default:** Always use consumer groups for production stream consumption
**Reason:** Consumer groups are the only way to get load-balanced processing, acknowledgment, and failure recovery.

### Risks Of Wrong Choice

- Raw XREAD in production: no load balancing, no failure recovery, messages processed multiple times (all consumers)
- Consumer groups for broadcast: intentional broadcast requires raw XREAD or separate consumer groups per consumer

### Related Rules

- acknowledge-after-processing (05-rules.md)
- monitor-consumer-group-lag (05-rules.md)

### Related Skills

- Configure and Manage Redis Streams (06-skills.md)

---

## read_timeout Value Selection

### Decision Context

Setting the blocking read timeout value for Redis Streams consumers.

### Decision Criteria

- Network reliability
- Redis load
- Reconnection frequency tolerance
- Processing latency requirements

### Decision Tree

```
Network between worker and Redis is reliable (< 0.1% packet loss)?
├── YES → Processing latency sensitive (< 5 second message pickup)?
│   ├── YES → Set read_timeout = 1 second
│   │   └── More reconnections, but faster message pickup
│   └── NO → Set read_timeout = 5 seconds
│       └── Fewer reconnections, adequate latency
└── NO → Network is unreliable (> 0.1% packet loss)?
    ├── YES → Set read_timeout = 2 seconds
    │   └── Balance: reconnection frequency vs connection reliability
    └── NO → Default to read_timeout = 2 seconds
```

### Rationale

Without a read timeout, a blocking read that loses the Redis connection hangs the worker forever. The timeout forces periodic reconnection, recovering from transient network failures. Shorter timeouts provide faster recovery but more CPU on reconnection overhead. Longer timeouts reduce reconnection frequency but increase exposure to network hiccups.

### Recommended Default

**Default:** `read_timeout = 2` seconds
**Reason:** Balances reconnection frequency (every 2s) against fast recovery from network hiccups. Most production systems use 1-5 seconds.

### Risks Of Wrong Choice

- Too short (< 1s): excessive reconnections, CPU wasted on connection overhead
- Too long (> 10s): slow recovery from network issues, processing stall extends to timeout duration
- Not set (infinite): worker hangs forever on any network blip, processing stops entirely

### Related Rules

- set-read-timeout-for-streams (05-rules.md)

### Related Skills

- Configure and Manage Redis Streams (06-skills.md)

---

## Pending Message Claiming Strategy

### Decision Context

How and when to claim pending messages from failed consumers to ensure no messages are lost.

### Decision Criteria

- Message processing time
- Consumer failure frequency
- Duplicate tolerance
- Redis version (6.2+ for XAUTOCLAIM)

### Decision Tree

```
Redis version >= 6.2?
├── YES → Use XAUTOCLAIM — simpler, atomic, recommended
│   ├── Consumer failure frequency > 1/day?
│   │   ├── YES → Set claim interval = 10 minutes, min idle = 5 minutes
│   │   └── NO → Set claim interval = 1 hour, min idle = 30 minutes
│   └── Processing time variance high?
│       ├── YES → Set min idle = max_processing_time × 3
│       └── NO → Set min idle = max_processing_time × 2
└── NO → Use manual XCLAIM (Redis < 6.2)
    ├── Step 1: XPENDING stream group - + 100 [consumer]
    ├── Step 2: XCLAIM stream group claimConsumer minIdleTime [id1, id2, ...]
    └── Set claim interval same as XAUTOCLAIM guidance above
```

### Rationale

Pending messages assigned to a dead consumer are never automatically redistributed. Claiming transfers ownership to a live consumer. XAUTOCLAIM is preferred because it atomically scans the PEL and claims eligible messages. The min idle time prevents claiming messages that are legitimately being processed (the original consumer is just slow).

### Recommended Default

**Default:** `XAUTOCLAIM` with minIdleTime = max_processing_time × 3, run every 5 minutes
**Reason:** Three times the max processing time provides safety margin for slow processing while catching dead consumers within minutes.

### Risks Of Wrong Choice

- Min idle too short: messages claimed from healthy but slow consumers, duplicate processing
- Min idle too long: dead consumer's messages sit unprocessed for extended period
- No claiming at all: messages from dead consumers lost forever

### Related Rules

- claim-pending-on-failure (05-rules.md)

### Related Skills

- Configure and Manage Redis Streams (06-skills.md)

---

## Stream Trimming Strategy

### Decision Context

Controlling stream size to prevent unbounded memory growth.

### Decision Criteria

- Memory budget allocated to streams
- Message throughput
- Retention period for unprocessed messages
- Consumer lag tolerance

### Decision Tree

```
Memory is constrained (< 1GB for streams)?
├── YES → Set aggressive trimming: MAXLEN ~ 10000
│   └── Monitor for consumer lag exceeding retention window
└── NO → Throughput known (> 1000 msg/s)?
    ├── YES → Calculate: max_entries = memory_budget_bytes / avg_message_bytes
    │   └── Set MAXLEN ~ max_entries with 20% buffer
    └── NO → Start conservative: MAXLEN ~ 100000
        └── Monitor stream length and memory, adjust down if growing too fast
```

### Rationale

Redis is memory-bound. Each stream entry consumes memory proportional to its field-value pairs. Without trimming, any consumer that falls behind causes infinite memory growth. Approximate trimming (MAXLEN ~ N) is efficient and should always be used.

### Recommended Default

**Default:** `XADD MAXLEN ~ 100000` for general-purpose streams
**Reason:** 100,000 entries provide a generous buffer for most workloads, allowing consumers to be down for minutes without data loss, while keeping memory usage manageable.

### Risks Of Wrong Choice

- No trimming: out-of-memory crash, all Redis data lost
- Too aggressive (MAXLEN ~ 100): consumers that lag briefly lose messages, no recovery
- Exact trimming (MAXLEN N without ~): O(N) performance on every write, CPU spike

### Related Rules

- monitor-consumer-group-lag (05-rules.md)

### Related Skills

- Configure and Manage Redis Streams (06-skills.md)

---

## Dead-Letter Processing Strategy

### Decision Context

Handling messages that repeatedly fail processing in a Redis Stream consumer group.

### Decision Criteria

- Failure classification (retryable vs permanent)
- Message value (can we afford to lose it?)
- Debugging requirements
- Processing latency sensitivity

### Decision Tree

```
Failure is permanently unprocessable (malformed data, invalid schema)?
├── YES → Immediately move to dead-letter stream
│   ├── XADD stream:dlt * [original_data] _error=[reason]
│   └── XACK original stream — remove from PEL
└── NO → Failure is retryable (API timeout, network blip, DB contention)?
    ├── YES → Track retry count in message metadata
    │   ├── Retries < max_retries?
    │   │   ├── YES → Leave in PEL — let claiming/retry handle
    │   │   └── NO → Move to dead-letter stream
    │   └── max_retries = 3 (permanent) or 5 (flaky external dependency)
    └── NO → Unclear failure type?
        ├── YES → Move to dead-letter stream for manual inspection
        └── NO → Default: retry up to 3 times, then dead-letter
```

### Rationale

Dead-letter streams quarantine messages that cannot be processed, preventing them from consuming worker time indefinitely. They also provide an audit trail for debugging. The max retry count distinguishes transient failures (let retry) from permanent failures (immediately dead-letter).

### Recommended Default

**Default:** Retry 3 times for any failure, then move to dead-letter stream; alert on DL stream entries
**Reason:** 3 retries catch most transient issues. Immediate DL for known permanent failures preserves worker capacity.

### Risks Of Wrong Choice

- No dead-letter: poison messages retried forever, worker waste, valid messages delayed
- Dead-letter on first failure: transient failures lose messages unnecessarily
- Dead-letter too late: worker spends significant time on unprocessable messages

### Related Rules

- claim-pending-on-failure (05-rules.md)
- acknowledge-after-processing (05-rules.md)

### Related Skills

- Configure and Manage Redis Streams (06-skills.md)

---

## Consumer Name Strategy

### Decision Context

Assigning unique consumer names within a consumer group for proper message tracking and PEL management.

### Decision Criteria

- Deployment environment (bare metal vs Kubernetes vs Docker)
- Consumer lifecycle
- PEL cleanup requirements
- Debugging/observability

### Decision Tree

```
Running on Kubernetes?
├── YES → Use pod name + container name as consumer name
│   └── Format: {pod-name}-{container-name}
│   └── Pod names are unique within a deployment
└── NO → Running on bare metal or VM?
    ├── YES → Use hostname + PID as consumer name
    │   └── Format: {hostname}:{pid}
    │   └── PID changes on restart = unique name
    └── NO → Docker (non-K8s)?
        ├── YES → Use container hostname (Docker generates unique hostname)
        └── NO → Default to hostname:pid
```

### Rationale

Unique consumer names prevent message tracking confusion. If two consumers share the same name, Redis treats them as the same consumer — PEL entries are mixed, acknowledgment may affect the wrong consumer, and monitoring shows incorrect per-consumer states.

### Recommended Default

**Default:** `{hostname}:{pid}` for VMs/bare metal; `{pod-name}` for Kubernetes
**Reason:** Guarantees uniqueness within the consumer group. Hostname:pid is unique even on the same machine. Kubernetes pod names are unique within a deployment.

### Risks Of Wrong Choice

- Duplicate names: message tracking broken, PEL confusion, consumer health monitoring inaccurate
- Static names (e.g., "worker-1"): collisions on re-deploy, PEL assigned to defunct consumer instances

### Related Rules

- acknowledge-after-processing (05-rules.md)
- monitor-consumer-group-lag (05-rules.md)

### Related Skills

- Configure and Manage Redis Streams (06-skills.md)
