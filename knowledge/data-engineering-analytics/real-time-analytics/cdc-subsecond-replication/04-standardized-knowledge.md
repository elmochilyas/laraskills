# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** cdc-subsecond-replication
**Difficulty:** Intermediate
**Category:** Real-Time Data Ingestion
**Last Updated:** 2026-06-03

---

# Overview

Sub-second CDC replication moves database changes from PostgreSQL to analytics stores (ClickHouse, Kafka) with end-to-end latency under 1000 milliseconds. This goes beyond standard CDC by optimizing every layer — WAL capture, serialization, transport, and ingestion — to minimize latency while maintaining exactly-once or at-least-once semantics. For Laravel applications requiring real-time dashboards, fraud detection, or live operational metrics, sub-second CDC enables analytics that are nearly indistinguishable from real-time without sacrificing ACID guarantees of the OLTP database.

Engineers must care because sub-second latency unlocks new application capabilities: live dashboards update within a heartbeat, fraud detection catches anomalies as they happen, and operational metrics reflect the current state, not the state minutes ago. The tradeoff is infrastructure complexity — sub-second CDC requires careful tuning of PostgreSQL, Debezium, Kafka, and ClickHouse to work in harmony.

---

# Core Concepts

## End-to-End Latency

The total time from a committed transaction in PostgreSQL to the transformed data being available for queries in the analytics store. Sub-second means < 1000ms, with best-in-class implementations achieving 100-300ms.

## WAL Position Tracking

PostgreSQL's Write-Ahead Log (WAL) records every transaction. Debezium reads WAL at the LSN (Log Sequence Number) level. Sub-second replication requires the WAL reader to poll frequently enough that LSN gaps are detected within milliseconds.

## Micro-Batching vs Streaming

Micro-batching collects change events for a short interval (50-200ms) before sending to Kafka. Streaming sends each change event immediately. Micro-batching increases throughput at the cost of latency. Sub-second requires micro-batch windows under 200ms or true streaming.

## ClickPipes

Managed ClickHouse ingestion service that connects to Kafka and streams data directly into MergeTree tables. Sub-second CDC can use ClickPipes to bypass custom ingestion code, reducing latency to ClickHouse to 200-500ms.

## CDC v2 (2025+)

Modern CDC implementations that support schema evolution, exactly-once semantics, and sub-second latency out of the box. These use WAL-based capture with Kafka as the durable log and ClickPipes/Kafka Connect for delivery.

---

# When To Use

- Real-time dashboards requiring < 1 second data freshness
- Fraud detection systems that must analyze transactions within milliseconds
- Live operational metrics: current active users, revenue, error rates
- Event-driven architectures where analytics state must reflect current OLTP state
- Financial systems requiring low-latency risk calculations

---

# When NOT To Use

- Historical reporting where hourly/daily latency is acceptable
- Batch analytics on large datasets where freshness is not critical
- Systems where ACID compliance of the analytics store is required (CDC gives eventual consistency)
- Simple read replicas — standard streaming replication is simpler

---

# Best Practices

## Tune PostgreSQL WAL Parameters

Set `wal_level = logical`, increase `max_replication_slots`, and tune `wal_writer_delay` to 10ms or lower for sub-second WAL capture.

## Monitor Replication Lag

Track `pg_stat_replication` for WAL lag and Kafka consumer lag as separate metrics. The end-to-end latency is the sum of both.

## Use Exactly-Once Semantics

Configure Kafka producer with `enable.idempotence=true` and `acks=all`. This prevents duplicate events at the cost of ~2-5ms additional latency per batch.

## Buffer in Kafka

Always write CDC events to Kafka before ingesting to ClickHouse. Kafka provides durability, replay capability, and decouples source from sink velocity mismatches.

---

# Performance Considerations

- WAL capture adds ~5-10% CPU overhead on the primary PostgreSQL instance.
- Kafka producer latency: 2-5ms per batch with idempotent producers.
- ClickHouse ingestion: 50-200ms latency with ClickPipes, 100-500ms with custom HTTP INSERT.
- Network latency between services adds 1-10ms per hop.
- Total pipeline: WAL capture (10ms) + Kafka (5ms) + ingestion (200ms) = ~215ms best case.

---

# Common Mistakes

## Mistake: Skipping Kafka Buffering

CDC events are streamed directly from Debezium to ClickHouse without Kafka buffering. When ClickHouse ingestion slows down (merge pressure), events back up in Debezium memory. The backpressure causes WAL retention issues.

**Better approach:** Always buffer CDC events in Kafka. Debezium's memory is bounded. Kafka provides unlimited buffer via disk.

## Mistake: Insufficient WAL Retention

`wal_keep_size` is set too low. PostgreSQL removes old WAL segments. Debezium cannot keep up with the WAL stream. Replication slot fails. Full resync required.

**Better approach:** Set `wal_keep_size` to 4x the expected daily WAL volume. Monitor slot lag and alert before WAL removal.

## Mistake: Ignoring Network Latency

Services are deployed across different regions. WAL events cross a 100ms latency link. Sub-second SLAs are impossible.

**Better approach:** Co-locate PostgreSQL, Kafka, and ClickHouse in the same region. Use Availability Zones within a region, not cross-region.

## Mistake: No Lag Alerting

No monitoring for CDC pipeline lag. The pipeline silently falls behind during a data spike. By the time the issue is noticed, dashboards show 5-minute-old data.

**Better approach:** Alert on WAL lag (> 100ms) and Kafka consumer lag (> 500ms). Dashboard freshness metrics must be user-visible.
