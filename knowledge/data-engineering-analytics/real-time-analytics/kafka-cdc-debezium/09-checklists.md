# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** kafka-cdc-debezium
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] CDC with Debezium and Kafka — WAL-to-Kafka topic pipeline understood
- [ ] Debezium Kafka Connect source connector configured for PostgreSQL or MySQL
- [ ] Topic-per-table pattern configured for source database tables
- [ ] Change event structure (before/after, source metadata, op type) understood
- [ ] Snapshot vs streaming mode understood — initial load then real-time changes
- [ ] Laravel Kafka consumer processes change events for read model updates

---

# Architecture Checklist

- [ ] Debezium MySQL/PostgreSQL connector configured in Kafka Connect
- [ ] One Kafka topic per source table with compacted retention for key-based deduplication
- [ ] Change event includes before (old value), after (new value), op (c/r/u/d), source (DB metadata)
- [ ] Laravel consumer subscribes to CDC topics and processes structured change events
- [ ] Circuit breaker (K034) protects consumers from Kafka/consumer group failure storms
- [ ] ClickHouse Materialized Views (K016) process CDC-fed analytics pipeline

---

# Implementation Checklist

- [ ] Debezium connector JSON config created: database.hostname, database.port, table.include.list
- [ ] Kafka topic auto-created (auto.create.topics.enable) or pre-created for each table
- [ ] Laravel consumer class: handles message, parses before/after JSON, applies to read model
- [ ] Consumer group configured with unique group.id for offset tracking
- [ ] Snapshot mode ('initial') — performs initial table load then switches to streaming
- [ ] Schema change topic enabled for DDL event capture

---

# Performance Checklist

- [ ] Kafka topic partitioning — one partition per table (ordered per key) or multiple (throughput)
- [ ] Consumer lag monitored — max lag before read model is stale
- [ ] Debezium poll interval tuned — balance latency vs throughput
- [ ] Max.request.size tuned for large change event payloads (UPDATE with full row)
- [ ] Compression enabled for Kafka topics (snappy or lz4) for network efficiency
- [ ] Snapshot batch size configured to avoid source DB load spike

---

# Security Checklist

- [ ] Debezium connector database user with replication role only (MINIMAL privileges)
- [ ] Kafka topic access restricted via ACLs — CDC topics readable only by authorized consumers
- [ ] Change events encrypted in transit (Kafka TLS)
- [ ] Sensitive columns excluded via Debezium column.blacklist
- [ ] Kafka Connect credentials stored in Connect worker config, not connector config

---

# Reliability Checklist

- [ ] Consumer offset committed after successful processing — at-least-once semantics
- [ ] Consumer rebalance handled gracefully — partitions reassigned without message loss
- [ ] Debezium source connector restarts on connector failure — single message transformation (SMT) retries
- [ ] WAL slot retention configured — debezium.offset.flush.interval.ms matches WAL retention
- [ ] Circuit breaker (K034) prevents consumer retries after repeated Kafka failures

---

# Testing Checklist

- [ ] Test connector snapshot mode loads existing data to Kafka topic
- [ ] Test CDC captures INSERT/UPDATE/DELETE on source table
- [ ] Test Laravel consumer processes change event and updates read model
- [ ] Test consumer restart resumes from last committed offset
- [ ] Test schema change — ALTER TABLE ADD COLUMN does not break connector
- [ ] Test circuit breaker during Kafka outage — consumers protected

---

# Maintainability Checklist

- [ ] Debezium connector configuration in version-controlled JSON files
- [ ] Kafka Connect cluster configuration documented in operations runbook
- [ ] Topic naming: cdc.{database}.{schema}.{table}
- [ ] Consumer group naming: cdc-consumer-{application}-{environment}
- [ ] Schema evolution documented and communicated to CDC consumers

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use CDC for all tables — only tables that need real-time change tracking
- [ ] Do not skip offset commit monitoring — lost offset causes full re-snapshot
- [ ] Do not ignore WAL slot retention — debezium paused too long loses slot
- [ ] Do not process CDC events synchronously on Kafka consumer thread
- [ ] Do not use CDC for event sourcing — CDC captures DB state changes, not domain events

---

# Production Readiness Checklist

- [ ] Prometheus metrics for CDC event rate per table, consumer lag, connector status
- [ ] Logged warning when consumer lag exceeds 1 minute
- [ ] Alert when Debezium connector fails or pauses
- [ ] WAL slot age monitored — slot not released while connector is running
- [ ] Deploy checklist includes CDC connector restart and offset verification
- [ ] Staging CDC pipeline validated before production table connectors enabled

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Debezium connector, topic-per-table, change event structure, Laravel consumer
- [ ] Security requirements satisfied: replication-only DB user, Kafka ACLs, TLS, column blacklist
- [ ] Performance requirements satisfied: partition strategy, consumer lag, poll interval, compression, snapshot batch
- [ ] Testing requirements satisfied: snapshot, INSERT/UPDATE/DELETE, offset restart, schema changes, circuit breaker
- [ ] Anti-pattern checks passed: selective CDC, offset monitoring, WAL slot awareness, event sourcing distinction
- [ ] Production readiness verified: event rate metrics, consumer lag alerts, connector health, WAL slot age, staging

---

# Related References

- K037 (CDC Sub-Second Replication): Advanced CDC with lower latency targets
- K038 (Saga Pattern Kafka): Distributed transaction coordination using Kafka
- K027 (Reverb Scaling): Real-time data delivery to clients after CDC processing
- K034 (Circuit Breaker): Protecting consumers from Kafka/consumer group failure storms
- K016 (ClickHouse Materialized Views): Target for CDC-fed analytics pipeline
