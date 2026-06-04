# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Query Optimization Cost
**Generated:** 2026-06-03

---

# Decision Inventory

1. N+1 Query Detection and Fix
2. Slow Query Resolution Process
3. SELECT Optimization Strategy

---

# Architecture-Level Decision Trees

---

## Decision Name: N+1 Query Detection and Fix

---

## Decision Context

Identify and fix N+1 query problems in Eloquent.

---

## Decision Criteria

performance, cost

---

## Decision Tree

Query count checked per page?

YES -> Target < 10 queries
NO -> Enable Debugbar or Telescope

N+1 detected?
YES -> Add eager loading with with()
NO -> Profile next bottleneck

Deep nested relations?
YES -> Nested with() or lazy eager loading
NO -> Simple with() solves it

API resource optimization?
Load only requested relationships
Use whenLoaded() conditionally

---

## Rationale

N+1 with 50 parents + 5 children = 51 queries vs 2 queries. At 100 req/s, eliminating 49 queries/req removes 4,900 unnecessary queries/sec.

---

## Recommended Default

**Default:** Eager load all relationships in loops; check query count in dev; target < 10 queries/page

---

## Risks Of Wrong Choice

N+1 in production = database CPU at 80%+ for what should be 2-3 queries.

---

## Related Rules

Rule: Follow standardized Query Optimization Cost practices

---

## Related Skills

Analyze and Optimize Query Optimization Cost

---

---

## Decision Name: Slow Query Resolution Process

---

## Decision Context

Identify and resolve slow queries using monitoring and EXPLAIN.

---

## Decision Criteria

performance, cost

---

## Decision Tree

Slow query log enabled?

YES -> Threshold: > 500ms
NO -> Enable immediately

EXPLAIN shows:
Full table scan -> Add index
Temporary table -> Rewrite query (avoid subqueries)
Filesort -> Add index on ORDER BY

Query rewrites:
SELECT * -> Select only needed columns
WHERE FUNCTION(col) -> Sargable expression
Subquery -> JOIN or EXISTS

Post-fix:
Re-check EXPLAIN
Verify time < 100ms
Deploy and monitor

---

## Rationale

Queries >500ms are the 1% causing 90% of DB load. Fixing each can reduce database CPU by 20-50%.

---

## Recommended Default

**Default:** Enable slow query log at 500ms; EXPLAIN all slow queries; fix full table scans first

---

## Risks Of Wrong Choice

Not monitoring slow queries = CPU steadily increases until performance crisis.

---

## Related Rules

Rule: Follow standardized Query Optimization Cost practices

---

## Related Skills

Analyze and Optimize Query Optimization Cost

---

---

## Decision Name: SELECT Optimization Strategy

---

## Decision Context

Optimize SELECT to minimize data transfer and processing.

---

## Decision Criteria

performance, cost

---

## Decision Tree

SELECT * used?

YES -> Replace with specific column list
NO -> Good practice

Large dataset processing?
YES -> Use chunk() instead of all()/get()
NO -> Standard pagination fine

Pagination method?
Cursor pagination for large datasets
Standard offset for small/medium

Repeated queries?
YES -> Cache with appropriate TTL
NO -> Monitor for repeated patterns

---

## Rationale

SELECT * on 50-column table where 3 are needed = 94% data waste. Multiplies I/O, network, memory by 10x.

---

## Recommended Default

**Default:** Always specify columns; chunk() for large datasets; cursor pagination for large result sets

---

## Risks Of Wrong Choice

SELECT * on large tables causes 10x data transfer, 5x memory usage.

---

## Related Rules

Rule: Follow standardized Query Optimization Cost practices

---

## Related Skills

Analyze and Optimize Query Optimization Cost

---

