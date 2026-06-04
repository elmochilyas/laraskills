# Projections vs Materialized Views

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 05-olap-modeling
- **Knowledge Unit:** projections-vs-materialized-views
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

ClickHouse offers three mechanisms for pre-computed data transformations: Projections (inline, table-scoped, synchronously maintained), Materialized Views TO (separate table, asynchronously maintained via trigger), and Refreshable Materialized Views (periodically rebuilt). Projections are newer, more integrated, and synchronously consistent; MVs are older, more flexible, but introduce write amplification and require manual management.

---

## Core Concepts

- **Projection:** Defines an alternative storage layout within the same table — data stored in both main table order and projection order — query optimizer selects the best projection automatically
- **Materialized View (TO):** Trigger-based mechanism inserting transformed data into a separate target table whenever data is inserted into source — has own storage, partition key, lifecycle
- **Refreshable Materialized View (2024+):** Periodically rebuilt view executing a SELECT and storing results — NOT triggered on INSERT — refreshed on schedule or manually
- **WAL-Backed Materialized View (2025+):** Reduces write amplification by 50%+ compared to trigger-based MVs — requires ClickHouse >= 24.8

---

## Mental Models

- **Projections as Footnotes:** A projection is like adding a footnote to a book page — it's part of the same page, updated when the page is written, and the reader automatically gets the right view. MVs are like creating a separate summary document — more flexible but you have to remember it exists and keep it updated.
- **Consistency Spectrum:** Projections are like a real-time dashboard — data is always consistent with the source. MVs are like a daily newspaper — may be a few hours behind but can include complex analysis. Refreshable MVs are like a weekly magazine — deep analysis but only updated periodically.

---

## Internal Mechanics

Projections are defined with `ALTER TABLE ... ADD PROJECTION`. During INSERT, data is written in both the main table's sort order and the projection's sort order. The query optimizer analyzes incoming queries and automatically selects the best projection. Materialized Views (TO) are defined with `CREATE MATERIALIZED VIEW ... TO target_table AS SELECT ...`. When data is inserted into the source table, the MV fires, executes the SELECT query on the inserted block, and writes results to the target table. MVs are block-level triggers — they process batches of rows, not individual rows.

---

## Patterns

- **Default to Projections:** For simple aggregation changes (different ORDER BY, pre-computed aggregates), use projections first — simpler, synchronously consistent, automatically utilized by optimizer
- **Use MVs for Complex Transformations:** Materialized views support JOINs, subqueries, complex WHERE logic that projections do not
- **One MV Chain Deep:** Avoid cascading MVs — each hop increases write amplification and introduces potential consistency issues — flatten MV chains where possible

---

## Architectural Decisions

Choose projections for simple alternative sort orders and pre-computed aggregates where consistency is critical. Choose MVs for complex transformations involving JOINs, subqueries, or when independent lifecycle is needed (different TTL, partition, codec). Choose refreshable MVs for periodic batch aggregations where real-time consistency is not required. Test that the query optimizer selects the expected projection using `EXPLAIN`.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Projections: zero maintenance, auto-used | Limited to simple reordering/aggregation | Cannot handle JOINs or subqueries |
| MVs: support complex transformations | 2-5x write amplification | Each MV adds target write per source insert |
| Refreshable MVs: zero write-time amplification | Scheduled delay in data freshness | Only for non-real-time use cases |
| WAL-backed MVs: 50% less amplification | Requires ClickHouse 24.8+ | Future-proof option for new deployments |

---

## Performance Considerations

Projections have zero maintenance overhead — synchronously maintained, no write amplification beyond projection storage. MVs have 2-5x write amplification — each MV adds a write to target table for every source INSERT. Refreshable MVs have no write amplification until refresh time — query performance during refresh may degrade. Projections add storage overhead — the projection structure duplicates the indexed columns.

---

## Production Considerations

Monitor MV lag for trigger-based MVs — compare `max(processed_time)` to current time, alert on lag exceeding thresholds. Avoid projections on high-insert volume tables (1M+ inserts/second) with 5+ projections — each insert writes to all projection structures. Do not create both a projection and an MV for the same transformation — storage consumed twice, optimizer may use wrong one.

---

## Common Mistakes

- **MV When Projection Sufficed:** Creating MV for a simple alternative ORDER BY — adds write amplification, requires separate lifecycle, optimizer cannot automatically use it. Better: use a projection for alternative sort orders.
- **Projection for Complex JOIN:** Projection including a subquery or JOIN — projections only support simple column reordering and aggregation. Better: use MVs for transformations involving multiple tables.
- **Cascading MV Chain:** MV1 → TableA → MV2 → TableB — an INSERT generates writes to source, TableA, and TableB — 3x write amplification. Better: consolidate into single MV if possible.

---

## Failure Modes

- **Projections on High-Volume Insert Tables:** 5 projections on a table receiving 1M+ inserts/second — insert throughput drops by 5x. Mitigation: limit projections on high-insert tables, use MVs with batching.
- **MVs Without Monitoring:** MVs created but background processing not monitored — MV falls behind, dashboards show stale data for hours. Mitigation: monitor MV lag, alert on thresholds.
- **Both Projections and MVs for Same Transformation:** Same aggregation computed twice — storage consumed twice, optimizer may not use correct one. Mitigation: choose one mechanism per transformation.

---

## Ecosystem Usage

Projections and MVs are configured at the ClickHouse schema level, not in Laravel application code. When using `laravel-clickhouse`, schema definitions can include projection definitions. MV target tables are defined as part of the ClickHouse schema. The choice between projections and MVs affects storage costs and data freshness for the analytics tables queried by Laravel applications.

---

## Related Knowledge Units

### Prerequisites
- ClickHouse MergeTree — Base engine for both projections and MVs
- ClickHouse Materialized Views — MV mechanism understanding

### Related Topics
- AggregatingMergeTree — Pre-aggregation using MVs + AMT
- Write Amplification — Impact of MV count on write amplification

### Advanced Follow-up Topics
- Projections vs Materialized Views — ClickHouse 2025+ WAL-backed MV advantages

---

## Research Notes

Projections were introduced in ClickHouse 21.6 and have become the preferred approach for simple pre-computations since they maintain synchronous consistency and are automatically used by the optimizer. Materialized Views remain necessary for complex transformations. The 2025 WAL-backed MV improvement is a significant development that addresses the main disadvantage of MVs — write amplification.
