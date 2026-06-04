# Decomposition: Real-Time CDC with Sub-Second Replication

## Topic Overview
Sub-second CDC replication moves database changes from PostgreSQL to analytics stores (ClickHouse, Kafka) with end-to-end latency under 1000 milliseconds. This goes beyond standard CDC by optimizing every layer — WAL capture, serialization, transport, and ingestion — to minimize latency while maintaining exactly-once or at-least-once semantics. For Laravel applications requiring real-time dashboards, fraud detection, or live operational metrics, sub-second CDC enables analytics that are nearly indistinguishable from real-time without sacrificing the ACID guarantees of the OLTP database.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k037-cdc-subsecond-replication/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Real-Time CDC with Sub-Second Replication
- **Purpose:** Sub-second CDC replication moves database changes from PostgreSQL to analytics stores (ClickHouse, Kafka) with end-to-end latency under 1000 milliseconds.
- **Difficulty:** Intermediate
- **Dependencies:** K017 (Kafka CDC Debezium): Baseline CDC pattern that sub-second replication extends, K026 (Write Amplification): Sub-second CDC increases write frequency, impacting amplification, K016 (ClickHouse Materialized Views): Processing CDC feed for analytics queries, K038 (Saga Pattern Kafka): Distributed transaction coordination using sub-second CDC, K010 (Reverb WebSocket): Consuming CDC-processed data for real-time dashboards

## Dependency Graph
**Depends on:**
- K017 (Kafka CDC Debezium): Baseline CDC pattern that sub-second replication extends
- K026 (Write Amplification): Sub-second CDC increases write frequency, impacting amplification
- K016 (ClickHouse Materialized Views): Processing CDC feed for analytics queries
- K038 (Saga Pattern Kafka): Distributed transaction coordination using sub-second CDC
- K010 (Reverb WebSocket): Consuming CDC-processed data for real-time dashboards

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- End-to-end latency:
- WAL position tracking:
- Micro-batching vs streaming:
- ClickPipes for ClickHouse:
- CDC v2 (2025+):
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K017 (Kafka CDC Debezium): Baseline CDC pattern that sub-second replication extends, K026 (Write Amplification): Sub-second CDC increases write frequency, impacting amplification, K016 (ClickHouse Materialized Views): Processing CDC feed for analytics queries, K038 (Saga Pattern Kafka): Distributed transaction coordination using sub-second CDC, K010 (Reverb WebSocket): Consuming CDC-processed data for real-time dashboards

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