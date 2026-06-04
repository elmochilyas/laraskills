# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Query Optimization & Profiling
**Knowledge Unit:** 4-5 MySQL Slow Query Log
**Generated:** 2026-06-03

---

# Decision Inventory

* Slow query log configuration vs performance schema
* long_query_time threshold tuning
* Log analysis and alerting strategy

---

# Architecture-Level Decision Trees

---

## Slow Query Monitoring Strategy

---

## Decision Context

Configuring MySQL slow query log to identify queries exceeding performance thresholds without overwhelming disk/log systems.

---

## Decision Criteria

* performance: logging adds minimal I/O overhead
* architectural: threshold must match workload profile
* maintainability: log rotation prevents disk exhaustion
* security: queries in logs may contain PII

---

## Decision Tree

Enabling MySQL slow query log?
↓
Set long_query_time based on workload:
→ OLTP (< 100ms expected) → Set to 200-500ms
→ Analytics/reporting → Set to 1-5s
→ Start conservative, lower as baseline improves
↓
Log destinations:
→ FILE: traditional, requires rotation
→ TABLE (mysql.slow_log): queryable via SQL
→ Performance schema: most flexible, least overhead
↓
Analysis tools:
→ pt-query-digest: aggregates and ranks slow queries
→ mysqldumpslow: basic summary
→ Performance schema: real-time monitoring

---

## Recommended Default

**Default:** log_slow_queries = 1, long_query_time = 0.5, pt-query-digest for analysis
**Reason:** 500ms catches meaningful slow queries without noise. pt-query-digest provides ranked analysis.
