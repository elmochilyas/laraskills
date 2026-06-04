# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Profiling and Observability
**Knowledge Unit:** Slow Query Identification (SQL)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Slow query detection approach | Performance | Diagnose |
| 2 | Query optimization strategy | Performance | Optimize |

---

# Architecture-Level Decision Trees

---

## Decision: Slow Query Detection

---

## Decision Context

Slow database queries are a common performance bottleneck. Detection via MySQL slow query log, application profiling, or database monitoring tools.

---

## Decision Criteria

* **performance** — slow queries add latency for all requests using them
* **operations** — slow query log must be enabled with appropriate threshold
* **maintainability** — query optimization reduces DB load

---

## Decision Tree

Is the MySQL slow query log enabled?
↓
**YES** — Set long_query_time = 0.5s. Logs queries >500ms.
**NO** — Enable it. This is the primary detection method.

---

Is the slow query visible in application profiling (flame graph)?
↓
**YES** — Cross-reference with slow query log. Identify which endpoint triggers it.
**NO** — Slow query log alone may not identify the endpoint.

---

Does the query lack appropriate indexes?
↓
**YES (EXPLAIN shows full table scan)** — Add index. Check cardinality.
**NO** — Query structure may need optimization (N+1, joins, subqueries).

---

Is it an N+1 query pattern?
↓
**YES** — Eager load (Laravel: `with()`) or batch query.
**NO** — Single query optimization.

---

Is the query executed in a loop?
↓
**YES** — Move outside loop or batch into single query.
**NO** — Standard query.

---

## Recommended Default

**Default:** Enable MySQL slow query log at 0.5s. Cross-reference with application profiling to find endpoint.
**Reason:** Comprehensive detection with minimal overhead.

---

## Risks Of Wrong Choice

* No slow query log: performance issues invisible
* Too low threshold: log spam
* Too high threshold: misses real problems

---

## Related Skills

* Slow Query Identification (SQL)
