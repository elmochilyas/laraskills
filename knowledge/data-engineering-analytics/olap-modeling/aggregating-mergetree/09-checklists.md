# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 05-olap-modeling
**Knowledge Unit:** aggregating-mergetree
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] AggregatingMergeTree engine pre-aggregation at insert time understood
- [ ] State combinator pattern for intermediate aggregation states understood
- [ ] Merge combinator for final value extraction during SELECT understood
- [ ] Materialized View + AggregatingMergeTree pattern configured for incremental aggregation
- [ ] Idempotent merges confirmed — no data loss or duplicate counting during merge
- [ ] Base MergeTree engine (K012) knowledge applied for ORDER BY and PARTITION BY

---

# Architecture Checklist

- [ ] AggregatingMergeTree table fed by Materialized View (K016) on source MergeTree table
- [ ] Source table uses MergeTree, aggregation target uses AggregatingMergeTree
- [ ] State combinator functions (countState, sumState, uniqState) used in MV SELECT
- [ ] Merge combinator functions (countMerge, sumMerge, uniqMerge) used in dashboard queries
- [ ] ORDER BY of AMT matches GROUP BY columns of aggregation query
- [ ] Projections evaluated as alternative to MV + AMT for simpler use cases (K031)

---

# Implementation Checklist

- [ ] CREATE TABLE ... ENGINE = AggregatingMergeTree() with ORDER BY on GROUP BY columns
- [ ] Materialized View created with TO target_table SELECT ... State(agg_function)
- [ ] Source table populated with raw events — MV transforms into AMT automatically
- [ ] Dashboard queries use SELECT col, countMerge(counter), sumMerge(total) FROM amt GROUP BY col
- [ ] AMT ORDER BY set to GROUP BY key columns for efficient merge
- [ ] Codec selection (K035) tuned for AMT at reduced granularity (fewer rows, more columns)

---

# Performance Checklist

- [ ] AMT query returns results instantly (pre-aggregated at insert time)
- [ ] AMT row count = distinct GROUP BY combinations vs source table row count
- [ ] Merge combinator functions not computing on-the-fly — merging pre-computed states
- [ ] Background merge of AMT parts does not block SELECT
- [ ] Write amplification (K026) from AMT merges measured and acceptable
- [ ] INSERT throughput into source table not throttled by AMT conversion

---

# Security Checklist

- [ ] AMT tables queried by dashboard, not raw event table — limits data exposure
- [ ] Access to raw event table (source of MV) restricted to ETL pipeline only
- [ ] AMT SELECT permissions granted to read-only dashboard role
- [ ] State columns not directly queryable without Merge combinator — protects raw state
- [ ] AMT table schema does not expose individual event PII

---

# Reliability Checklist

- [ ] AMT merge idempotent — re-merging same parts produces same result
- [ ] MV feed failure does not lose data — events remain in source table for replay
- [ ] AMT rebuildable from source table by dropping and re-creating MV
- [ ] Merge combinator with inaccurate state returns warning, not crash
- [ ] AMT table optimized periodically (OPTIMIZE TABLE FINAL) after bulk inserts

---

# Testing Checklist

- [ ] Test AMT returns correct aggregate values matching raw table query
- [ ] Test State combinator produces correct intermediate state for each function
- [ ] Test Merge combinator extracts correct final value from state
- [ ] Test MV + AMT pipeline — insert raw event, verify AMT updated
- [ ] Test AMT rebuild from source table (drop MV, recreate, catch up)
- [ ] Test concurrent inserts into source do not corrupt AMT state

---

# Maintainability Checklist

- [ ] MV + AMT DDL in version-controlled migration files
- [ ] State/Merge combinator selection documented per aggregate function
- [ ] AMT ORDER BY key documented and aligned with dashboard GROUP BY patterns
- [ ] Rebuild procedure for AMT documented in runbook
- [ ] Write amplification budget documented per AMT table

---

# Anti-Pattern Prevention Checklist

- [ ] Do not query AMT without Merge combinator — raw state columns are binary
- [ ] Do not use AMT without MV — AMT must be fed by MV or INSERT with State values
- [ ] Do not set ORDER BY that does not match GROUP BY — merge produces wrong results
- [ ] Do not skip OPTIMIZE TABLE after bulk load — query may read unmerged parts
- [ ] Do not use AMT for tables that need row-level access — AMT stores aggregates

---

# Production Readiness Checklist

- [ ] Prometheus metrics for AMT query latency, merge queue, parts count
- [ ] Logged warning when AMT merge backlog exceeds threshold
- [ ] Alert if AMT query returns zero rows (MV may not be feeding)
- [ ] AMT part count monitored to detect merge stalls
- [ ] Deploy checklist includes MV + AMT DDL verification
- [ ] Staging validation: insert raw data, confirm AMT aggregates match

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: MV feeding AMT, State/Merge combinator pattern, ORDER BY alignment
- [ ] Security requirements satisfied: AMT query-only access, raw table restricted, PII not exposed
- [ ] Performance requirements satisfied: instant query results, reduced row count, non-blocking merges
- [ ] Testing requirements satisfied: aggregate accuracy, State/Merge correctness, MV pipeline, concurrency
- [ ] Anti-pattern checks passed: Merge combinator used, MV present, ORDER BY matches GROUP BY
- [ ] Production readiness verified: AMT metrics, merge backlog alerts, part count, staging validation

---

# Related References

- K016 (ClickHouse Materialized Views): The MV mechanism that feeds AggregatingMergeTree tables
- K026 (Write Amplification): AMT background merges contribute to write amplification in MV chains
- K031 (Projections vs MVs): Projections as an alternative to MVs + AMT for pre-aggregation
- K012 (ClickHouse MergeTree): Base engine that AMT extends
