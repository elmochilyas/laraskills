# Skill: Configure Kafka Topics, Partitions, and Consumer Groups

## Purpose
Design and operate Kafka topics with appropriate partition counts, configure consumer groups for parallel processing, and implement offset management for at-least-once delivery semantics.

## When To Use
Message replay capability required; long-term message retention (days/months); high throughput (>100K msgs/sec); event sourcing or audit log patterns; ordered processing per entity via key-based partitioning.

## When NOT To Use
Simple job queues (RabbitMQ or Redis is simpler); low-latency needs (Kafka durability adds latency); complex routing patterns (Kafka only does key-based routing); small deployments with low throughput.

## Prerequisites
- Kafka cluster (self-managed, Confluent, or MSK)
- `mateusjunges/laravel-kafka` or equivalent package
- Network access from application servers to Kafka brokers

## Inputs
- Topic name
- Partition count
- Replication factor
- Consumer group name

## Workflow
1. Create topic with partition count = max consumers × 2
2. Set replication factor ≥ 2 for production (3 recommended)
3. Configure retention policy (time-based: `retention.ms`, size-based: `retention.bytes`)
4. Producer sends messages with key-based partitioning (entity ID)
5. Consumer group subscribes — each consumer assigned a subset of partitions
6. Process message, commit offset after side effects complete
7. Monitor consumer lag via tools like Burrow, Kafka Lag Exporter, or JMX

## Validation Checklist
- [ ] Partition count allows max-expected consumer parallelism
- [ ] Replication factor ≥ 2 (3 for production)
- [ ] Retention policy aligned with replay requirements
- [ ] Message keys used for entity-level ordering
- [ ] Offsets committed after processing (not before)
- [ ] Consumer group configured correctly (all consumers use same group ID)
- [ ] Consumer lag monitored (alert on persistent growth)
- [ ] `auto.offset.reset` set intentionally

## Common Failures
- Assuming global ordering — Kafka only orders per partition
- Committing offset before processing — message loss on crash
- Too few partitions — consumers idle with no parallelism
- Too many partitions for broker count — filesystem overhead
- No consumer lag monitoring — silent accumulation of backlog

## Decision Points
- Partition count: scale factor × expected consumer count
- Retention: balance storage cost vs replay window
- Key vs no key: key for ordering, round-robin for throughput

## Related Rules
- Rule 1: set-partition-count-for-max-parallelism
- Rule 2: use-meaningful-message-keys
- Rule 3: commit-offsets-after-processing
- Rule 4: monitor-consumer-lag
- Rule 5: set-auto-offset-reset-intentionally

## Related Skills
- Use Redis Streams as Queue Backend
- Configure RabbitMQ Exchange Types
- Implement Idempotency for Side-Effect Jobs

## Success Criteria
Topic is partitioned for target parallelism, consumer group processes messages with at-least-once semantics, consumer lag is monitored and within acceptable bounds, and messages are ordered per partition.
