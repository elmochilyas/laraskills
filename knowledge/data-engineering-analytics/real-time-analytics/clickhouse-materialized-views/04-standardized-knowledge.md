# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** clickhouse-materialized-views
**Difficulty:** Intermediate
**Category:** ClickHouse Transformation
**Last Updated:** 2026-06-03

---

# Overview

ClickHouse materialized views are trigger-based data transformation pipelines, not traditional SQL views. A `TO` materialized view captures data blocks as they're inserted into a source table (MergeTree), applies a transformation query, and writes the results to a separate target table. This enables real-time ETL: raw event data is automatically aggregated, filtered, or transformed into analytics-optimized tables at insert time without batch jobs.

Engineers must care because ClickHouse MVs are the backbone of real-time analytics. They transform data at ingestion speed, making pre-aggregated data available for queries milliseconds after raw data arrives. Understanding their trigger mechanics, consistency guarantees, and write amplification impact is essential.

---

# Core Concepts

## TO Materialized View

A materialized view that writes transformed data to a specified target table. Defined with `TO db.table`. The target table must be created before the MV. The MV blocks until the target table receives the data.

## POPULATE Clause

An optional clause that processes existing source data when creating the MV. Use only for development — POPULATE can miss concurrently inserted data. Production MVs should be created empty and backfilled separately.

## Block-Level Triggers

MVs fire on block insertion, not row insertion. When a batch of rows (typically 65K+ rows) is inserted, the MV processes the entire block. This makes MVs efficient for bulk loads but means very small inserts (< 10 rows) may not trigger the MV immediately.

## Transform-on-Write

MVs transform data at write time, not query time. This is the key performance advantage: query-time aggregation overhead is eliminated because the work is done during ingestion.

---

# When To Use

- Real-time data rollups and aggregations
- Data filtering (e.g., exclude bot traffic from analytics views)
- Column renaming and type casting during ingestion
- Pre-computing JOIN results between source and reference tables
- Creating multiple views of the same data at different granularities

---

# When NOT To Use

- Query-time transformations that change frequently (use standard VIEW)
- Simple alternative sort orders (use projections)
- Complex JOINs across multiple source tables (MVs support single-source transforms)
- Tables requiring row-by-row transformation logic

---

# Best Practices

## Create Target Table First

Always create the target table with explicit schema, partition key, ORDER BY, and codecs before creating the MV. The MV's target table should be optimized for its access pattern, not the source table's.

## One MV Chain Deep

Avoid cascading MVs (MV1 → TableB, which has MV2 → TableC). Each hop doubles write amplification. Flatten chains where possible.

## Monitor MV Target Part Count

Each MV insert creates a new part in the target table. If MVs are triggered at high frequency, target tables accumulate parts faster than merges can process.

## Test with EXPLAIN

Use `EXPLAIN` to verify the MV's SELECT query is efficient. A slow MV query blocks the source table insert.

---

# Performance Considerations

- Write amplification: each MV adds 1 write to the target table per source insert.
- Block-level triggers: MVs process at block granularity. Very small inserts may not trigger MVs immediately.
- MV SELECT query performance: the MV's query runs synchronously with the source INSERT. Slow MV queries delay inserts.
- Cascading MVs: 3-chain creates 3x write amplification.

---

# Common Mistakes

## Mistake: POPULATE in Production

Using POPULATE when creating an MV in production. The MV processes existing data but misses data inserted during the POPULATE process. Data is missing from the target table.

**Better approach:** Create MV without POPULATE. Backfill historical data separately using INSERT INTO target SELECT ... FROM source.

## Mistake: MV Without Target Table Indexing

The MV target table uses the source table's ORDER BY. But the target table is queried with different WHERE clauses. Queries against the target table are slow.

**Better approach:** Design the target table ORDER BY based on how it will be queried, not on the source table structure.

## Mistake: Cascading MVs Without Need

MV1 → AggTable, AggTable has MV2 → DailyAggTable. The data flow is: INSERT to source → MV1 writes to AggTable → MV2 writes to DailyAggTable. 2x write amplification on every insert.

**Better approach:** If DailyAggTable can be computed from AggTable queries, use a refreshable MV or scheduled job instead of cascading MVs.
