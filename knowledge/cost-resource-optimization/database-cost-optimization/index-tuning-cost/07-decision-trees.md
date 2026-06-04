# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Index Tuning Cost
**Generated:** 2026-06-03

---

# Decision Inventory

1. Index Strategy Design
2. Unused Index Detection and Removal
3. Covering Index Decision

---

# Architecture-Level Decision Trees

---

## Decision Name: Index Strategy Design

---

## Decision Context

Design indexing strategy balancing read performance vs write overhead.

---

## Decision Criteria

performance, cost

---

## Decision Tree

Query pattern analysis done?

YES -> Index for actual patterns
NO -> Enable slow query log first

Column usage:
WHERE -> Must index
JOIN (foreign key) -> Must index
ORDER BY -> Index beneficial
Low cardinality (< 100) -> Composite only

Composite or single?
Single WHERE -> Single index
Multiple WHERE -> Composite (order by cardinality)
WHERE + ORDER BY -> Composite covering both

Write impact?
< 5 indexes/table -> Acceptable
5-10 -> Monitor write performance
> 10 -> Review and consolidate

---

## Rationale

Missing indexes cause full table scans on 1M+ rows. Each missing index adds 100ms+. But over-indexing slows writes 10-30% per index.

---

## Recommended Default

**Default:** Index all foreign keys and WHERE clauses; composite for multi-column filters; monitor unused indexes

---

## Risks Of Wrong Choice

No FK indexes = full table scans on every JOIN. Too many composites = write overhead kills INSERT/UPDATE performance.

---

## Related Rules

Rule: Follow standardized Index Tuning Cost practices

---

## Related Skills

Analyze and Optimize Index Tuning Cost

---

---

## Decision Name: Unused Index Detection and Removal

---

## Decision Context

Identify and remove unused indexes to reduce write overhead.

---

## Decision Criteria

performance, cost

---

## Decision Tree

Index usage stats checked?

MySQL: sys.schema_unused_indexes
PostgreSQL: pg_stat_user_indexes

Unused indexes found?
YES -> Review each for removal
NO -> Current strategy efficient

Before dropping:
Verify truly unused (30 days)
Drop during non-peak hours

After dropping:
Monitor slow query log 1 week
Re-add if regression appears

---

## Rationale

Each unused index on write-heavy table costs 1-5% write overhead. Dropping them is free performance improvement.

---

## Recommended Default

**Default:** Check for unused indexes quarterly; drop any not used in 30 days

---

## Risks Of Wrong Choice

Dropping seasonal index causes sudden query degradation.

---

## Related Rules

Rule: Follow standardized Index Tuning Cost practices

---

## Related Skills

Analyze and Optimize Index Tuning Cost

---

---

## Decision Name: Covering Index Decision

---

## Decision Context

Determine when to use covering indexes for hot queries.

---

## Decision Criteria

performance, storage

---

## Decision Tree

Query is high-traffic (> 1000 req/s)?

YES -> Covering index eliminates table access (90% I/O reduction)
NO -> Simple index sufficient

All columns includable?
YES -> Covering index possible
NO -> Include via INCLUDE (PG) or extend composite (MySQL)

Storage overhead OK?
YES -> Create covering index
NO -> Keep simple index

DB engine difference?
PostgreSQL -> INCLUDE keeps index smaller
MySQL -> All columns in B-Tree (larger)

---

## Rationale

Covering index stores all query columns, allowing query from index pages only. For hot queries, reduces I/O by 90%.

---

## Recommended Default

**Default:** Covering indexes for hot queries (>1000 req/s); simple indexes for lower traffic

---

## Risks Of Wrong Choice

Adding covering indexes to every query = excessive storage and write overhead.

---

## Related Rules

Rule: Follow standardized Index Tuning Cost practices

---

## Related Skills

Analyze and Optimize Index Tuning Cost

---

