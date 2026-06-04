# Kafka CDC with Debezium

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 06-real-time-analytics
- **Knowledge Unit:** kafka-cdc-debezium
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

Change Data Capture (CDC) with Debezium and Kafka streams database changes (INSERT, UPDATE, DELETE) in real-time into Kafka topics by tailing the database's write-ahead log, enabling Laravel applications to react to database changes without polling or application-level event emission. CDC eliminates the need for dual-writes (write to database + dispatch event) — changes automatically become events without application-level coordination.

---

## Core Concepts

- **CDC (Change Data Capture):** Captures database changes at the storage engine level (WAL for PostgreSQL, binlog for MySQL) and publishes them as events — captures ALL changes including direct SQL, migrations, and bulk operations
- **Debezium:** Open-source CDC platform built on Kafka Connect — provides source connectors for PostgreSQL, MySQL, MongoDB, SQL Server, and others — publishes change events to Kafka with structured envelope
- **Kafka Connect:** Framework for streaming data between Kafka and external systems — source connectors read from external systems and write to Kafka — sink connectors read from Kafka and write to external systems
- **Topic Per Table:** Debezium publishes one Kafka topic per database table — each message represents one row-level change — topics partitioned by table primary key for ordered processing per row
- **Change Event Structure:** Each event contains: `op` (operation type: c=create, u=update, d=delete), `before` (row state before change), `after` (row state after change), `source` (metadata: database, table, timestamp, position)

---

## Mental Models

- **CDC as Security Camera:** Application-level events are like employees reporting what they did. CDC is a security camera watching everything — it sees changes that employees forget to report (direct SQL, migrations, bulk operations). It never blinks and never misses anything.
- **WAL as Black Box Flight Recorder:** PostgreSQL's WAL is like an airplane's black box — it records every single thing that happens, in order, with timestamps. Debezium reads the black box and broadcasts it over the plane's intercom (Kafka). Everyone who needs to know hears about it.

---

## Internal Mechanics

Debezium connects to PostgreSQL as a replication client, reading the WAL at the current LSN. When a transaction commits, Debezium captures the change, serializes it to the event structure (with before/after images), and publishes to the appropriate Kafka topic (one per table). Kafka stores the event durably with the configured retention policy. Laravel consumers (using `mateusjunges/laravel-kafka`) subscribe to Kafka topics and process events. The consumer processes each event, performing idempotent operations to update the analytics pipeline (cache invalidation, read model updates, search index updates).

---

## Patterns

- **Topic Partitioning by Primary Key:** Debezium partitions topics by table primary key — ensures ordered delivery per row but unordered across different rows — design consumers to handle out-of-order events per row ID
- **Use Avro or JSON Schema:** Configure Debezium with a schema registry — schema evolution is critical for long-running CDC pipelines — without schema management, schema changes break downstream consumers
- **Monitor CDC Lag:** Track lag between WAL position and Kafka event production — lag indicates Debezium or Kafka falling behind — lag should be < 10 seconds for healthy pipelines

---

## Architectural Decisions

Use CDC for real-time analytics pipelines from operational databases, cache invalidation, read model updates, and event-driven architectures without application-level event emission. Do not use CDC for application-level events that should be emitted by business logic, or for systems with sub-second latency requirements (CDC adds 100ms-5s latency). Use separate consumer groups per table or domain for high-volume tables.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Captures ALL changes (including direct SQL) | CDC adds 100ms-5s latency | Not suitable for sub-second requirements |
| Eliminates dual-write problem | Requires Kafka infrastructure | Significant operational overhead |
| Schema evolution tracking | Schema registry management | Critical for long-running pipelines |
| Replay capability from Kafka | Consumer must handle at-least-once delivery | Implement idempotent consumers |

---

## Performance Considerations

Debezium adds minimal overhead to source database (~1-3% CPU). Kafka throughput depends on partition count and broker configuration. Laravel consumer throughput: 1000-10000 events/second per consumer group. CDC latency: 100ms-5s from database commit to Kafka event availability.

---

## Production Considerations

Debezium connects to the database with a replication user — minimal required privileges (REPLICATION, SELECT). Kafka topics may contain sensitive data — use topic-level authorization. Schema registry stores table schemas that may reveal data structure. WAL/binlog may contain all database changes, including password hashes and sensitive columns — configure column exclusion.

---

## Common Mistakes

- **Ignoring Schema Changes:** Source table schema changes cause Debezium to fail or produce malformed events — downstream consumers break. Better: use schema registry, implement consumer-side schema version handling.
- **No Consumer Idempotency:** CDC events can be delivered more than once (at-least-once semantics) — non-idempotent consumers produce duplicate analytics records. Better: implement idempotent consumers with upsert patterns and deduplication by event position.
- **Single Consumer Group:** One consumer group processes all CDC topics — a busy table's changes delay processing for all other tables. Better: use separate consumer groups per table or domain.

---

## Failure Modes

- **CDC as Primary Event Bus:** Using CDC for all inter-service communication instead of application-level events — CDC captures raw database state, not business semantics. Mitigation: use CDC for infrastructure synchronization, domain events for business integration.
- **Ignoring Tombstone Events:** DELETE operations produce tombstone events (null value with key) — consumers that ignore tombstones never remove deleted records from analytics tables. Mitigation: handle DELETE events by marking records as deleted or removing from target tables.
- **No Schema Registry:** Debezium without schema registry — column type change causes serialization errors, events cannot be deserialized. Mitigation: always use schema registry with Debezium.

---

## Ecosystem Usage

The `mateusjunges/laravel-kafka` package provides Kafka consumer support for Laravel. Debezium runs as a Kafka Connect worker alongside Kafka, outside the Laravel application. Laravel consumers subscribe to Kafka topics and process CDC events for cache invalidation, read model updates, and analytics pipeline feeding. CDC is the foundation for real-time analytics that react to database changes without application-level hooks.

---

## Related Knowledge Units

### Prerequisites
- Kafka Fundamentals — Topic, partition, consumer group concepts
- Queue Dispatching — Queue patterns for CDC event processing

### Related Topics
- CDC Sub-Second Replication — Extending CDC to sub-second latency
- ClickHouse Materialized Views — Processing CDC events in ClickHouse

### Advanced Follow-up Topics
- Saga Pattern with Kafka — Distributed transaction coordination via CDC events
- Write Amplification — CDC volume impact on ClickHouse write amplification

---

## Research Notes

CDC with Debezium has become the standard approach for feeding analytics pipelines from operational databases. The elimination of dual-writes (write to database + separately emit event) is the key architectural benefit. The most common production issues are schema changes breaking CDC pipelines and consumer non-idempotency causing duplicate data. A schema registry and idempotent consumers are mandatory for production CDC deployments.
