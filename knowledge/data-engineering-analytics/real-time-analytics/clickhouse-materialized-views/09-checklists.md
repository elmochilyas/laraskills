# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** clickhouse-materialized-views
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] TO (target) Materialized View trigger model understood — block-level, not row-level
- [ ] Source table (MergeTree) and target table (MergeTree or AggregatingMergeTree) created
- [ ] MV transform query written (aggregation, filtering, column selection)
- [ ] POPULATE clause understood — catches only new data, not existing rows
- [ ] Cascading MVs evaluated for multi-step transformation pipelines
- [ ] Write amplification (K026) impact of MVs quantified

---

# Architecture Checklist

- [ ] MV triggered on INSERT to source table — transforms and writes to target table
- [ ] Target table engine chosen based on use case: MergeTree for filtered copy, AggregatingMergeTree for pre-aggregation (K024)
- [ ] Block-level trigger means MV processes data in blocks (max_block_size rows), not row-by-row
- [ ] POPULATE does not backfill existing data — run separate backfill for historical data
- [ ] Cascading MV chain designed with write amplification budget per hop
- [ ] Kafka CDC (K017) feeds source table — MV processes CDC stream in real-time

---

# Implementation Checklist

- [ ] CREATE MATERIALIZED VIEW mv_name TO target_table AS SELECT ... FROM source_table
- [ ] Target table DDL created with correct schema matching MV SELECT output
- [ ] Source table populated — MV fires automatically on each INSERT block
- [ ] POPULATE used only for development — production uses backfill from source
- [ ] Cascading MV: MV1 writes to table1, MV2 writes to table2 from table1 inserts
- [ ] MV query idempotent — re-inserting same block produces same target result

---

# Performance Checklist

- [ ] MV block-level trigger overhead measured (p99 insert time with/without MV)
- [ ] Write amplification ratio calculated: 1 source insert = N MV writes
- [ ] Target table ORDER BY optimized for MV query access pattern
- [ ] MV query does not full-scan source — uses insert-time data block
- [ ] Cascading MV write amplification budget documented and monitored
- [ ] MV target table merge behavior monitored for part count growth

---

# Security Checklist

- [ ] MV target table permissions set independently of source table
- [ ] Sensitive columns excluded from MV SELECT to limit data exposure
- [ ] MV cannot be used to bypass source table row-level security
- [ ] MV DDL operations restricted to pipeline role
- [ ] Target table access logged — who queries aggregated data

---

# Reliability Checklist

- [ ] MV not updated if source INSERT fails — atomic rollback
- [ ] MV backlog measured if source insert rate > MV processing rate
- [ ] MV dropped and re-created without data loss (target table retained)
- [ ] Backfill procedure: restore source data, recreate MV, catch up
- [ ] Cascading MV failure stops at affected hop — upstream MVs continue

---

# Testing Checklist

- [ ] Test MV transforms source data correctly — target table matches expected output
- [ ] Test MV with POPULATE inserts only new data after creation
- [ ] Test backfill — insert into source, verify MV target updated
- [ ] Test MV with AggregatingMergeTree target — State/Merge functions correct (K024)
- [ ] Test cascading MV chain — insert upstream, verify all downstream MVs updated
- [ ] Test MV drop/re-create preserves target table data

---

# Maintainability Checklist

- [ ] MV DDL in version-controlled migration files
- [ ] MV purpose documented in project wiki (what transformation, why, alternatives)
- [ ] Target table naming: mv_{source_table}_{purpose}
- [ ] Cascading MV chain documented as a diagram
- [ ] Write amplification budget per MV recorded

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use MV for single-table filtered copy when Projection suffices (K031)
- [ ] Do not POPULATE in production — run backfill separately
- [ ] Do not rely on MV for row-level transformations — MV is block-level
- [ ] Do not cascade MVs without write amplification budget
- [ ] Do not create MV on JOIN source without testing impact on insert throughput

---

# Production Readiness Checklist

- [ ] Prometheus metrics for MV insert latency (source insert to MV write)
- [ ] Logged warning when MV write amplification exceeds expected ratio
- [ ] Alert if MV not processing inserts (source insert rate > 0 but MV target rows = 0)
- [ ] MV backlog monitored — compare source insert rate to MV processing rate
- [ ] Deploy checklist includes MV DDL verification and backfill plan
- [ ] Staging MVs load-tested with production-scale insert rate

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: TO MV pattern, target engine choice, block-level awareness, POPULATE understanding
- [ ] Security requirements satisfied: target table independent permissions, sensitive column exclusion
- [ ] Performance requirements satisfied: insert overhead measured, write amplification ratio, optimized ORDER BY
- [ ] Testing requirements satisfied: transformation correctness, POPULATE behavior, backfill, cascading MVs, drop/recreate
- [ ] Anti-pattern checks passed: projection evaluation, no POPULATE in production, block-level awareness
- [ ] Production readiness verified: insert latency metrics, write amplification alerts, MV processing health, load test

---

# Related References

- K024 (AggregatingMergeTree): Commonly used as MV target for state-based aggregation
- K026 (Write Amplification): MVs are the primary source of write amplification
- K031 (Projections vs MVs): Alternative to MVs for certain pre-aggregation patterns
- K017 (Kafka CDC): Kafka feeds raw event tables that MVs consume
- K021 (OHLCV Candle Upsert): Real-time aggregation pattern using upsert instead of MVs
