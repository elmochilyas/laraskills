# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 05-olap-modeling
**Knowledge Unit:** projections-vs-materialized-views
**Difficulty:** Intermediate
**Category:** ClickHouse Optimization
**Last Updated:** 2026-06-03

---

# Overview

ClickHouse offers three mechanisms for pre-computed data transformations: **Projections** (inline, table-scoped, synchronously maintained), **Materialized Views (TO)** (separate table, asynchronously maintained via trigger), and **Refreshable Materialized Views** (periodically rebuilt from SELECT query). Each solves a similar problem — reduce query time by pre-computing aggregations or transformations — with fundamentally different consistency, maintenance, and storage tradeoffs.

Projections are the newer, more integrated approach: they live inside the source table, are maintained synchronously during INSERT, and are automatically used by the query optimizer. Materialized Views are older, more flexible, but require manual management and introduce write amplification.

Engineers must care because choosing wrong between projections and materialized views directly impacts query performance, data consistency, and operational complexity.

---

# Core Concepts

## Projection

A projection defines an alternative storage layout for data within the same table. Defined with `ALTER TABLE ... ADD PROJECTION`. Data is stored in both the main table order and the projection order. The query optimizer selects the best projection automatically.

## Materialized View (TO)

A trigger-based mechanism that inserts transformed data into a separate target table whenever data is inserted into the source table. The target table has its own storage, partition key, and lifecycle.

## Refreshable Materialized View (2024+)

A periodically rebuilt view that executes a SELECT query and stores results in a table. NOT triggered on INSERT. Refreshed on a schedule or manually.

## WAL-Backed Materialized View (2025+)

Newer ClickHouse versions support WAL-backed MVs that reduce write amplification by 50%+ compared to trigger-based MVs. Requires ClickHouse >= 24.8.

---

# When To Use

- **Projections:** Simple aggregation changes (different ORDER BY, pre-computed aggregates). When consistency between source and pre-computed data is critical. When operational simplicity is valued.
- **Materialized Views:** Complex transformations (multiple source tables, JOINs). When independent lifecycle for pre-computed data is needed (different TTL, partition, codec). When the transformation logic is complex.
- **Refreshable MVs:** Periodic batch aggregations. When real-time consistency is not required. For daily summary tables.

---

# When NOT To Use

- **Projections:** Complex transformations requiring JOINs or subqueries. Very wide tables (projections double storage for the projection structure). Tables with high insert frequency and many projections.
- **Materialized Views:** Simple aggregation changes that projections can handle. Tables where write amplification is a critical concern.
- **Refreshable MVs:** Real-time dashboards requiring sub-second fresh data.

---

# Best Practices

## Default to Projections

For simple aggregation changes (different ORDER BY, pre-computed aggregates), use projections first. They are simpler, synchronously consistent, and automatically utilized by the optimizer.

## Use MVs for Complex Transformations

Materialized views support JOINs, subqueries, and complex WHERE logic that projections do not. If the transformation is more than a simple reordering or aggregation, use MVs.

## One MV Chain Deep

Avoid cascading MVs (MV writing to a table that triggers another MV). Each hop increases write amplification and introduces potential consistency issues. Flatten MV chains where possible.

## Test Query Optimizer Projection Selection

Use `EXPLAIN` to verify that the query optimizer selects the expected projection. If the optimizer chooses a full table scan instead of the projection, adjust the query or projection definition.

---

# Performance Considerations

- Projections: zero maintenance overhead (synchronously maintained). No write amplification beyond the projection storage.
- MVs: 2-5x write amplification. Each MV adds a write to the target table for every source INSERT.
- Refreshable MVs: no write amplification until refresh time. Query performance during refresh may degrade.
- Projections add storage overhead: the projection structure duplicates the indexed columns.

---

# Common Mistakes

## Mistake: MV When Projection Sufficed

Creating a materialized view for a simple alternative ORDER BY. The MV adds write amplification, requires separate lifecycle management, and the optimizer cannot automatically use it.

**Better approach:** Use a projection for alternative sort orders. It's maintained automatically and used by the optimizer.

## Mistake: Projection for Complex JOIN

Defining a projection that includes a subquery or JOIN. Projections only support simple column reordering and aggregation. The projection creation fails or produces incorrect results.

**Better approach:** Use materialized views for transformations involving multiple tables.

## Mistake: Cascading MV Chain

MV1 writes to TableA, which has MV2 that writes to TableB. An INSERT to the source generates writes to the source, TableA (via MV1), and TableB (via MV2). 3x write amplification.

**Better approach:** Consolidate. If possible, create a single MV that writes the final result directly.

---

# Anti-Patterns

## Projections on High-Volume Insert Tables
A table receiving 1M+ inserts/second with 5 projections. Each insert writes to all 5 projection structures. Write throughput drops by 5x.

**Solution:** Limit projections on high-insert tables. Use MVs with appropriate batching for high-throughput scenarios.

## MVs Without Monitoring
Materialized views are created but their background processing is not monitored. An MV falls behind, and dashboard queries show stale data. No one notices for hours.

**Solution:** Monitor MV lag: compare `max(processed_time)` to current time. Alert on lag exceeding acceptable thresholds.

## Both Projections and MVs for the Same Transformation
A projection and a materialized view both compute the same aggregation. Storage is consumed twice. Query optimizer may not use the correct one.

**Solution:** Choose one mechanism per transformation. Default to projections for simplicity, MVs for complexity.
