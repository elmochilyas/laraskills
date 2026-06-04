# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 05-olap-modeling
**Knowledge Unit:** projections-vs-materialized-views
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Projections (inline, table-scoped, synchronous) vs Materialized Views (separate table, async trigger) distinguished
- [ ] Refreshable Materialized Views (periodic rebuild) understood for less time-sensitive use cases
- [ ] WAL-backed Materialized Views (2025+) understood for near-real-time consistency
- [ ] Consistency, maintenance, and storage tradeoffs evaluated per mechanism
- [ ] Projections preferred for single-table query optimization without separate table overhead
- [ ] MVs preferred when source data is spread across multiple tables (JOIN-based pre-computation)

---

# Architecture Checklist

- [ ] Projections chosen for simple single-table query acceleration (alternative ordering or aggregation)
- [ ] Materialized Views (TO) chosen when source data requires JOIN or complex transformation
- [ ] Refreshable MVs chosen for periodic rebuild use cases (hourly metrics, daily rollups)
- [ ] WAL-backed MVs chosen when near-real-time consistency is required
- [ ] Storage impact of each mechanism evaluated — projections store within table, MVs create separate table
- [ ] Codec implications considered — projection column codecs (K035) independent of base table

---

# Implementation Checklist

- [ ] Projection created with ALTER TABLE t ADD PROJECTION p AS SELECT ... ORDER BY ...
- [ ] Materialized View created with CREATE MATERIALIZED VIEW mv TO target AS SELECT ...
- [ ] Refreshable MV created with CREATE MATERIALIZED VIEW mv REFRESH EVERY 1 HOUR AS SELECT ...
- [ ] WAL-backed MV created with CREATE MATERIALIZED VIEW mv WAL_BASED AS SELECT ...
- [ ] Projection materialized with ALTER TABLE t MATERIALIZE PROJECTION p
- [ ] MV dependencies checked — base table exists, target table created with correct engine

---

# Performance Checklist

- [ ] Projection query acceleration verified with EXPLAIN — query uses projection instead of base table
- [ ] MV separate table overhead measured (storage, merge, insert amplification)
- [ ] Refreshable MV refresh cost measured against query savings
- [ ] Write amplification (K026) compared between projections and MVs
- [ ] Projection synchronous maintenance does not impact base table write throughput
- [ ] MV async trigger delay measured — time from insert to MV update

---

# Security Checklist

- [ ] MV target table permissions set independently of base table (read-only for dashboard)
- [ ] Projection inherits base table permissions — no independent access control
- [ ] Sensitive columns excluded from projection/MV SELECT to limit data exposure
- [ ] MV DDL operation permissions restricted to pipeline role
- [ ] WAL-based MV does not expose raw WAL data through query access

---

# Reliability Checklist

- [ ] Projection automatically maintained with base table writes — no separate process to monitor
- [ ] MV not updated if trigger fails — events stay in base table, MV rebuildable
- [ ] Refreshable MV stale data period defined by refresh interval
- [ ] WAL-backed MV lag monitored (time between WAL commit and MV reflect)
- [ ] Projection/MV rebuild procedure documented for schema changes

---

# Testing Checklist

- [ ] Test projection used by SELECT — EXPLAIN shows projection name in plan
- [ ] Test MV updated when base table row inserted
- [ ] Test Refreshable MV refreshes exactly on schedule
- [ ] Test WAL-backed MV shows near-real-time consistency
- [ ] Test projection/MV rebuild after schema change does not lose data
- [ ] Test query result parity between base table query and projection/MV query

---

# Maintainability Checklist

- [ ] Projection/MV creation DDL in version-controlled migration files
- [ ] Decision rationale (projection vs MV vs refreshable) documented per use case
- [ ] MV target table naming convention: mv_{source_table}_{purpose}
- [ ] Projection naming convention: proj_{table}_{ordered_columns}
- [ ] Refresh interval documented for Refreshable MVs with data staleness SLA

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use projections for multi-table queries — projections are single-table only
- [ ] Do not use MVs when projection suffices — MVs add separate table management overhead
- [ ] Do not forget to MATERIALIZE PROJECTION after CREATE — projection is not populated until materialized
- [ ] Do not use Refreshable MV for near-real-time dashboards — data is stale by refresh interval
- [ ] Do not mix projection and MV for same transformation — choose one

---

# Production Readiness Checklist

- [ ] Prometheus metrics for projection/MV query count, MV update lag, storage overhead
- [ ] Logged warning when MV update lag exceeds configured threshold
- [ ] Alert if projection MATERIALIZE fails or is not complete
- [ ] MV storage growth tracked against baseline
- [ ] Deploy checklist includes projection/MV DDL verification
- [ ] Staging test validates query plan uses projection/MV as expected

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: projection for single-table, MV for multi-table/transform, refresh interval for stale-ok
- [ ] Security requirements satisfied: MV independent permissions, sensitive column exclusion
- [ ] Performance requirements satisfied: EXPLAIN verification, write amplification measured, trigger delay quantified
- [ ] Testing requirements satisfied: query plan, MV correctness, refresh schedule, rebuild, result parity
- [ ] Anti-pattern checks passed: no projection on JOIN, no MV when projection suffices, projection materialized
- [ ] Production readiness verified: usage metrics, MV lag alerts, storage tracking, staging validation

---

# Related References

- K024 (AggregatingMergeTree): The primary target table type for TO MVs
- K016 (ClickHouse Materialized Views): Trigger-based MV mechanics in detail
- K026 (Write Amplification): MVs and projections are primary contributors
- K012 (ClickHouse MergeTree): Base engine understanding required for all three mechanisms
