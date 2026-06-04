# Skill: Configure and Optimize Kafka Topics and Partitions

## Purpose
Design, configure, and manage Apache Kafka topics and partitions for high-throughput event streaming in Laravel applications. Calculate optimal partition counts, configure retention policies, set up consumer groups, and maintain ordering guarantees.

## When To Use
Building event-driven microservices with Kafka; setting up topics for new event types; tuning an existing Kafka deployment for throughput or latency; migrating from SQS/Redis to Kafka for high-throughput event streaming.

## When NOT To Use
Simple job queue workloads (use SQS or Redis); sub-millisecond latency required; low throughput (< 1 MB/s); small team without Kafka operations experience.

## Prerequisites
- Apache Kafka cluster (3 brokers minimum for production)
- PHP rdkafka extension installed
- Laravel Kafka package configured (mateusjunges/laravel-kafka or custom)
- Kafka topic admin tools (kafka-topics CLI, Kafka UI, or admin API access)
- Understanding of throughput requirements per topic

## Inputs
- Topic name and data schema
- Expected peak throughput (MB/s)
- Retention period (days)
- Replication factor (default: 3 for production)
- Consumer group parallelism target
- Ordering requirements (key vs no key)
- Compression preference
- Cleanup policy (delete, compact, or both)

## Workflow
1. **Calculate partition count:**
   - Measure or estimate peak throughput per topic
   - Single partition capacity: ~10 MB/s (baseline benchmark)
   - `partitions = ceil(peak_throughput / 10) × 1.3` (30% headroom)
   - Never exceed cluster's recommended partition limit (per-broker max)

2. **Configure topic settings:**
   - Set `replication_factor = 3` for production
   - Set `retention.ms` based on data value (7d for ops, 90d for analytics, 365d for audit)
   - Set `cleanup.policy` (delete, compact, or delete+compact)
   - Configure `compression.type` based on payload characteristics
   - Configure `max.message.bytes` if payload exceeds defaults

3. **Create topic:**
   - Use kafka-topics CLI, Terraform provider, or admin API
   - Verify topic creation with `kafka-topics --describe`
   - Test produce and consume with sample messages

4. **Configure producers:**
   - Set `acks=all` for production (safest)
   - Enable `compression.type` on producer (snappy or lz4 for speed, gzip for space)
   - Provide `key` for messages requiring ordering
   - Enable `idempotence=true` to prevent duplicate produces (Kafka 0.11+)

5. **Configure consumers:**
   - Set `group.id` per logical consumer group
   - Set `enable.auto.commit=false` — commit offsets manually after processing
   - Set `auto.offset.reset=earliest` for new consumers to catch up from beginning
   - Tune `max.poll.records` and `max.poll.interval.ms` together

6. **Set up monitoring:**
   - Monitor consumer lag per partition (kafka-consumer-groups CLI or Burrow)
   - Monitor broker disk usage and partition leadership balance
   - Set up alerts for lag growth, rebalance frequency, and broker health

7. **Test ordering and parallelism:**
   - Produce messages with same key — verify same partition
   - Scale consumers up to partition count — verify even distribution
   - Test rebalance behavior during consumer rollout

## Validation Checklist
- [ ] Partition count calculated from throughput analysis (not default)
- [ ] Replication factor = 3 for all production topics
- [ ] Retention set to finite value (not infinite)
- [ ] Messages with ordering requirements always include a key
- [ ] Consumer count ≤ partition count per consumer group
- [ ] Manual offset commits implemented (auto-commit disabled)
- [ ] Compression enabled for high-throughput topics
- [ ] `acks=all` and `idempotence=true` on producers
- [ ] Consumer lag monitoring configured with alerts
- [ ] Rebalance behavior tested during deployment
- [ ] Schema registry or serialization contract in place
- [ ] No topics with identical partition counts across different throughput profiles

## Common Failures
- **Throughput capped:** Too few partitions — increase partition count (adds parallelism)
- **Out-of-order processing:** No partition key on related messages — add key to producer
- **Consumer idle:** Consumers > partitions — reduce consumer count or increase partition count
- **Rebalance takes minutes:** Too many partitions — consolidate topics or increase broker count
- **Disk full:** Infinite retention — set `retention.ms` to finite value immediately
- **Message loss:** Auto-commit enabled — switch to manual offset commits after processing
- **Consumer crashes exhausted:** `max.poll.interval.ms` too low for processing time — tune together with `max.poll.records`
- **Data inconsistency:** Different consumers process same partition with different handling — ensure consumer group consistency

## Decision Points
- Partition count: peak throughput + 30% headroom
- Replication factor: 3 for production, 2 for dev, 1 for disposable data
- Retention period: operational data (7d), analytics (30-90d), audit (365d)
- Cleanup policy: delete for retention-window, compact for keyed state, both for hybrid
- Key strategy: entity ID for ordering, null for load distribution
- Compression: snappy or lz4 for speed, gzip for maximum compression, zstd for mixed (Kafka 2.1+)

## Related Rules
- align-partition-count-to-throughput (05-rules.md)
- size-consumer-groups-by-partitions (05-rules.md)
- choose-key-for-ordering (05-rules.md)
- set-message-retention-no-infinite (05-rules.md)

## Related Skills
- Configure Consumer Groups and Offset Management
- Set Up Kafka Monitoring with Burrow or Confluent Control Center
- Implement Kafka Producer Best Practices
- Design Event Schema with Schema Registry

## Related Decision Trees
- Message Distribution Platform Selection (07-decision-trees.md)
- Partition Count Calculation (07-decision-trees.md)

## Success Criteria
Topics are configured with throughput-appropriate partition counts, finite retention, replication factor of 3, and compression enabled. Producers use keys for ordering-sensitive messages and manual offset commits. Consumer groups are sized correctly with ≤ partition count. Consumer lag is monitored with automated alerts. Rebalance behavior is predictable and tested.
