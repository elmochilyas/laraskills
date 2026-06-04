# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** cdc-subsecond-replication
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] End-to-end latency target under 1000ms confirmed achievable for use case
- [ ] WAL position tracking configured for PostgreSQL -> ClickHouse/Kafka pipeline
- [ ] Micro-batching vs streaming decision made per source table
- [ ] ClickPipes for ClickHouse evaluated for managed CDC ingestion
- [ ] CDC v2 (2025+) features considered for improved latency
- [ ] Write amplification (K026) impact of sub-second CDC measured

---

# Architecture Checklist

- [ ] WAL capture layer (Debezium / pgoutput) configured with real-time slot
- [ ] Serialization format chosen (Avro vs JSON vs Protobuf) for WAL events
- [ ] Transport layer (Kafka vs NATS vs direct ClickPipes) selected for latency
- [ ] Ingestion layer (ClickHouse Materialized View) processes CDC feed (K016)
- [ ] Micro-batching vs streaming decision — latency vs throughput tradeoff
- [ ] CDC feed consumed by Reverb WebSocket (K010) for live dashboard updates

---

# Implementation Checklist

- [ ] PostgreSQL WAL slot created for CDC with pgoutput plugin
- [ ] Debezium connector configured for source table(s) with LSN tracking
- [ ] Kafka topic per table with retention policy for CDC events
- [ ] ClickPipes configured for direct PostgreSQL-to-ClickHouse streaming
- [ ] Laravel consumer processes CDC events for cache invalidation or read model update
- [ ] Circuit breaker (K034) protects consumers from CDC failure storms

---

# Performance Checklist

- [ ] End-to-end latency measured: WAL commit -> Kafka topic -> ClickHouse insert
- [ ] Micro-batch interval tuned for latency vs throughput balance
- [ ] WAL slot retention managed to prevent disk full from slow consumers
- [ ] ClickHouse insert batching optimized for sub-second latency
- [ ] Serialization/deserialization overhead measured for chosen format
- [ ] Write amplification (K026) measured — sub-second CDC increases insert frequency

---

# Security Checklist

- [ ] WAL slot credentials with replication role only — no data modification
- [ ] CDC events encrypted in transit (Kafka TLS, ClickPipes TLS)
- [ ] CDC topic access restricted in Kafka ACLs
- [ ] Sensitive columns excluded from WAL capture via Debezium column filters
- [ ] WAL slot activity monitored for unauthorized table access

---

# Reliability Checklist

- [ ] WAL position checkpointed for resume after consumer restart
- [ ] Exactly-once or at-least-once semantics chosen and verified
- [ ] Consumer lag monitored — stalled consumer causes WAL retention growth
- [ ] Snapshot mode available for initial table load + streaming switch
- [ ] CDC pipeline health check — WAL slot active, consumer running

---

# Testing Checklist

- [ ] Test end-to-end latency under load — 99th percentile < 1000ms
- [ ] Test consumer restart resumes from last checkpoint (no data loss, no duplicates)
- [ ] Test WAL slot retention — consumer paused for 1 hour, slot not lost
- [ ] Test schema change handling — ALTER TABLE on source does not break CDC
- [ ] Test ClickHouse materialized view processes CDC-fed data correctly (K016)
- [ ] Test circuit breaker protects consumer during Kafka/ClickHouse outage

---

# Maintainability Checklist

- [ ] CDC pipeline diagram documented with latency targets per hop
- [ ] Debezium connector configuration version-controlled
- [ ] WAL slot naming convention: cdc_{source_table}_{environment}
- [ ] Consumer lag thresholds documented and monitored
- [ ] ClickPipes configuration reviewed for ClickHouse version upgrades

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use CDC for non-realtime tables — batch ETL (< 5min latency) is simpler
- [ ] Do not skip WAL slot monitoring — unbounded WAL growth fills disk
- [ ] Do not ignore schema changes — CDC breaks when source table schema changes
- [ ] Do not use CDC for OLTP writes — CDC is for replication/analytics, not writes
- [ ] Do not keep LSN tracking in memory — persist to survive restart

---

# Production Readiness Checklist

- [ ] Prometheus metrics for CDC end-to-end latency, consumer lag, events per second
- [ ] Logged warning when end-to-end latency exceeds 500ms (half of target)
- [ ] Alert when consumer lag > 10 minutes (WAL retention risk)
- [ ] WAL slot disk usage monitored and alert at 80%
- [ ] Deploy checklist includes CDC pipeline health verification
- [ ] Staging CDC pipeline load-tested with production-scale data rate

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: WAL capture, serialization, transport, ingestion, sub-second target
- [ ] Security requirements satisfied: replication-only credentials, TLS, ACLs, column filtering
- [ ] Performance requirements satisfied: measured latency, micro-batch tuning, WAL retention, serialization overhead
- [ ] Testing requirements satisfied: latency SLA, resume checkpoint, WAL retention, schema changes, circuit breaker
- [ ] Anti-pattern checks passed: CDC for real-time only, WAL slot monitored, schema changes planned, LSN persisted
- [ ] Production readiness verified: latency metrics, consumer lag alerts, WAL disk monitoring, staging load test

---

# Related References

- K017 (Kafka CDC Debezium): Baseline CDC pattern that sub-second replication extends
- K026 (Write Amplification): Sub-second CDC increases write frequency, impacting amplification
- K016 (ClickHouse Materialized Views): Processing CDC feed for analytics queries
- K038 (Saga Pattern Kafka): Distributed transaction coordination using sub-second CDC
- K010 (Reverb WebSocket): Consuming CDC-processed data for real-time dashboards
