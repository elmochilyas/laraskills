# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** Apache Kafka Topics and Partitions
- **Knowledge ID:** K038
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-04
- **Source References:**
  - Apache Kafka Documentation
  - Confluent Kafka Architecture Guides
  - Laravel Kafka Packages (mateusjunges/laravel-kafka, rdkafka)

---

# Overview

Apache Kafka is a distributed event streaming platform built around the publish-subscribe model. Its core abstraction is a **topic** — a logical channel for related messages — which is physically divided into **partitions** for parallelism, fault tolerance, and scalability. Topics define the data category, while partitions enable horizontal scaling by distributing data across multiple brokers.

In the Laravel ecosystem, Kafka is used for high-throughput event streaming, cross-service event bus communication, and long-term event retention (beyond SQS's 14-day max). Unlike SQS where queue throughput is managed by AWS, Kafka requires explicit partition count decisions that directly impact throughput, ordering guarantees, and consumer parallelism.

Engineers choose Kafka when they need: throughput exceeding 100 MB/s, message retention measured in months or years, replayable event streams, and a distributed commit log for event sourcing. The primary tradeoffs are operational complexity (cluster management) and higher latency compared to simpler queue systems.

---

# Core Concepts

- **Topic:** A logical channel or feed name to which records are published. Topics are partitioned and replicated across brokers.
- **Partition:** An ordered, immutable sequence of records. Each partition is a distributed commit log stored on disk. Partitions are the unit of parallelism — one partition is consumed by at most one consumer in a group.
- **Broker:** A Kafka server that stores data and serves clients. A cluster has multiple brokers for fault tolerance and load distribution.
- **Record/Message:** A key-value pair with optional headers and timestamp. The key determines partition assignment.
- **Offset:** A sequential ID assigned to each record within a partition. Consumers track their offset to know which records have been consumed.
- **Consumer Group:** A set of consumers that collaboratively consume a topic. Each partition is assigned to exactly one consumer in the group. Adding consumers increases parallelism up to the partition count.
- **Partition Leader:** The broker responsible for all reads and writes to a partition. Followers replicate the leader's data for fault tolerance.
- **Replication Factor:** The number of copies of each partition across brokers. A factor of 3 means the partition's data exists on three brokers.
- **Log Compaction:** A retention policy that keeps only the latest record for each key within a partition, discarding older records. Useful for state snapshots and compacted topics.
- **Consumer Lag:** The difference between the latest offset in a partition and the consumer's current offset. High lag indicates the consumer cannot keep up with the production rate.
- **Rebalance:** The process of reassigning partitions to consumers when a consumer joins, leaves, or crashes. During rebalancing, no data is processed.
- **Key-based Partitioning:** Records with the same key always go to the same partition, guaranteeing order for those records. Without a key, records are distributed round-robin.

---

# When To Use

- **High-throughput event streaming:** Kafka handles 100+ MB/s per cluster with ease. Ideal for metrics, logs, clickstreams, and IoT data.
- **Long-term message retention:** Kafka retains messages for configurable periods (days to months, even infinite). Consumers can replay from any point in the retention window.
- **Event sourcing and CQRS:** The immutable commit log architecture makes Kafka a natural event store. Replaying events from the beginning reconstructs application state.
- **Cross-service event bus:** Multiple services can independently consume the same topic at their own pace. New services can replay from the beginning to build their own data views.
- **Data pipeline integration:** Kafka Connect integrates with databases, S3, Elasticsearch, and hundreds of other systems without custom code.
- **Ordered message processing per entity:** Using keys guarantees that messages for the same entity (e.g., a customer, an order) are processed in order.
- **Large payloads (> 256KB):** Kafka's default max message size is 1MB, configurable higher. Avoids SQS's 256KB limitation.

---

# When NOT To Use

- **Simple decoupled job processing:** SQS or Redis streams are simpler and cheaper for basic queue workloads.
- **Sub-millisecond latency requirements:** Kafka adds 2-10ms minimum latency. For real-time processing, use Redis or WebSockets.
- **Low throughput (< 1 MB/s):** The operational overhead of running a Kafka cluster outweighs benefits at low volume.
- **Small team without Kafka operations expertise:** Kafka requires specialized knowledge for cluster management, monitoring, and troubleshooting.
- **Single-consumer workloads:** If only one service consumes the events, a simpler queue (SQS, Redis) provides the same decoupling with less complexity.
- **Exactly-once semantics required across partitions:** Kafka's exactly-once guarantees are within a single partition or across partitions with transactions — complex to implement correctly.
- **Short-lived messages (< 1 hour retention):** Kafka's log-based storage is inefficient for messages that should be deleted immediately after consumption. Use a traditional queue instead.
- **Horizon-integrated monitoring:** Horizon does not support Kafka. Use Confluent Control Center, Burrow, or custom monitoring.

---

# Best Practices

- **Right-size partitions based on throughput:** Calculate partitions as `ceil(peak_throughput / single_partition_throughput) × 1.3`. A single partition handles approximately 5-10 MB/s. Under-provisioning caps parallelism; over-provisioning adds metadata overhead and rebalance latency. *Why: Too few partitions limit consumer parallelism — adding more consumers doesn't help if partitions are exhausted. Too many partitions (1000s) increase broker memory usage and rebalance time.*
- **Keep consumer count ≤ partition count per consumer group.** One partition is consumed by at most one consumer in a group. Extra consumers sit idle. *Why: This is a fundamental Kafka constraint — partition assignment is 1:1 within a consumer group. Idle consumers waste compute resources without any throughput benefit.*
- **Always provide a partition key for ordering-sensitive messages.** Messages with the same key go to the same partition, guaranteeing order. Use entity ID, tenant ID, or correlation ID. *Why: Without a key, Kafka distributes messages round-robin across partitions. Related messages go to different partitions and can be processed out of order.*
- **Set finite retention based on data value and compliance.** 7 days for operational data, 30-90 days for analytics, up to 1 year for audit data. Never use infinite retention on high-throughput topics. *Why: Infinite retention grows disk usage unbounded. A consumer that falls behind for weeks can fill broker disks, taking all partitions offline.*
- **Monitor consumer lag as a primary health metric.** Growing lag indicates consumers can't keep up. Investigate before backlog becomes critical. *Why: Consumer lag is the earliest indicator of processing problems. Unlike SQS's ApproximateNumberOfMessagesVisible, Kafka's lag gives per-consumer, per-partition visibility.*
- **Use log compaction for keyed event stores.** If you only need the latest state per key (e.g., last known address, current inventory level), log compaction keeps only the most recent record for each key. *Why: Log compaction provides infinite retention without infinite disk usage. It's ideal for rebuilding state from scratch — replay a compacted topic to recover current state.*
- **Design for rebalance tolerance.** Consumers should be able to handle partition reassignment gracefully. Use cooperative rebalancing (Kafka 3.1+) for sticky partition assignment. *Why: During rebalance, all consumers in the group stop processing. With eager rebalancing, a 500-partition rebalance can take minutes, causing significant processing gaps.*

---

# Architecture Guidelines

- **Partitions are the unit of parallelism, data distribution, and fault tolerance.** Design partition count for peak throughput, not average. A topic's partition count cannot be decreased (only increased).
- **Replication factor of 3 for production.** Tolerates one broker failure without data loss. A factor of 2 is dangerous — losing one broker means the partition may have only one replica left. Factor of 1 provides no fault tolerance.
- **Use separate topics for different data schemas and retention policies.** A topic for order events (7-day retention, 3 partitions) and a topic for audit logs (1-year retention, 1 partition) have different requirements.
- **Avoid very large topics with thousands of partitions.** Each partition adds metadata overhead, file handles, and replication traffic. Benchmark your cluster's partition capacity before scaling beyond 1000 partitions per cluster.
- **Consumer groups provide workload isolation.** A topic can serve multiple consumer groups independently. Each group maintains its own offset and processes at its own pace.
- **Place Kafka between bounded contexts in microservice architectures.** Each service owns its consumer groups and processes events independently. Avoid direct service-to-service calls — use Kafka as the communication backbone.
- **Use schema registry for production topics.** Schema evolution (Avro, Protobuf, JSON Schema) prevents serialization mismatches when producers and consumers evolve independently.
- **Co-locate consumers with Kafka brokers when latency-sensitive.** Network distance between consumer and partition leader adds latency. On Kubernetes, use topology-aware partition assignment.

---

# Performance Considerations

- **Single partition throughput:** 5-10 MB/s for writes, 10-50 MB/s for reads, depending on hardware (disk speed, network, message size).
- **Consumer parallelism ceiling:** Topics with N partitions support at most N consumers per group. Scale partitions before scaling consumers.
- **Batch size matters:** Producing in batches (default Kafka producer batch size 16KB) dramatically improves throughput. Larger batches = higher throughput, higher latency.
- **Ack configuration:** `acks=all` (safest, highest latency), `acks=1` (leader only, moderate), `acks=0` (fire-and-forget, fastest, risk of data loss).
- **Compression:** Enable compression on the producer (gzip, snappy, lz4, zstd). Compression reduces network and storage usage by 50-80% for text-based payloads at the cost of 5-15% CPU overhead.
- **Rebalance duration:** Scales with number of partitions. A 1000-partition rebalance can take 30-60 seconds. Minimize unnecessary rebalances.
- **Disk I/O:** Kafka performance is bound by disk sequential I/O, not random I/O. Use fast SSDs with high sequential write throughput.
- **Memory:** Kafka brokers use OS page cache aggressively. More memory = more cached reads = less disk I/O. Aim for at least 16GB RAM per broker.
- **Message size:** Default max is 1MB. Larger messages degrade throughput because compression is less effective and network transfer times increase.

---

# Security Considerations

- **Authentication:** Kafka supports SASL/PLAIN, SASL/SCRAM, SASL/GSSAPI (Kerberos), SASL/OAUTHBEARER, and mTLS. Use mTLS or SASL/SCRAM for production.
- **Authorization:** ACLs (Access Control Lists) control which users can read/write to which topics. Apply least privilege — producers need only WRITE on their topics, consumers need only READ.
- **Encryption in transit:** Enable TLS encryption for all broker-client and inter-broker communication. Disable plaintext listeners in production.
- **Encryption at rest:** Kafka does not natively encrypt data on disk. Use filesystem-level encryption (LUKS, dm-crypt) or encrypt sensitive fields at the application level before producing.
- **Sensitive data in messages:** Kafka messages are stored on disk in plaintext. Never include passwords, PII, API keys, or secrets in messages without encryption. Use application-level encryption for sensitive payloads.
- **Topic deletion protection:** Enable `delete.topic.enable=false` in production to prevent accidental topic deletion. Topic deletion is a high-risk operation.
- **Rate limiting:** Kafka does not have built-in rate limiting. Use client quotas to limit producer/consumer throughput per client ID to prevent noisy neighbors.
- **Audit logging:** Enable Kafka audit logs to track topic creation, ACL changes, and configuration modifications. Integrate with SIEM for compliance.

---

# Common Mistakes

| Description | Why Developers Make It | Consequences | Better Approach |
|---|---|---|---|
| Too few partitions | Default partition count (1 or 3) without throughput analysis | Throughput capped, consumers idle, adding consumers doesn't help | Calculate: `ceil(peak / 10 MB/s) × 1.3` |
| Too many partitions | Over-provisioning for future growth | Rebalance takes minutes, broker metadata overhead, wasted file handles | Start with calculated count + 30%, monitor and expand |
| More consumers than partitions | Assumption that more consumers = more throughput | Idle consumers waste resources, false sense of scalability | Keep consumers ≤ partitions; scale partitions first |
| No partition key for ordered messages | Not understanding per-partition ordering scope | Related messages processed out of order, state corruption | Always provide key for related messages |
| Infinite retention (`retention.ms=-1`) | "Keep everything just in case" mentality | Disk fills up, cluster crashes, data loss | Set finite retention per data value (7-365 days) |
| Ignoring consumer lag | No monitoring of offset lag | Processing gaps invisible, SLOs violated, backlog critical | Monitor lag per consumer group, alert on growth |
| All topics with same partition count | Copy-paste approach to topic creation | Mismatched throughput capacity vs actual need | Analyze per-topic throughput, set count individually |

---

# Examples

**Partition Count Calculation:**
```php
// Given: peak throughput = 50 MB/s, single partition handles ~10 MB/s
$peakThroughputMBs = 50;
$partitionCapacityMBs = 10;
$desiredPartitions = (int) ceil(($peakThroughputMBs / $partitionCapacityMBs) * 1.3);
// Result: 7 partitions for 50 MB/s with 30% headroom
```

**Kafka Topic Configuration (via rdkafka / mateusjunges/laravel-kafka):**
```php
// config/kafka.php
'topics' => [
    'order-events' => [
        'partitions' => 7,
        'replication_factor' => 3,
        'config' => [
            'retention.ms' => 604800000, // 7 days
            'cleanup.policy' => 'delete',
            'compression.type' => 'snappy',
        ],
    ],
    'audit-log' => [
        'partitions' => 1,
        'replication_factor' => 3,
        'config' => [
            'retention.ms' => 31536000000, // 365 days
            'cleanup.policy' => 'compact,delete',
            'min.compaction.lag.ms' => 86400000, // 1 day
        ],
    ],
],
```

**Producer with Key for Ordering:**
```php
// Order events for the same tenant always go to the same partition
$this->producer->send('order-events', [
    'key' => 'tenant:' . $event->tenantId,
    'payload' => json_encode($event->toArray()),
    'headers' => ['event_type' => 'order.created', 'version' => '1.0'],
]);
```

**Consumer Group Monitoring:**
```php
// Check consumer lag per partition
$consumerGroups = $kafkaAdmin->listConsumerGroups();
foreach ($consumerGroups as $group) {
    $offsets = $kafkaAdmin->getConsumerGroupOffsets($group['groupId']);
    foreach ($offsets['partitions'] ?? [] as $partition) {
        $lag = $partition['latestOffset'] - $partition['currentOffset'];
        if ($lag > 1000) {
            alert("Consumer group {$group['groupId']} lagging by $lag on partition {$partition['partitionId']}");
        }
    }
}
```

---

# Related Topics

**Prerequisites:**
- K001 Distributed Systems Fundamentals — Brokers, clustering, fault tolerance
- K002 Queue Driver Architecture — Message broker concepts
- K003 Event-Driven Architecture — Events vs messages, pub-sub model

**Closely Related Topics:**
- K038 Consumer Groups and Offset Management — Detailed consumer mechanics
- K040 Kafka Connect and Schema Registry — Integration patterns
- K041 Kafka Streams — Stream processing within Kafka
- K042 Producing and Consuming in Laravel — PHP/Kafka integration

**Advanced Follow-Up Topics:**
- K043 Kafka Exactly-Once Semantics — Idempotent producers, transactions
- K044 Kafka Performance Tuning — Broker configuration, OS tuning, benchmarking
- K045 Kafka Security with mTLS and ACLs — Production security setup
- K046 Event Sourcing with Kafka — Event store architecture

**Cross-Domain Connections:**
- Data Engineering — High-throughput data pipelines
- Microservices Architecture — Event-driven service communication
- Observability — Consumer lag monitoring, broker metrics

---

# AI Agent Notes

- Partition count cannot be decreased. Always start conservative and expand only when measured throughput requires it. The 30% headroom buffer accommodates traffic spikes.
- Kafka's ordering guarantee is **per-partition only**. Global ordering requires a single partition, which caps throughput. Most systems can accept per-key ordering (same entity always ordered).
- Consumer lag is the single most important Kafka health metric. Growing lag always means something is wrong — either the consumer is too slow, or the rebalance frequency is too high.
- Rebalance duration scales roughly linearly with partition count. A 1000-partition rebalance can take 60 seconds. For latency-sensitive systems, use cooperative rebalancing (Kafka 3.1+) and minimize partition count.
- When a consumer crashes, its partitions are reassigned to other consumers during rebalance. Pending messages are not lost — they will be consumed from the committed offset by the new consumer.
- Default `max.poll.records` = 500. If processing takes longer than `max.poll.interval.ms` (default 300000ms / 5 minutes), Kafka considers the consumer dead and triggers rebalance. Tune these together, not independently.
- The Kafka PHP ecosystem (rdkafka extension, mateusjunges/laravel-kafka) is less mature than SQS or Redis in Laravel. Expect to write more infrastructure code. Test consumer reconnection, offset commits, and error handling thoroughly.
- Never commit offsets before processing completes (auto-commit = true default). If the consumer crashes after committing but before processing, messages are lost. Use manual offset commits after processing.
