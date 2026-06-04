# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** write-amplification
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Write amplification factor measured per table (total rows written / raw event rows)
- [ ] MV target writes (K016) identified as primary amplification source
- [ ] Projection writes (K031) quantified as additional amplification contributor
- [ ] Replication writes (cross-node copy) factor determined
- [ ] Merge amplification from background merges understood
- [ ] AggregatingMergeTree (K024) evaluated to reduce amplification via compressed states

---

# Architecture Checklist

- [ ] Amplification budget set per pipeline (max acceptable WA factor)
- [ ] Cascading MV chain limited to N levels to control amplification
- [ ] Projections preferred over MVs where syntax allows (inline, no separate table)
- [ ] AggregatingMergeTree target stores compressed state (lower amplification than raw rows)
- [ ] Insert-block granularity tuned (larger blocks = fewer writes per MB of data)
- [ ] Codecs (K035) applied to mitigate storage amplification component

---

# Implementation Checklist

- [ ] Amplification factor query: system.query_log bytes_written vs source bytes_ingested
- [ ] MV list with amplification factor per MV annotated in ClickHouse dashboard
- [ ] Cascading MV count documented per pipeline (max depth)
- [ ] Projection list with storage impact (bytes per projection)
- [ ] Insert block size set via max_block_size in SETTINGS
- [ ] Replication factor of 2 minimum — amplification factor includes replica count

---

# Performance Checklist

- [ ] Amplification factor = total disk writes / raw data bytes (target: < 5x for simple pipelines)
- [ ] MV amplification measured per MV in chain (1:1, 1:2, 1:N)
- [ ] Projection amplification measured as additional bytes per insert
- [ ] Merge amplification measured as temporary write during part merging
- [ ] Insert throughput degradation measured as amplification increases
- [ ] Disk I/O pressure correlated to amplification factor

---

# Security Checklist

- [ ] Amplified writes (MV targets, projections) inherit base table security model
- [ ] Storage cost allocation based on amplification factor per source table
- [ ] Amplification metrics included in cost report for chargeback
- [ ] Replica encryption at rest accounted for in amplification storage budget

---

# Reliability Checklist

- [ ] Write amplification does not cause disk full — storage growth projected
- [ ] Insert queue backlog monitored — high amplification reduces insert throughput
- [ ] Merge pressure monitored — too many parts from high amplification
- [ ] Disk I/O saturation detected before amplification causes slow inserts
- [ ] Replication amplification monitored — high replica count multiplies writes

---

# Testing Checklist

- [ ] Test amplification factor with 1M row insert — measure bytes_written in query_log
- [ ] Test MV amplification: 1 MV = 2x writes, 2 cascading MVs = 3x+ writes
- [ ] Test projection amplification: same insert with and without projection
- [ ] Test replication amplification: 2 vs 3 replicas on same workload
- [ ] Test merge amplification over 24h window (steady-state vs bulk insert)
- [ ] Test AggregatingMergeTree amplification vs raw MergeTree for same aggregation

---

# Maintainability Checklist

- [ ] Amplification factor documented per table in data catalog
- [ ] MV chain depth documented with amplification factor per hop
- [ ] Amplification budget reviewed quarterly as data volume grows
- [ ] Disk I/O and storage cost reports include amplification factor
- [ ] Codec selection documented with mitigation impact on storage amplification

---

# Anti-Pattern Prevention Checklist

- [ ] Do not cascade MVs deeper than necessary — each level adds amplification
- [ ] Do not create projections on every column — amplification grows with projection count
- [ ] Do not ignore replication amplification — 3 replicas = 3x write amplification
- [ ] Do not use high-codec ratio columns as amplification multiplier — use AggregatingMergeTree
- [ ] Do not skip insert block size tuning — small blocks increase amplification

---

# Production Readiness Checklist

- [ ] Prometheus metrics for write amplification factor per table, per MV
- [ ] Logged warning when amplification factor exceeds 10x for any table
- [ ] Alert when disk write IOPS exceeds threshold due to amplification
- [ ] Storage growth projection based on amplification factor
- [ ] Deploy checklist includes amplification impact assessment for new MVs/projections
- [ ] Staging amplification benchmark before adding new MV or projection to production

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: amplification budget, cascading limit, AMT compression, codec mitigation
- [ ] Security requirements satisfied: inherited permissions, cost allocation, replica encryption
- [ ] Performance requirements satisfied: factor target under 5x, per-MV measurement, merge monitoring, I/O pressure
- [ ] Testing requirements satisfied: 1M row benchmark, MV/projection/replication/merge amplification
- [ ] Anti-pattern checks passed: limited MV cascade, selective projections, replica awareness, block size tuning
- [ ] Production readiness verified: amplification metrics, factor alerts, disk I/O monitoring, staging benchmark

---

# Related References

- K016 (ClickHouse Materialized Views): The primary amplification source
- K031 (Projections vs MVs): Understanding projections as amplification contributors
- K012 (ClickHouse MergeTree): Base engine amplification patterns
- K024 (AggregatingMergeTree): MV target that reduces amplification by storing compressed states
- K035 (ClickHouse Codecs): Compression codecs that mitigate storage amplification
