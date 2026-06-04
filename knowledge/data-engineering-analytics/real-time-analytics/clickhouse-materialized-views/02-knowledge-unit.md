# ClickHouse Materialized Views

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 06-real-time-analytics
- **Knowledge Unit:** clickhouse-materialized-views
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

ClickHouse materialized views are trigger-based data transformation pipelines, not traditional SQL views — a `TO` materialized view captures data blocks as they're inserted into a source MergeTree table, applies a transformation query, and writes results to a separate target table. This enables real-time ETL where raw event data is automatically aggregated, filtered, or transformed into analytics-optimized tables at insert time without batch jobs.

---

## Core Concepts

- **TO Materialized View:** Writes transformed data to a specified target table defined with `TO db.table` — target table must be created before the MV — MV blocks until target table receives the data
- **POPULATE Clause:** Optional clause processing existing source data when creating MV — use only for development — POPULATE can miss concurrently inserted data — production MVs should be created empty and backfilled separately
- **Block-Level Triggers:** MVs fire on block insertion, not row insertion — when a batch of rows (typically 65K+) is inserted, the MV processes the entire block — efficient for bulk loads but very small inserts (< 10 rows) may not trigger immediately
- **Transform-on-Write:** MVs transform data at write time, not query time — key performance advantage — query-time aggregation overhead eliminated because the work is done during ingestion

---

## Mental Models

- **MV as Automated Factory Worker:** An MV is like a factory worker stationed at the end of a conveyor belt. When a box of raw materials arrives (INSERT block), the worker immediately processes it (transforms) and places the finished product on a different shelf (target table). The work happens as materials arrive, not when someone asks for the finished product.
- **Trigger vs Query-Time:** Think of an MV as a standing order at a coffee shop — every time a new batch of beans arrives (data inserted), the barista grinds them (transforms) and has them ready for brewing (querying). Without an MV, you'd grind beans fresh for every cup ordered.

---

## Internal Mechanics

When data is inserted into a source MergeTree table, ClickHouse fires all materialized views defined on that table. The MV executes its SELECT query on the newly inserted data block (not the entire table) and writes the result to the target table. The target table can have a different structure, partition key, and ORDER BY from the source. The MV blocks until the target table confirms the write — slow MV queries delay the source INSERT. MVs are processed synchronously in the same insert transaction, ensuring consistency.

---

## Patterns

- **Create Target Table First:** Always create the target table with explicit schema, partition key, ORDER BY, and codecs before creating the MV — target table should be optimized for its access pattern, not the source table's
- **One MV Chain Deep:** Avoid cascading MVs (MV1 → TableB → MV2 → TableC) — each hop doubles write amplification — flatten chains where possible
- **Monitor MV Target Part Count:** Each MV insert creates a new part in the target table — if MVs are triggered at high frequency, target tables accumulate parts faster than merges can process

---

## Architectural Decisions

Use MVs for real-time data rollups, filtering (exclude bot traffic), column renaming/typing, and pre-computing JOIN results. Do not use for query-time transformations that change frequently (use standard VIEW). Do not use for simple alternative sort orders (use projections). Do not use POPULATE in production — create MVs empty and backfill separately. Design target table ORDER BY based on how it will be queried, not on source table structure.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Real-time transform-on-write | Write amplification: 1x per MV | Each MV adds target write per source insert |
| Eliminates query-time aggregation | Block-level triggers: small inserts may delay | Ensure batch sizes align with trigger granularity |
| Supports filtering, aggregation, renaming | MV SELECT query runs synchronously with INSERT | Slow MV queries delay source inserts |
| One MV chain = multiple views of same data | Cascading MVs multiply amplification | Flatten chains, use refreshable MVs for non-real-time |

---

## Performance Considerations

Write amplification: each MV adds 1 write to target table per source insert. Block-level triggers process at block granularity. MV SELECT query performance matters — the MV's query runs synchronously with the source INSERT. Slow MV queries delay inserts. Cascading MVs create 3x write amplification for 3-chain.

---

## Production Considerations

Never use POPULATE in production — the MV processes existing data but misses data inserted during POPULATE. Backfill historical data separately. Use `EXPLAIN` to verify the MV's SELECT query is efficient. Monitor target table part counts — high-frequency MV triggers create many small parts. Consider WAL-backed MVs (ClickHouse 24.8+) to reduce write amplification by 50%+.

---

## Common Mistakes

- **POPULATE in Production:** Using POPULATE when creating an MV in production — processes existing data but misses data inserted during POPULATE. Better: create MV without POPULATE, backfill historical data separately.
- **MV Without Target Table Indexing:** Target table uses source table's ORDER BY but is queried with different WHERE clauses — queries against target are slow. Better: design target table ORDER BY based on query patterns.
- **Cascading MVs Without Need:** MV1 → AggTable, AggTable has MV2 → DailyAgg — 2x write amplification on every insert when DailyAgg could be a refreshable MV. Better: use refreshable MV for non-real-time aggregations.

---

## Failure Modes

- **MV Block Level Misses Small Inserts:** Very small inserts (< 10 rows) may not trigger MV immediately — data in target table lags behind source. Mitigation: batch small inserts together.
- **Part Explosion from High-Frequency MVs:** Many small inserts trigger MV each time — target table accumulates parts faster than merges can process. Mitigation: batch inserts, monitor part count.
- **MV Query Performance Degradation:** Complex MV SELECT query becomes slow as source data grows — blocks inserts. Mitigation: simplify MV query, ensure proper indexing.

---

## Ecosystem Usage

ClickHouse MVs are defined at the database schema level, not in Laravel code. However, the `laravel-clickhouse` schema builder can create MV definitions. The MV target tables are queried by Laravel applications through dashboard widget providers or Eloquent models. The ETL Manifesto and dbt can define ClickHouse schemas that include MV definitions.

---

## Related Knowledge Units

### Prerequisites
- ClickHouse MergeTree — Base engine for MV source and target tables

### Related Topics
- AggregatingMergeTree — MV + AMT pattern for pre-aggregation
- Write Amplification — Impact of MV count on write amplification

### Advanced Follow-up Topics
- Projections vs Materialized Views — Alternative pre-computation approaches
- CDC Sub-Second Replication — Feeding real-time data into MVs

---

## Research Notes

ClickHouse materialized views are fundamentally different from traditional SQL views — they are data transformation pipelines, not query shortcuts. The trigger-based architecture means they process data at insertion speed, making them ideal for real-time analytics. The key operational insight is monitoring target table part counts — high-frequency MV triggers can cause part explosion that degrades merge performance.
