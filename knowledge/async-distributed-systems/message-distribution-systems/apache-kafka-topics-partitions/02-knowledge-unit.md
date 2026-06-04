# Apache Kafka Topics and Partitions

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** Apache Kafka Topics and Partitions
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
Apache Kafka is a distributed event streaming platform built around the publish-subscribe model. Its core abstraction is a topic (logical channel for related messages) divided into partitions (physical units of parallelism, fault tolerance, and scalability). In Laravel, Kafka is used for high-throughput event streaming, cross-service event bus communication, and long-term event retention beyond SQS's 14-day max. Unlike SQS where queue throughput is managed by AWS, Kafka requires explicit partition count decisions that directly impact throughput, ordering guarantees, and consumer parallelism.

---

## Core Concepts
- **Topic**: A logical channel to which records are published — partitioned and replicated across brokers
- **Partition**: An ordered, immutable sequence of records — the unit of parallelism consumed by at most one consumer in a group
- **Broker**: A Kafka server that stores data and serves clients — clusters have multiple brokers for fault tolerance
- **Consumer Group**: A set of consumers collaboratively consuming a topic — each partition is assigned to exactly one consumer in the group
- **Offset**: A sequential ID assigned to each record within a partition — consumers track their offset to know consumption progress
- **Consumer Lag**: The difference between the latest offset and the consumer's current offset — high lag indicates the consumer cannot keep up
- **Rebalance**: The process of reassigning partitions to consumers when a consumer joins, leaves, or crashes — during rebalance, no data is processed
- **Key-based Partitioning**: Records with the same key always go to the same partition, guaranteeing order for those records

---

## Mental Models
1. **Partitions as Lanes on a Highway**: A topic is a highway with N lanes (partitions). Each lane is ordered — cars (messages) in lane 1 stay in lane 1 order. A consumer group has up to N cars (consumers) — one per lane. Adding more cars than lanes doesn't increase throughput; they just sit idle. The key (entity ID) determines which lane a car enters — cars with the same key always use the same lane, preserving their order relative to each other.
2. **Offset as Bookmark**: Each consumer group has its own bookmark (offset) per partition. It reads from its bookmark and advances as messages are consumed. If the consumer crashes and restarts, it picks up from the last committed bookmark — no messages are lost (as long as they haven't been deleted by retention). Multiple consumer groups reading the same topic each have their own independent bookmarks.

---

## Internal Mechanics
When a producer sends a record, it specifies a topic and optionally a key. If a key is provided, Kafka hashes the key to determine the partition — ensuring same-key records go to the same partition. If no key is provided, records are distributed round-robin. Each partition is an ordered commit log — records are appended to the end and assigned a sequential offset. Consumers in a group coordinate which consumer reads which partition. When a consumer joins or leaves, a rebalance triggers, reassigning partitions. During rebalance, all consumers in the group stop processing.

---

## Patterns
### Key-Based Partitioning for Entity Ordering
- **Purpose**: Guarantee ordered processing per entity (customer, order, tenant)
- **Mechanism**: Use entity ID as the message key — all messages for that entity go to the same partition
- **Benefits**: Per-entity ordering guarantee, entity-level parallelism (different entities in different partitions)
- **Tradeoffs**: Throughput per entity is limited to single partition throughput (~10 MB/s)

### Consumer Group for Independent Processing
- **Purpose**: Multiple services independently consuming the same topic at different rates
- **Mechanism**: Each service has its own consumer group with independent offset tracking
- **Benefits**: New consumers can replay from the beginning to build their own data views
- **Tradeoffs**: Each consumer group adds overhead — broker must track offsets for each group per partition

---

## Architectural Decisions
- **Choose Kafka when**: Throughput exceeds 100 MB/s, long-term retention needed (months/years), replayable event streams for event sourcing, cross-service event bus, or ordered processing per entity at scale
- **Choose SQS when**: Simple decoupled job processing, zero-infrastructure queues, or FIFO ordering within 300 TPS limits
- **Choose Redis Streams when**: Existing Redis infrastructure, sub-millisecond latency, or Horizon monitoring compatibility needed
- **Key decision**: Partition count cannot be decreased — start conservative and expand only when measured throughput requires it

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Very high throughput (100+ MB/s per cluster) | Operational complexity — requires specialized expertise | 3-broker minimum for production with replication factor 3 |
| Long-term retention (months/years) | Disk storage costs for retained data | Set finite retention based on data value (7-365 days) |
| Replayable event streams | Higher latency than Redis (2-10ms minimum) | Not suitable for sub-millisecond real-time processing |
| Cross-service consumer group independence | Rebalance complexity at scale | Cooperative rebalancing (Kafka 3.1+) mitigates downtime |

---

## Performance Considerations
Single partition throughput: 5-10 MB/s writes, 10-50 MB/s reads depending on hardware. Consumer parallelism ceiling equals partition count — scale partitions before scaling consumers. Batch size matters — larger batches = higher throughput, higher latency. Compression (gzip, snappy, lz4, zstd) reduces network and storage usage by 50-80%. Ack configuration: `acks=all` (safest, highest latency), `acks=1` (moderate), `acks=0` (fastest, risk of data loss). Rebalance duration scales with partition count — a 1000-partition rebalance can take 30-60 seconds.

---

## Production Considerations
Replication factor of 3 for production — tolerates one broker failure without data loss. Consumer lag is the single most important Kafka health metric — monitor per consumer group, alert on growth. Right-size partitions based on throughput: `ceil(p eak / 10 MB/s) × 1.3`. Keep consumer count ≤ partition count per consumer group. Enable TLS encryption for all broker-client communication. Apply ACL least privilege — producers need WRITE only, consumers need READ only. Use schema registry (Avro, Protobuf, JSON Schema) for production topics.

---

## Common Mistakes
1. **Too few partitions**: Default partition count (1 or 3) without throughput analysis — throughput capped, consumers idle. Calculate: `ceil(peak / 10 MB/s) × 1.3`.
2. **Too many partitions**: Over-provisioning for future — rebalance takes minutes, broker metadata overhead. Start with calculated count + 30%, monitor and expand.
3. **More consumers than partitions**: Extra consumers sit idle — keep consumers ≤ partitions; scale partitions first.
4. **No partition key for ordered messages**: Related messages processed out of order — always provide key for related messages.
5. **Infinite retention**: Disk fills up, cluster crashes — set finite retention per data value (7-365 days).

---

## Failure Modes
- **Consumer lag growing unchecked**: Processing gaps invisible, SLOs violated, backlog critical — monitor lag per consumer group
- **Rebalance storm**: Frequent consumer joins/leaves cause repeated rebalances, no data processed — use static group membership (Kafka 3.1+)
- **Leader failure**: Partition leader broker goes down — a follower becomes the new leader, but during election (seconds), that partition is unavailable
- **Disk full**: Retention set too long or consumer fell behind — broker stops accepting writes, all topics affected
- **Commit after processing failure**: Auto-commit commits offset before processing completes — messages lost on crash. Use manual offset commits after processing.

---

## Ecosystem Usage
Laravel Kafka integration is via community packages (`mateusjunges/laravel-kafka`, `rdkafka` PHP extension). Configuration covers topic configuration (partitions, replication, retention), producer settings (acks, compression, batch size), and consumer group settings (auto-commit, max.poll.records). Unlike SQS and Redis, Kafka is not a built-in Laravel queue driver — custom queue driver implementation is needed.

---

## Related Knowledge Units
### Prerequisites
- Distributed Systems Fundamentals — Brokers, clustering, fault tolerance
- Queue Driver Architecture — Message broker concepts
- Event-Driven Architecture — Events vs messages, pub-sub model

### Related Topics
- Consumer Groups and Offset Management — Detailed consumer mechanics
- Kafka Connect and Schema Registry — Integration patterns
- Kafka Streams — Stream processing within Kafka
- Producing and Consuming in Laravel — PHP/Kafka integration

### Advanced Follow-up Topics
- Kafka Exactly-Once Semantics — Idempotent producers, transactions
- Kafka Performance Tuning — Broker configuration, OS tuning
- Kafka Security with mTLS and ACLs — Production security setup
- Event Sourcing with Kafka — Event store architecture

---

## Research Notes
Partition count cannot be decreased — always start conservative and expand only when measured throughput requires it. Kafka's ordering guarantee is per-partition only — global ordering requires a single partition, which caps throughput. Consumer lag is the single most important Kafka health metric. Rebalance duration scales roughly linearly with partition count. Default `max.poll.records` = 500 — if processing takes longer than `max.poll.interval.ms` (default 5 minutes), Kafka considers the consumer dead and triggers rebalance. Never commit offsets before processing completes.
