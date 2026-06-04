# Apache Kafka Topics and Partitions — Decomposition

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** Apache Kafka Topics and Partitions
- **Last Updated:** 2026-06-04

---

## Topic Overview
Apache Kafka topic and partition architecture covering topic design, partition count calculation, consumer group mechanics, ordering guarantees, and Laravel integration considerations.

---

## Decomposition Strategy
The topic splits by (1) Kafka architecture fundamentals — topics, partitions, brokers, replication; (2) partition design — count calculation, key-based partitioning, throughput planning; (3) consumer groups — offset tracking, rebalance mechanics, consumer lag; (4) Laravel integration — PHP Kafka client configuration, queue driver customization, operational monitoring. This avoids overlapping with SQS/Redis Streams by focusing on Kafka's unique log-based storage model, partition immutability, and replay capabilities.

---

## Proposed Folder Structure
```
06-message-distribution-systems/apache-kafka-topics-partitions/
├── 02-knowledge-unit.md
├── 03-decomposition.md
├── 04-standardized-knowledge.md
├── 05-rules.md
├── 06-skills.md
├── 07-decision-trees.md
├── 08-anti-patterns.md
└── 09-checklists.md
```

---

## Knowledge Unit Inventory
| Name | Purpose | Difficulty | Dependencies |
|------|---------|------------|--------------|
| Kafka Topics & Partitions | Distributed event streaming fundamentals | Advanced | Distributed Systems, Event-Driven Architecture |
| Topic Design | Throughput planning, retention, compaction | Advanced | Kafka Topics & Partitions |
| Partition Sizing | Count calculation, key-based distribution | Advanced | Topic Design |
| Consumer Groups | Offset tracking, rebalance, lag monitoring | Advanced | Partition Sizing |
| Laravel Kafka Integration | PHP client, queue driver, configuration | Advanced | Consumer Groups |

---

## Dependency Graph
```
Distributed Systems → Event-Driven Architecture → Kafka Topics & Partitions
                                                  ├── Topic Design → Retention, Compaction
                                                  ├── Partition Sizing → Throughput calculation
                                                  ├── Consumer Groups → Offset, Rebalance
                                                  └── Laravel Integration → PHP client, Queue driver
```

---

## Boundary Analysis
**In scope**: Topic definition and configuration, partition count calculation (peak throughput-based), key-based partitioning for entity ordering, consumer group offset management, rebalance mechanics (eager vs cooperative), consumer lag monitoring, replication factor, retention policies (delete, compact), compression, acks configuration, Laravel Kafka package configuration, partition immutability (cannot decrease).

**Out of scope**: Kafka cluster deployment (ZooKeeper/KRaft), broker configuration tuning, Kafka Connect, Kafka Streams, KSQL, Schema Registry internals, producer/consumer API detailed configuration, exactly-once semantics deep dive, security setup (mTLS, ACLs).

---

## Future Expansion Opportunities
- Kafka exactly-once semantics with idempotent producers
- Kafka Connect for data pipeline integration
- Schema Registry for Avro/Protobuf evolution
- Kafka Streams for stateful stream processing
- Kafka as event store for CQRS/event sourcing
