# CDC Sub-Second Replication

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 06-real-time-analytics
- **Knowledge Unit:** cdc-subsecond-replication
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Sub-second CDC replication moves database changes from PostgreSQL to analytics stores with end-to-end latency under 1000 milliseconds by optimizing WAL capture, serialization, transport, and ingestion. This enables real-time dashboards, fraud detection, and live operational metrics that are nearly indistinguishable from real-time without sacrificing ACID guarantees of the OLTP database.

---

## Core Concepts

- **End-to-End Latency:** Total time from committed transaction in PostgreSQL to transformed data available for queries in analytics store — sub-second means < 1000ms, best-in-class achieving 100-300ms
- **WAL Position Tracking:** PostgreSQL's Write-Ahead Log records every transaction — Debezium reads WAL at LSN (Log Sequence Number) level — sub-second requires WAL reader to poll frequently enough for millisecond detection
- **Micro-Batching vs Streaming:** Micro-batching collects change events for 50-200ms before sending to Kafka — streaming sends each event immediately — sub-second requires micro-batch windows under 200ms or true streaming
- **ClickPipes:** Managed ClickHouse ingestion service connecting to Kafka and streaming data directly into MergeTree tables — sub-second CDC can use ClickPipes to bypass custom ingestion code, reducing latency to 200-500ms

---

## Mental Models

- **CDC as Live Microphone:** WAL capture is a live microphone in the database — it hears every change as it happens. Kafka is the broadcast system that distributes the audio. ClickHouse is the recording device. Sub-second means the listener hears it almost as fast as the speaker speaks.
- **Latency as Water Pipes:** Think of the CDC pipeline as a series of pipes — WAL is the source faucet, Kafka is the main pipe, ClickHouse is the destination tank. Each connection, valve, and meter adds a few milliseconds. Sub-second means all pipes are short, wide, and direct.

---

## Internal Mechanics

PostgreSQL generates WAL records for every transaction. Debezium's Kafka Connect source connector reads WAL changes at the LSN level, serializes them into structured change events, and publishes to Kafka topics. Kafka stores the events durably. ClickPipes (or a custom consumer) reads from Kafka topics and inserts into ClickHouse MergeTree tables. The pipeline is: PostgreSQL WAL → Debezium (Kafka Connect) → Kafka topic → ClickPipes/Consumer → ClickHouse. Each hop adds latency: WAL capture (~10ms), Kafka produce (~5ms), Kafka to ClickHouse ingestion (~200ms).

---

## Patterns

- **Buffer in Kafka:** Always write CDC events to Kafka before ingesting to ClickHouse — Kafka provides durability, replay capability, and decouples source from sink velocity mismatches
- **Tune PostgreSQL WAL Parameters:** Set `wal_level = logical`, increase `max_replication_slots`, tune `wal_writer_delay` to 10ms or lower for sub-second WAL capture
- **Monitor Replication Lag:** Track WAL lag (`pg_stat_replication`) and Kafka consumer lag as separate metrics — end-to-end latency is the sum of both

---

## Architectural Decisions

Use exactly-once semantics with `enable.idempotence=true` and `acks=all` on Kafka producer — prevents duplicates at the cost of 2-5ms additional latency. Always buffer CDC events in Kafka before ClickHouse ingestion — Debezium's memory is bounded, Kafka provides unlimited buffer via disk. Co-locate PostgreSQL, Kafka, and ClickHouse in the same region — cross-region latency makes sub-second SLAs impossible.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Sub-second data freshness | WAL capture adds 5-10% CPU overhead | Tune WAL parameters to minimize impact |
| Exactly-once semantics (Kafka idempotent) | 2-5ms additional latency per batch | Acceptable for sub-second requirements |
| Kafka buffering prevents backpressure | Additional infrastructure (Kafka cluster) | Essential for production reliability |
| Real-time analytics capability | Infrastructure complexity | Requires DevOps expertise for tuning |

---

## Performance Considerations

WAL capture adds ~5-10% CPU overhead on primary PostgreSQL. Kafka producer latency: 2-5ms per batch with idempotent producers. ClickHouse ingestion: 50-200ms with ClickPipes, 100-500ms with custom HTTP INSERT. Network latency between services adds 1-10ms per hop. Total pipeline: WAL capture (10ms) + Kafka (5ms) + ingestion (200ms) = ~215ms best case.

---

## Production Considerations

Always buffer CDC events in Kafka — streaming directly from Debezium to ClickHouse causes backpressure issues when ClickHouse ingestion slows down. Set `wal_keep_size` to 4x expected daily WAL volume — insufficient WAL retention causes replication slot failures requiring full resync. Alert on WAL lag (> 100ms) and Kafka consumer lag (> 500ms). Dashboard freshness metrics should be user-visible.

---

## Common Mistakes

- **Skipping Kafka Buffering:** CDC events streamed directly from Debezium to ClickHouse — when ClickHouse ingestion slows (merge pressure), events back up in Debezium memory, causing WAL retention issues. Better: always buffer CDC events in Kafka.
- **Insufficient WAL Retention:** `wal_keep_size` set too low — PostgreSQL removes old WAL segments, Debezium cannot keep up, replication slot fails. Better: set to 4x expected daily WAL volume, monitor slot lag.
- **Ignoring Network Latency:** Services deployed across different regions — WAL events cross a 100ms latency link, sub-second SLAs impossible. Better: co-locate in same region, use availability zones.

---

## Failure Modes

- **WAL Retention Overflow:** Debezium falls behind, PostgreSQL removes WAL segments before Debezium reads them — replication slot fails, full resync required. Mitigation: monitor slot lag, set adequate `wal_keep_size`.
- **Kafka Backpressure:** ClickHouse ingestion slows down, Kafka consumer lag grows — if lag exceeds retention, events are lost. Mitigation: monitor consumer lag, scale ClickHouse ingestion capacity.
- **Schema Changes:** Source table schema changes — Debezium produces events with new schema, downstream consumers fail. Mitigation: use schema registry, plan changes with CDC compatibility.

---

## Ecosystem Usage

Sub-second CDC is an infrastructure-level pattern — it runs between PostgreSQL and ClickHouse, outside the Laravel application. Laravel benefits through real-time dashboards that reflect current OLTP state. The `mateusjunges/laravel-kafka` package can be used for Laravel-based Kafka consumers if custom processing is needed between CDC and analytics storage. ClickPipes is a managed service, not a Laravel package.

---

## Related Knowledge Units

### Prerequisites
- Kafka CDC with Debezium — Base CDC pattern that sub-second extends
- PostgreSQL WAL Fundamentals — Understanding of Write-Ahead Log

### Related Topics
- ClickHouse Materialized Views — Processing CDC data in ClickHouse
- Reverb WebSocket — Broadcasting real-time changes to frontend

### Advanced Follow-up Topics
- Write Amplification — Impact of CDC volume on ClickHouse write amplification
- Multi-Region Clickhouse — Cross-region CDC latency considerations

---

## Research Notes

Sub-second CDC represents the cutting edge of real-time analytics infrastructure. The key insight is that WAL capture, Kafka buffering, and ClickHouse ingestion must each be tuned for latency — any bottleneck in the chain prevents sub-second achievement. The infrastructure complexity is significant but unlocks new application capabilities: live dashboards that update within a heartbeat, fraud detection that catches anomalies as they happen, and operational metrics that reflect the current state.
