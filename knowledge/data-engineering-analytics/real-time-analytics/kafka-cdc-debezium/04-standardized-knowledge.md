# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** kafka-cdc-debezium
**Difficulty:** Foundation
**Category:** Change Data Capture
**Last Updated:** 2026-06-03

---

# Overview

Change Data Capture (CDC) with Debezium and Kafka streams PostgreSQL/MySQL changes (INSERT, UPDATE, DELETE) in real-time into Kafka topics, enabling Laravel applications to react to database changes without polling or application-level event emission. Debezium acts as a Kafka Connect source connector, tailing the database's write-ahead log (WAL) and publishing structured change events to Kafka topics.

Combined with Laravel consumers, this enables real-time analytics pipelines, cache invalidation, read model updates, and event-driven architectures that are decoupled from application code.

Engineers must care because CDC eliminates the need for dual-writes (write to database + dispatch event). Changes to the database automatically become events without application-level coordination, reducing complexity and ensuring consistency.

---

# Core Concepts

## CDC (Change Data Capture)

A pattern that captures database changes at the storage engine level (WAL for PostgreSQL, binlog for MySQL) and publishes them as events. Unlike application-level events, CDC captures ALL changes, including those made by direct SQL, migrations, and bulk operations.

## Debezium

An open-source CDC platform built on Kafka Connect. Provides source connectors for PostgreSQL, MySQL, MongoDB, SQL Server, and others. Publishes change events to Kafka topics with a structured envelope.

## Kafka Connect

A framework for streaming data between Kafka and external systems. Source connectors read from external systems and write to Kafka. Sink connectors read from Kafka and write to external systems.

## Topic Per Table

Debezium publishes one Kafka topic per database table. Each message represents one row-level change. Topics are partitioned by table primary key for ordered processing per row.

## Change Event Structure

Each event contains: `op` (operation type: c=create, u=update, d=delete), `before` (row state before change), `after` (row state after change), `source` (metadata: database, table, timestamp, position).

---

# When To Use

- Real-time analytics pipelines from operational databases
- Cache invalidation on data changes
- Read model/materialized view updates via Laravel consumers
- Event-driven architectures without application-level event emission
- Data synchronization between services

---

# When NOT To Use

- Application-level events that should be emitted by business logic
- Systems with sub-second latency requirements (CDC adds 100ms-5s latency)
- Prototype applications (CDC infrastructure overhead is significant)
- Scheduled batch processing (cron jobs are simpler)

---

# Best Practices

## Topic Partitioning by Primary Key

Debezium partitions topics by table primary key. This ensures ordered delivery per row but unordered across different rows. Design consumers to handle out-of-order events per row ID.

## Use Avro or JSON Schema

Configure Debezium with a schema registry. Schema evolution is critical for long-running CDC pipelines. Without schema management, schema changes break downstream consumers.

## Monitor CDC Lag

Track the lag between WAL position and Kafka event production. Lag indicates Debezium or Kafka is falling behind. Lag should be < 10 seconds for healthy pipelines.

---

# Architecture Guidelines

## Pipeline

Database WAL → Debezium Connector (Kafka Connect) → Kafka Topic → Laravel Consumer → Analytics Pipeline

## Consumer Implementation

Laravel subscribes to Kafka topics using `mateusjunges/laravel-kafka` or similar package. Each consumer handles change events and updates the analytics pipeline.

## Schema Evolution Handling

When source table schema changes, Debezium captures the new schema alongside the new data. Consumers must handle both old and new schema formats until all historical events are processed.

---

# Performance Considerations

- Debezium add minimal overhead to the source database (~1-3% CPU).
- Kafka throughput depends on partition count and broker configuration.
- Laravel consumer throughput: 1000-10000 events/second per consumer group.
- CDC latency: 100ms-5s from database commit to Kafka event availability.

---

# Security Considerations

- Debezium connects to the database with a replication user. This user should have minimal required privileges (REPLICATION, SELECT).
- Kafka topics may contain sensitive data. Use topic-level authorization.
- Schema registry stores table schemas that may reveal data structure.
- WAL/binlog may contain all database changes, including password hashes and sensitive columns.

---

# Common Mistakes

## Mistake: Ignoring Schema Changes

Source table schema changes cause Debezium to fail or produce malformed events. Downstream consumers break.

**Better approach:** Use schema registry. Implement consumer-side schema version handling. Plan schema changes with CDC compatibility.

## Mistake: No Consumer Idempotency

CDC events can be delivered more than once (at-least-once semantics). Consumers that are not idempotent produce duplicate analytics records.

**Better approach:** Implement idempotent consumers. Use upsert patterns. Deduplicate by event position/source.

## Mistake: Single Consumer Group

One consumer group processes all CDC topics. A busy table's changes delay processing for all other tables.

**Better approach:** Use separate consumer groups per table or per domain. Route high-volume tables to dedicated consumers.

---

# Anti-Patterns

## CDC as Primary Event Bus
Using CDC for all inter-service communication instead of application-level events. CDC captures raw database state, not business semantics.

**Solution:** Use CDC for infrastructure-level synchronization (cache invalidation, search index). Use domain events for business-level integration.

## Ignoring Tombstone Events
DELETE operations produce tombstone events (null value with key). Consumers that ignore tombstones never remove deleted records from analytics tables.

**Solution:** Handle DELETE events by marking records as deleted or removing them from target tables.

## No Schema Registry
Debezium is configured without a schema registry. A column type change in the source table causes serialization errors. Events cannot be deserialized.

**Solution:** Always use a schema registry with Debezium. Configure schema evolution behavior (transitive, backward-compatible).
