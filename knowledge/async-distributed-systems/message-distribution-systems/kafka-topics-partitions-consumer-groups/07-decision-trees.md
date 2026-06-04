# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** kafka-topics-partitions-consumer-groups
**Generated:** 2026-06-03

---

# Decision Inventory

* Kafka Partition Count Strategy
* Kafka vs Redis/SQS for Queue Use Case

---

# Architecture-Level Decision Trees

---

## Kafka Partition Count Strategy

---

### Decision Context

Choosing the number of partitions for a Kafka topic.

---

### Decision Criteria

* Throughput requirements per partition
* Consumer parallelism
* Ordering requirements per key
* Rebalancing overhead

---

### Decision Tree

Need strict ordering per message key?
YES → One partition per ordering group — more partitions = more parallel ordering groups
NO → Throughput requirement known?
    YES → Partition count = max(throughput / per-partition throughput, consumer count)
NO → Unknown throughput?
    YES → Start with 3-6 partitions — easy to increase, hard to decrease

---

### Rationale

Partitions are the unit of parallelism in Kafka. More partitions = more consumer parallelism but more rebalancing overhead. Partition count can be increased but not decreased without recreating the topic.

---

### Recommended Default

**Default:** Start with 3 partitions for standard workloads; scale based on throughput monitoring
**Reason:** 3 partitions provide adequate parallelism for most applications. Scaling up is easy; scaling down is not.

---

### Risks Of Wrong Choice

- Too few partitions: limited consumer parallelism, throughput bottleneck
- Too many partitions: excessive rebalancing overhead, small partition size
- Cannot decrease partitions: over-provisioning is permanent

---

### Related Rules

- implement-poison-message-detection

---

### Related Skills

- Configure Kafka Topics and Consumer Groups
