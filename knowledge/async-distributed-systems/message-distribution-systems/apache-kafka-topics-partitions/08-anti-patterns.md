# ECC Anti-Patterns — Apache Kafka Topics and Partitions

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | async-distributed-systems |
| **Subdomain** | 06-message-distribution-systems |
| **Knowledge Unit** | Apache Kafka Topics and Partitions |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Too Few Partitions — Throughput Capped Below Demand
2. Too Many Partitions — Unnecessary Overhead and Rebalance Latency
3. Consumer Group Larger Than Partition Count — Idle Consumers
4. No Partition Key — Out-of-Order Processing
5. Infinite Retention — Unbounded Disk Growth
6. Ignoring Consumer Lag Monitoring

---

## Repository-Wide Anti-Patterns

- Default Partition Count Without Throughput Analysis
- Same Partition Count for All Topics

---

## Anti-Pattern 1: Too Few Partitions — Throughput Capped Below Demand

### Category
Performance | Scalability

### Description
Configuring too few partitions for a topic, capping maximum throughput below actual or projected demand.

### Why It Happens
Default partition counts (1 or 3) are used without throughput analysis. Teams don't project future growth.

### Warning Signs
- Consumer group shows high lag while consumers are idle
- Topic throughput plateau matches partition count × single-partition throughput
- Adding consumers doesn't increase throughput
- Monitoring shows most consumers idle during peak load

### Why It Is Harmful
Throughput is capped at partition count × partition throughput. Adding consumers doesn't help. Scaling requires partition count increase, which is a disruptive operation.

### Real-World Consequences
A topic with 3 partitions handles ~30 MB/s. Actual traffic peaks at 50 MB/s. Consumers idle at 30% utilization — they can't help because only 3 partitions exist. Processing backlog grows during every peak period.

### Preferred Alternative
Calculate partition count based on peak throughput: `peak_throughput / single_partition_throughput`. Add 20-30% headroom for growth.

### Refactoring Strategy
1. Measure current and peak throughput per topic
2. Calculate required partitions: `ceil(peak_throughput / partition_capacity)`
3. Increase partition count on the topic (Kafka supports partition increase)
4. Update consumer group configuration to match new partition count
5. Monitor lag to verify throughput improvement

### Detection Checklist
- [ ] Topic throughput regularly hits partition-based ceiling
- [ ] Consumer lag grows during peak while consumers have capacity
- [ ] Adding consumers doesn't reduce lag
- [ ] Partition count matches default (1 or 3) without documented analysis

### Related Rules
Align partition count to expected throughput (05-rules.md)

### Related Skills
Configure and Optimize Kafka Topics and Partitions (06-skills.md)

### Related Decision Trees
Message Distribution Platform Selection (07-decision-trees.md)

---

## Anti-Pattern 2: Too Many Partitions — Unnecessary Overhead and Rebalance Latency

### Category
Performance | Operational Cost

### Description
Configuring far more partitions than needed, adding metadata overhead, file handle consumption, and rebalance latency.

### Why It Happens
Over-provisioning "for future growth" without understanding Kafka's per-partition overhead. Following advice intended for very large clusters.

### Warning Signs
- Leader rebalance takes minutes instead of seconds
- ZooKeeper/KRaft metadata operations slow down
- Each broker has thousands of partition replicas
- File descriptor usage on brokers is high
- Topic throughput is low relative to partition count

### Why It Is Harmful
Each partition adds metadata overhead, file handles, and replication traffic. Consumer group rebalances take longer with more partitions. Unnecessary resource consumption on brokers.

### Real-World Consequences
A topic with 500 partitions processes 5 MB/s — each partition averages 10 KB/s. Consumer rebalance takes 45 seconds due to 500 partition assignments. A broker failure triggers a rebalance that takes minutes, during which no data is processed.

### Preferred Alternative
Right-size partitions to match throughput needs. Aim for 5-50 MB/s per partition as a target. Expand partitions only when measured throughput requires it.

### Refactoring Strategy
1. Measure actual per-partition throughput
2. Consolidate topics if multiple topics have low per-partition throughput
3. For new topics, start with calculated partition count + 30% headroom
4. Add monitoring alerts for very low per-partition throughput
5. Document the throughput-based rationale for partition count

### Detection Checklist
- [ ] Hundreds of partitions handling very low throughput each
- [ ] Consumer rebalance times measurable in minutes
- [ ] Broker file descriptor usage high for data volume
- [ ] Partition count chosen without throughput analysis

### Related Rules
Align partition count to expected throughput (05-rules.md)

### Related Skills
Configure and Optimize Kafka Topics and Partitions (06-skills.md)

### Related Decision Trees
Message Distribution Platform Selection (07-decision-trees.md)

---

## Anti-Pattern 3: Consumer Group Larger Than Partition Count — Idle Consumers

### Category
Performance | Resource Waste

### Description
Running more consumers in a group than partitions in the topic, leaving some consumers permanently idle.

### Why It Happens
Teams scale consumers based on load without understanding Kafka's partition-consumer relationship. Assumption that more consumers = more throughput.

### Warning Signs
- Some consumers in the group show zero data processed
- Consumer group has more members than topic partitions
- Adding more consumers doesn't increase throughput
- Consumer metrics show idle members

### Why It Is Harmful
Wasted compute resources. Idle consumers consume memory and connections. False sense of scalability — team thinks they have capacity when they don't.

### Real-World Consequences
20 partitions, 60 consumers — 40 consumers consume zero data. Kubernetes pods consume memory and CPU for absolutely no throughput gain. Monthly compute cost is 3× the needed amount.

### Preferred Alternative
Keep consumer count ≤ partition count per group. Scale partitions before scaling consumers.

### Refactoring Strategy
1. Identify consumer groups with more members than partitions
2. Reduce consumer count to match partition count
3. If more throughput is needed, first increase partition count
4. Add monitoring to alert when consumer count exceeds partition count
5. Update deployment config to scale consumers based on partition count

### Detection Checklist
- [ ] Consumer group has more consumers than topic partitions
- [ ] Some consumers show zero messages processed
- [ ] Consumer count increased without partition count increase
- [ ] Compute costs higher than needed for actual throughput

### Related Rules
Keep consumer count ≤ partition count per group (05-rules.md)

### Related Skills
Configure and Optimize Kafka Topics and Partitions (06-skills.md)

### Related Decision Trees
Message Distribution Platform Selection (07-decision-trees.md)

---

## Anti-Pattern 4: No Partition Key — Out-of-Order Processing

### Category
Data Integrity | Reliability

### Description
Producing messages without a partition key, causing distribution across partitions and loss of ordering guarantees.

### Why It Happens
Teams don't understand that Kafka only guarantees order within a partition. No key = round-robin = no ordering.

### Warning Signs
- Messages produced without a key parameter
- Related events processed out of order (e.g., `deleted` before `created`)
- Consumer logic must reorder events in memory
- Tests show intermittent ordering failures under load

### Why It Is Harmful
Events that must be ordered (state transitions, financial operations) are processed incorrectly. The consumer sees future events before past ones.

### Real-World Consequences
Order `created`, `updated`, and `cancelled` events go to different partitions because no key is set — consumer processes them out of order. The `cancelled` event arrives before `created`, causing a "not found" error. The order is never fulfilled.

### Preferred Alternative
Always provide a partition key for messages that need ordering. Use entity ID, tenant ID, or correlation ID as the key.

### Refactoring Strategy
1. Identify all producer calls that omit the partition key
2. Determine the correct key per message type (entity ID for state transitions)
3. Add key to all producer calls
4. Verify that messages with the same key arrive at the same partition
5. Test ordering under load with key

### Detection Checklist
- [ ] Messages produced without a partition key
- [ ] Related events processed out of order
- [ ] Consumer contains complex reordering logic
- [ ] No key parameter in producer API calls

### Related Rules
Choose partition key for ordering guarantees (05-rules.md)

### Related Skills
Configure and Optimize Kafka Topics and Partitions (06-skills.md)

### Related Decision Trees
Message Distribution Platform Selection (07-decision-trees.md)

---

## Anti-Pattern 5: Infinite Retention — Unbounded Disk Growth

### Category
Operational Cost | Reliability

### Description
Setting infinite retention (`retention.ms = -1`) on high-throughput topics, causing unbounded disk growth that eventually crashes brokers.

### Why It Happens
Teams want to keep all data "just in case." They don't set retention limits during initial setup.

### Warning Signs
- `retention.ms` set to `-1` on active topics
- Broker disk usage grows monotonically
- Consumer lag is large because old data never expires
- Log compaction disabled on topics with infinite retention

### Why It Is Harmful
Disk fills up and partitions go offline. All producers fail. Data loss when disk is full. Recovery requires deleting data or adding disk under pressure.

### Real-World Consequences
A consumer is down for 2 weeks — messages accumulate beyond disk capacity. Kafka's `log.retention.bytes` hits the broker limit, partitions go offline, and ALL producers get `NotLeaderForPartitionException`. Entire system goes down.

### Preferred Alternative
Set retention-based on data value and compliance requirements: 7 days for operational data, 30-90 days for analytics, 1 year max for audit data. Use log compaction for keyed data that needs the latest value retained.

### Refactoring Strategy
1. Determine data retention requirements per topic
2. Set `retention.ms` to the required duration
3. Enable log compaction for keyed data that needs latest-value retention
4. Add monitoring for broker disk usage with alerting at 70% and 85%
5. Document retention policy per topic

### Detection Checklist
- [ ] `retention.ms = -1` on any topic with ongoing production
- [ ] Broker disk usage trending upward without plateau
- [ ] No documented retention policy per topic
- [ ] Consumer lag measured in weeks

### Related Rules
Set message retention to finite values (05-rules.md)

### Related Skills
Configure and Optimize Kafka Topics and Partitions (06-skills.md)

### Related Decision Trees
Message Distribution Platform Selection (07-decision-trees.md)
