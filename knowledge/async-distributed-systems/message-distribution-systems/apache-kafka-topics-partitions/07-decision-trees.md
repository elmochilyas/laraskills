# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** Apache Kafka Topics and Partitions
**Generated:** 2026-06-04

---

# Decision Inventory

* Partition Count Calculation
* Consumer Group Size Planning
* Retention Policy Selection
* Cleanup Policy Selection
* Key Strategy — Ordered vs Unordered Messages
* Replication Factor Selection
* Compression Strategy Selection

---

# Architecture-Level Decision Trees

---

## Partition Count Calculation

### Decision Context

Determining the optimal number of partitions for a Kafka topic to balance throughput requirements against operational overhead.

### Decision Criteria

- Peak throughput (MB/s)
- Single-partition throughput baseline (benchmark ~10 MB/s)
- Consumer parallelism target
- Headroom for traffic growth
- Rebalance latency tolerance
- Cluster partition capacity

### Decision Tree

```
Peak throughput measurable or estimated?
├── YES → Single-partition throughput known (benchmark)?
│   ├── YES → partitions = ceil(peak_throughput / single_partition_throughput) × 1.3
│   └── NO → partitions = ceil(peak_throughput_mbs / 10) × 1.3
│       └── Validate with benchmark on target hardware
├── NO → Throughput bursty and unpredictable?
│   ├── YES → Start with 3-6 partitions, monitor, add more if lag grows
│   └── NO → Start conservatively: 3 partitions, expand as needed
│
└── After calculating: Rebalance tolerance considered?
    ├── Partitions > 200 per topic on slow rebalance?
    │   └── Consider multiple topics + routing layer
    ├── Partitions > 1000 per cluster?
    │   └── Add brokers to distribute partition load
    └── Partitions < calculated?
        └── Increase to match calculation, add before throughput becomes a problem
```

### Rationale

Partition count is the single most impactful configuration decision for Kafka throughput. Too few partitions cap parallelism (consumers idle); too many add metadata overhead, file handle consumption, and rebalance latency. The 30% headroom factor accommodates traffic spikes without immediate reconfiguration. Partition count can only be increased, not decreased, so start conservatively.

### Recommended Default

**Default:** 3-6 partitions for unknown-throughput topics; calculate precisely for known-throughput topics
**Reason:** 3 partitions provide baseline parallelism. 6 handles most small-to-medium workloads. Rebalance latency remains under 5 seconds at this scale.

### Risks Of Wrong Choice

- Too few: throughput capped, consumers idle, scaling requires disruptive partition increase
- Too many: rebalance times increase, broker file descriptors exhausted, cluster metadata overhead

### Related Rules

- align-partition-count-to-throughput (05-rules.md)

### Related Skills

- Configure and Optimize Kafka Topics and Partitions (06-skills.md)

---

## Consumer Group Size Planning

### Decision Context

Determining the number of consumers to run in a consumer group for optimal throughput without idle resources.

### Decision Criteria

- Topic partition count
- Required processing throughput
- Per-consumer processing capacity
- Failover and redundancy needs

### Decision Tree

```
Desired throughput (msg/s) known?
├── YES → Single consumer throughput (msg/s) known?
│   ├── YES → Min consumers = ceil(desired / single_consumer_throughput)
│   │   └── Max consumers = partition_count (cannot exceed)
│   │   └── Deploy: target_consumers = min(desired_consumers, partition_count)
│   └── NO → Start with target_consumers = partition_count / 2
│       └── Measure, scale up to partition_count if lag grows
└── NO → Use partition_count as deployment target
    ├── Redundancy required (standby)?
    │   └── Deploy partition_count + 1 (one idle standby for failover)
    └── No standby: deploy partition_count for maximum parallelism
```

### Rationale

Kafka assigns at most one partition per consumer in a group. Any consumers beyond the partition count sit idle. Deploying fewer consumers than partitions leaves processing capacity on the table. The optimal count is typically partition_count for maximum throughput, or partition_count - 1 if one standby is needed for failover tolerance.

### Recommended Default

**Default:** Number of consumers = partition count (maximum parallelism)
**Reason:** Full utilization of all partitions. A single consumer failure triggers rebalance and surviving consumers pick up the slack.

### Risks Of Wrong Choice

- Too many ( > partitions): idle consumers waste resources, false sense of capacity
- Too few ( < partitions / 2): partitions are underutilized, consumer lag grows unnecessarily

### Related Rules

- size-consumer-groups-by-partitions (05-rules.md)

### Related Skills

- Configure and Optimize Kafka Topics and Partitions (06-skills.md)

---

## Retention Policy Selection

### Decision Context

Setting the message retention period for a Kafka topic based on data value, compliance, and operational constraints.

### Decision Criteria

- Data value over time
- Compliance/regulatory requirements
- Consumer replay requirements
- Storage cost tolerance
- Recovery time objectives (RTO)

### Decision Tree

```
Compliance requires specific retention period?
├── YES → Set retention.ms to compliance requirement + 10% buffer
│   └── Document the compliance basis in topic configuration
└── NO → Data has ongoing value after consumption?
    ├── YES → Data needed for replay/recovery?
    │   ├── YES → Set retention = max(expected recovery window, RTO)
    │   │   └── Retention range: 7 days (ops) to 365 days (audit)
    │   └── NO → Data used for analytics/reprocessing?
    │       ├── YES → Set retention = 30-90 days based on analysis cycle
    │       └── NO → Set retention = 7 days (standard operational window)
    └── NO → Messages consumed and discarded immediately?
        ├── YES → Set retention = 24-48 hours (safety margin only)
        └── NO → Default to 7 days
```

### Rationale

Retention directly impacts storage costs and recovery capabilities. Long retention increases disk usage and consumer recovery window. Short retention risks data loss if consumers fall behind. Match retention to actual data value — most operational data loses value after days, not months.

### Recommended Default

**Default:** 7 days for operational data, 90 days for analytics, 365 days for audit/compliance
**Reason:** 7 days covers most consumer outage recovery scenarios. Longer retention should have documented justification.

### Risks Of Wrong Choice

- Too short: messages expire before consumers process them, data loss
- Too long (infinite): disk fills up, cluster crashes, all topics affected
- Inconsistent across topics: confusion about recovery capabilities during incidents

### Related Rules

- set-message-retention-no-infinite (05-rules.md)

### Related Skills

- Configure and Optimize Kafka Topics and Partitions (06-skills.md)

---

## Cleanup Policy Selection

### Decision Context

Choosing between delete, compact, or hybrid cleanup policy for a Kafka topic.

### Decision Criteria

- Whether data is keyed or unkeyed
- Whether old values per key have ongoing value
- Whether consumers need only latest state per key
- Whether full replay is ever needed

### Decision Tree

```
Messages have meaningful keys?
├── YES → Only the latest value per key matters?
│   ├── YES → Use compact policy — keeps latest per key, discards old versions
│   │   └── Example: customer address, inventory count, feature flags
│   └── NO → Both latest value AND full history needed?
│       ├── YES → Use delete,compact (hybrid) — compaction + time-based retention
│       │   └── Example: order history (latest status for state, full log for replay)
│       └── NO → Full message history needed for replay?
│           ├── YES → Use compact — compaction removes old values per key
│           │   └── But min.compaction.lag.ms preserves recent history
│           └── NO → Use delete policy — simplest, time-based only
└── NO → Messages unkeyed or keys don't carry state?
    ├── YES → Use delete policy — no benefit from compaction
    └── NO → Default to delete
```

### Rationale

Compact policy is ideal for keyed data where only the latest state matters — it provides infinite retention without infinite disk usage by discarding old values per key. Hybrid `delete,compact` gives both compaction for keyed data AND time-based deletion bound. Pure delete is simplest for unkeyed streams.

### Recommended Default

**Default:** `delete` for general-purpose topics; `compact` for keyed state snapshots; `delete,compact` for event sourcing with state recovery
**Reason:** Delete is simplest and cheapest. Compact adds CPU overhead for compaction process. Hybrid adds both time bounds and compaction.

### Risks Of Wrong Choice

- Compact on unkeyed topics: compaction has no effect, all messages retained indefinitely (space waste)
- Delete on keyed state topics: old values per key lost, cannot rebuild state from scratch
- Compact without `min.compaction.lag.ms`: frequently updated keys may never be compacted

### Related Rules

- set-message-retention-no-infinite (05-rules.md)

### Related Skills

- Configure and Optimize Kafka Topics and Partitions (06-skills.md)

---

## Key Strategy — Ordered vs Unordered Messages

### Decision Context

Deciding whether to provide a partition key when producing messages to Kafka.

### Decision Criteria

- Per-entity ordering requirement
- Throughput sensitivity (keyed messages may cause hot partitions)
- Consumer idempotency capabilities
- Stateful vs stateless processing

### Decision Tree

```
Messages for the same entity (order, customer, tenant) must be processed in order?
├── YES → Use entity ID as partition key
│   ├── key = order_id, customer_id, tenant_id
│   └── Guarantees: same entity → same partition → ordered processing
├── NO → Consumer is idempotent and order-independent?
│   ├── YES → Omit key (null key) — round-robin distribution
│   │   └── Best throughput: load balanced across all partitions
│   └── NO → Messages are loosely related (e.g., search indexing)?
│       ├── YES → Omit key — load distribution matters more than order
│       └── NO → Provide key only when ordering is strictly required
│
└── After decision: Hot partition risk with keyed approach?
    ├── Single entity produces > 10 MB/s (exceeds single partition capacity)?
    │   └── Use sub-keys: entity_id + shard suffix (e.g., order_123_shard_0-9)
    └── Entity volume within partition capacity?
        └── Use simple entity key — no sub-key needed
```

### Rationale

Kafka guarantees order only within a partition. Providing a key routes all messages with that key to the same partition, enabling ordered processing per entity. Without a key, messages are distributed round-robin, maximizing throughput but losing ordering guarantees. Hot partitions occur when a single key's throughput exceeds a single partition's capacity.

### Recommended Default

**Default:** Use entity ID as key for domain events (order, payment, inventory); omit key for analytical streams (clickstream, logs, metrics)
**Reason:** Domain events typically require per-entity ordering. Analytical streams are order-independent and benefit from uniform load distribution.

### Risks Of Wrong Choice

- No key for ordered messages: state corruption from out-of-order processing
- Key for unordered messages: potential hot partitions, reduced throughput
- Same key for all messages: single partition bottleneck, all throughput limited

### Related Rules

- choose-key-for-ordering (05-rules.md)

### Related Skills

- Configure and Optimize Kafka Topics and Partitions (06-skills.md)

---

## Replication Factor Selection

### Decision Context

Determining the replication factor for topic partitions to balance durability against cost and performance.

### Decision Criteria

- Data durability requirements
- Broker count in cluster
- Cost tolerance (more replicas = more storage)
- Broker failure tolerance needed

### Decision Tree

```
Data durability is critical (production)?
├── YES → Cluster has ≥ 3 brokers?
│   ├── YES → Replication factor = 3 (tolerates 1 broker failure)
│   └── NO → Cluster has 2 brokers?
│       ├── YES → Replication factor = 2 (tolerates 0 failures safely)
│       │   └── Risk: losing one broker may cause ISR to drop below min.insync.replicas
│       └── NO → Single broker?
│           ├── YES → Replication factor = 1 (no fault tolerance)
│           └── NO → Add more brokers for production durability
├── NO → Development or test environment?
│   ├── YES → Replication factor = 1 (minimal storage usage)
│   └── NO → Default to 3
```

### Rationale

Replication factor 3 provides fault tolerance for one broker failure without data loss. The `min.insync.replicas` setting (typically 2) ensures that at least two replicas acknowledge writes. Factor 2 is dangerous because losing one broker may leave only one in-sync replica, and another failure causes data loss. Factor 1 offers no fault tolerance.

### Recommended Default

**Default:** Replication factor = 3 for all production topics
**Reason:** Tolerates one broker failure, the minimum acceptable for production systems.

### Risks Of Wrong Choice

- Factor 1: any broker failure causes data loss on that partition
- Factor 2: losing one broker may drop ISR below 2, making producers fail
- Factor 3 on 3-broker cluster: perfectly fine, standard configuration
- Factor 4+: unnecessary storage cost without meaningful durability improvement

### Related Rules

- choose-key-for-ordering (05-rules.md)

### Related Skills

- Configure and Optimize Kafka Topics and Partitions (06-skills.md)
