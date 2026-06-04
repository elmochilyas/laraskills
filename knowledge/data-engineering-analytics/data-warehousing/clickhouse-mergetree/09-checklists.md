# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** clickhouse-mergetree
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] ORDER BY key chosen based on query access pattern, not ingestion order
- [ ] PARTITION BY granularity balanced between partition count and per-partition size
- [ ] PRIMARY KEY defined to optimize secondary key lookups (subset of ORDER BY)
- [ ] Merge behavior understood — parts merge in background, query results correct during merge
- [ ] TTL (Time-To-Live) configured for automatic data expiry per column or row
- [ ] SETTINGS (index_granularity, compression) tuned per table workload

---

# Architecture Checklist

- [ ] ORDER BY key set to columns used in WHERE filters most frequently (date, tenant_id, event_type)
- [ ] PARTITION BY granularity avoids excessive partitions (recommended 1M-10M rows per partition)
- [ ] PRIMARY KEY defined as prefix of ORDER BY for sparse index efficiency
- [ ] Merge behavior planned — parts coalesced in background, no query impact
- [ ] TTL configured for time-series data expiry (e.g., raw events retained 90 days)
- [ ] Star schema table design integrated with MergeTree configuration (K006 integration)

---

# Implementation Checklist

- [ ] CREATE TABLE with optimized ORDER BY (column order matches WHERE clause frequency)
- [ ] PARTITION BY toYYYYMM(event_date) for monthly time-series or toMonday(event_date) for weekly
- [ ] PRIMARY KEY set to first 1-3 columns of ORDER BY for efficient index lookup
- [ ] TTL event_date + INTERVAL 90 DAY on event tables for automatic data lifecycle
- [ ] SETTINGS index_granularity = 8192 (default) adjusted for very large or very small rows
- [ ] SETTINGS storage_policy configured for tiered storage (hot/warm/cold)

---

# Performance Checklist

- [ ] ORDER BY column order verified against most common WHERE filters using query log
- [ ] PARTITION BY chosen so partition count stays under 1000 for a MergeTree engine
- [ ] Sparse index effectiveness measured via system.query_log (rows read vs rows in table)
- [ ] Merge behavior does not cause write amplification peaks during heavy ingestion
- [ ] TTL delete runs scheduled and does not block concurrent SELECT queries
- [ ] Index granularity tuned — lower for point lookups, higher for scan-heavy workloads

---

# Security Checklist

- [ ] TTL deletion respects data retention compliance (GDPR, HIPAA)
- [ ] ROW POLICY applied at MergeTree level for tenant isolation
- [ ] PARTITION BY does not reveal sensitive partition key values in file paths
- [ ] Storage policy defined with access-controlled tier paths
- [ ] Sensitive columns excluded from ORDER BY to prevent index-based inference

---

# Reliability Checklist

- [ ] MergeTree mutex configuration prevents lock contention under concurrent inserts
- [ ] TTL delete monitored for completion — partial TTL deletes detected
- [ ] ReplicatedMergeTree configured for high availability if multi-node
- [ ] OPTIMIZE TABLE FINAL run after bulk load to trigger merge
- [ ] system.parts monitoring for unexpected part count growth (merge lagging)

---

# Testing Checklist

- [ ] Test ORDER BY enables sparse index — WHERE on ORDER BY column rows read = target rows
- [ ] Test PARTITION BY pruning — SELECT with partition key filter reads only relevant partitions
- [ ] Test TTL delete removes expired rows exactly at expiry boundary
- [ ] Test merge does not change SELECT results (query consistency during merge)
- [ ] Test ALTER TABLE ORDER BY with new key does not break existing queries
- [ ] Test index granularity change impact on query speed

---

# Maintainability Checklist

- [ ] MergeTree DDL version-controlled with migration tool (clickhouse-migrations)
- [ ] ORDER BY, PARTITION BY, TTL documented in table comments
- [ ] TTL policies documented with legal retention requirements
- [ ] Merge behavior tuning parameters documented in operations runbook
- [ ] Table configuration decisions reviewed and recorded for new tables

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use default ORDER BY (tuple()) — every query must full scan
- [ ] Do not partition by high-cardinality columns (user_id) — thousands of tiny partitions
- [ ] Do not set ORDER BY columns that are frequently updated — MergeTree optimized for append
- [ ] Do not skip TTL for time-series tables — data grows unbounded
- [ ] Do not set PRIMARY_KEY different from ORDER BY without understanding sparse index behavior

---

# Production Readiness Checklist

- [ ] Prometheus metrics for merge queue length, partition count, parts per table
- [ ] Logged warning when parts per table exceeds 100 (merge backlog)
- [ ] Alert when TTL delete backlog exceeds 24 hours
- [ ] system.parts query in health check for unexpected table fragmentation
- [ ] Deploy checklist includes MergeTree configuration review for new tables
- [ ] Staging query performance validated against production-like data volume

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: ORDER BY aligned with queries, PARTITION BY granular, TTL lifecycle
- [ ] Security requirements satisfied: TTL compliance, row-level access, sensitive column protection
- [ ] Performance requirements satisfied: sparse index efficiency, partition count limits, merge monitoring
- [ ] Testing requirements satisfied: index pruning, partition filtering, TTL correctness, merge consistency
- [ ] Anti-pattern checks passed: no default ORDER BY, no high-cardinality partition, TTL configured
- [ ] Production readiness verified: merge metrics, part count alerts, TTL backlogs, staging validation

---

# Related References

- K006 (Star Schema): ClickHouse table design for star-schema patterns
- K016 (ClickHouse Materialized Views): MVs on MergeTree tables
- K024 (AggregatingMergeTree): Advanced MergeTree variant for pre-aggregation
- K035 (ClickHouse Codecs): Compression codec selection with MergeTree
