# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** Apache Kafka Topics Partitions
**Generated:** 2026-06-04
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md
**Note:** Complete — all phase files present (04, 05, 06, 07, 08, 09)

---

# Quick Checklist

- [ ] Always align partition count to your expected throughput and consumer count. followed
- [ ] Always keep consumer count â‰¤ partition count per group. followed
- [ ] Always choose a partition key that guarantees ordering for messages that need it. followed
- [ ] Never set retention.ms to -1 (infinite) on topics with high throughput. followed
- [ ] Too Few Partitions â€” Throughput Capped Below Demand prevented
- [ ] Too Many Partitions â€” Unnecessary Overhead and Rebalance Latency prevented

---

# Architecture Checklist

- [ ] Partition count calculated from peak throughput analysis (ceil(peak / 10 MB/s) × 1.3)
- [ ] Replication factor = 3 for all production topics
- [ ] Separate topics for different data schemas and retention policies
- [ ] Consumer groups provide workload isolation per consuming service
- [ ] Kafka placed between bounded contexts in microservice architecture
- [ ] Schema registry used for production topics (Avro, Protobuf, JSON Schema)
- [ ] Partition count does not exceed cluster's recommended per-broker limit
- [ ] Topic naming convention established (service-data-type-env)

---

# Implementation Checklist

- [ ] Partition count aligned to expected throughput and consumer count
- [ ] Consumer count ≤ partition count per consumer group
- [ ] Partition key provided for all messages requiring per-entity ordering
- [ ] retention.ms set to finite value on all topics (no infinite retention)
- [ ] replication_factor = 3 configured on all production topics
- [ ] cleanup.policy configured appropriately (delete, compact, or delete,compact)
- [ ] compression.type set on producer (snappy, lz4, gzip, or zstd)
- [ ] acks=all and idempotence=true configured on producers
- [ ] enable.auto.commit=false — manual offset commits implemented
- [ ] max.poll.records and max.poll.interval.ms tuned together

---

# Performance Checklist

- [ ] Partition count right-sized (not too few, not too many)
- [ ] Batch size configured for producer throughput
- [ ] Compression enabled (snappy or lz4 for speed, gzip for space)
- [ ] acks=all for safety, acks=1 for latency-sensitive with acceptable risk
- [ ] Rebalance duration measured and within acceptable limits
- [ ] Consumer lag monitored per partition with alerting
- [ ] Disk I/O (sequential write throughput) benchmarked on brokers
- [ ] Producer and consumer throughput benchmarked end-to-end

---

# Security Checklist

- [ ] TLS encryption enabled for all broker-client communication
- [ ] SASL or mTLS authentication configured for production
- [ ] ACLs applied with least privilege (producers: WRITE only; consumers: READ only)
- [ ] Sensitive data encrypted at application level before producing
- [ ] delete.topic.enable=false in production to prevent accidental deletion
- [ ] Client quotas configured to prevent noisy neighbor issues
- [ ] Audit logging enabled for topic creation, ACL changes, config modifications

---

# Reliability Checklist

- [ ] Too Few Partitions — Throughput Capped Below Demand prevented
- [ ] Too Many Partitions — Unnecessary Overhead and Rebalance Latency prevented
- [ ] Consumer Group Larger Than Partition Count — Idle Consumers prevented
- [ ] No Partition Key — Out-of-Order Processing prevented
- [ ] Infinite Retention — Unbounded Disk Growth prevented
- [ ] Ignoring Consumer Lag Monitoring — alerts configured on lag growth
- [ ] Manual offset commits implemented (auto-commit disabled)
- [ ] Rebalance behavior tested during deployment (consumer failures, rollouts)
- [ ] Consumer group rebalance tolerance verified (cooperative rebalancing preferred)

---

# Testing Checklist

- [ ] Partition count validated against throughput under peak load
- [ ] Ordering verified: same-key messages land on same partition
- [ ] Consumer scaling tested: adding consumers up to partition count improves throughput
- [ ] Consumer rebalance tested: simulate consumer crash, verify partition reassignment
- [ ] Retention policy tested: verify old messages expire per retention.ms
- [ ] Compression verified: payload size reduction measured
- [ ] Producer idempotence tested: duplicate produces do not create duplicates

---

# Maintainability Checklist

- [ ] Partition count rationale documented per topic
- [ ] Retention policy documented per topic with justification
- [ ] Consumer group mapping documented (which service consumes which topic)
- [ ] IaC (Terraform, Helm, or Kafka CLI scripts) used for topic management
- [ ] Schema evolution strategy documented (compatible changes, breaking changes)
- [ ] Consumer lag baseline documented for normal operation
- [ ] Runbook includes rebalance troubleshooting, consumer recovery procedures

---

# Anti-Pattern Prevention Checklist

- [ ] Too Few Partitions — Throughput Capped Below Demand — calculate from peak throughput
- [ ] Too Many Partitions — Unnecessary Overhead and Rebalance Latency — right-size
- [ ] Consumer Group Larger Than Partition Count — scale partitions, not consumers
- [ ] No Partition Key — Out-of-Order Processing — always provide key for ordered messages
- [ ] Infinite Retention — Unbounded Disk Growth — set finite retention.ms
- [ ] Ignoring Consumer Lag Monitoring — set up lag alerts per consumer group
- [ ] Default Partition Count Without Throughput Analysis — calculate per topic
- [ ] Same Partition Count for All Topics — analyze per-topic throughput individually

---

# Production Readiness Checklist

- [ ] All topics have throughput-calibrated partition counts
- [ ] Replication factor = 3 across all production topics
- [ ] Finite retention configured on all topics
- [ ] Consumer lag monitoring in place with automated alerting
- [ ] Compression enabled on high-throughput topics
- [ ] Schema registry or serialization contract enforced
- [ ] TLS and authentication configured for all client connections
- [ ] ACLs applied with least privilege
- [ ] Rebalance behavior tested and documented
- [ ] Runbook includes partition expansion, consumer recovery, rebalance troubleshooting

---

# Final Approval Checklist

- [ ] All critical checklist items pass
- [ ] No known edge cases unhandled
- [ ] Partition count calculated from throughput analysis
- [ ] Consumer count ≤ partition count verified
- [ ] Ordering requirements met (key strategy documented)
- [ ] Retention set to finite value
- [ ] Consumer lag monitoring operational
- [ ] Code reviewed by domain expert

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

- K038 Apache Kafka Topics and Partitions (04-standardized-knowledge.md)
- Apache Kafka Topics and Partitions Rules (05-rules.md)
- Configure and Optimize Kafka Topics and Partitions (06-skills.md)
- Kafka Topics and Partitions Decision Trees (07-decision-trees.md)
- Apache Kafka Topics and Partitions Anti-Patterns (08-anti-patterns.md)

---


