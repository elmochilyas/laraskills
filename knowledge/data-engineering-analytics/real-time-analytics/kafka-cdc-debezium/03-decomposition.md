# Decomposition: Kafka CDC with Debezium for Real-Time Analytics

## Topic Overview
Change Data Capture (CDC) with Debezium and Kafka streams PostgreSQL/MySQL changes (INSERT, UPDATE, DELETE) in real-time into Kafka topics, enabling Laravel applications to react to database changes without polling or application-level event emission. Debezium acts as a Kafka Connect source connector, tailing the database's write-ahead log (WAL) and publishing structured change events to Kafka topics. Combined with Laravel consumers, this enables real-time analytics pipelines, cache invalidation, read model updates, and event-driven architectures that are decoupled from application code.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k017-kafka-cdc-debezium/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Kafka CDC with Debezium for Real-Time Analytics
- **Purpose:** Change Data Capture (CDC) with Debezium and Kafka streams PostgreSQL/MySQL changes (INSERT, UPDATE, DELETE) in real-time into Kafka topics, enabling Laravel applications to react to database changes without polling or application-level event emission.
- **Difficulty:** Foundation
- **Dependencies:** K037 (CDC Sub-Second Replication): Advanced CDC with lower latency targets, K038 (Saga Pattern Kafka): Distributed transaction coordination using Kafka, K027 (Reverb Scaling): Real-time data delivery to clients after CDC processing, K034 (Circuit Breaker): Protecting consumers from Kafka/CG failure storms, K016 (ClickHouse Materialized Views): Target for CDC-fed analytics pipeline

## Dependency Graph
**Depends on:**
- K037 (CDC Sub-Second Replication): Advanced CDC with lower latency targets
- K038 (Saga Pattern Kafka): Distributed transaction coordination using Kafka
- K027 (Reverb Scaling): Real-time data delivery to clients after CDC processing
- K034 (Circuit Breaker): Protecting consumers from Kafka/CG failure storms
- K016 (ClickHouse Materialized Views): Target for CDC-fed analytics pipeline

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- CDC (Change Data Capture):
- Debezium:
- Kafka Connect:
- Topic per table:
- Change event structure:
- Snapshot vs streaming:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K037 (CDC Sub-Second Replication): Advanced CDC with lower latency targets, K038 (Saga Pattern Kafka): Distributed transaction coordination using Kafka, K027 (Reverb Scaling): Real-time data delivery to clients after CDC processing, K034 (Circuit Breaker): Protecting consumers from Kafka/CG failure storms, K016 (ClickHouse Materialized Views): Target for CDC-fed analytics pipeline

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization