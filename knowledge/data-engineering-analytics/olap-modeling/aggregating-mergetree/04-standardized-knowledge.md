# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 05-olap-modeling
**Knowledge Unit:** aggregating-mergetree
**Difficulty:** Intermediate
**Category:** ClickHouse Aggregation
**Last Updated:** 2026-06-03

---

# Overview

ClickHouse's AggregatingMergeTree engine pre-aggregates data at insert time by storing intermediate aggregation states (not final values) and merging them during background merges. Combined with `-State` and `-Merge` combinator functions, this enables continuous, incremental aggregation without data loss or duplicate counting — ideal for real-time dashboards, rollup tables, and time-series analytics where raw data arrives continuously and queries must return instantly.

Engineers must care because AggregatingMergeTree is the mechanism that makes ClickHouse pre-aggregation work at scale. Without it, dashboards must query raw tables, which slows down as data grows. With it, dashboards query pre-computed states that are updated in real time.

---

# Core Concepts

## AggregatingMergeTree (AMT)

A MergeTree variant that stores intermediate aggregation states using `AggregateFunction` column types. During merges, partial aggregation states are combined into more complete states. The final result is materialized only when queried.

## State Combinator

Appended to aggregation functions: `countState()`, `sumState()`, `uniqState()`. These return intermediate states instead of final values. States can be stored in AMT columns.

## Merge Combinator

Appended to aggregation functions: `countMerge()`, `sumMerge()`, `uniqMerge()`. These accept intermediate states and return the final aggregated value. Used at query time to finalize the aggregation.

## Materialized View + AMT Pattern

The standard pattern: a materialized view reads from a raw MergeTree table, applies `-State` aggregation functions, and writes intermediate states to an AMT target table. Queries read from the AMT table with `-Merge` combinators.

---

# When To Use

- Real-time dashboards requiring pre-aggregated data
- High-cardinality rollup tables (per-minute aggregations of per-event data)
- Time-series analytics with continuous data arrival
- Any aggregation that would benefit from incremental pre-computation

---

# When NOT To Use

- Tables requiring exact row-level data (raw event storage)
- Small datasets (< 1M rows) — pre-aggregation overhead is not justified
- Aggregations that change frequently (query-time aggregation is more flexible)
- Non-mergeable aggregation functions (topK, quantile approximations that don't use states)

---

# Best Practices

## Use Materialized Views to Feed AMT

Create a materialized view that reads from the raw table and writes to the AMT table. This ensures automatic, trigger-based population of pre-aggregated states without application-level orchestration.

## Choose Correct AggregateFunction Type

Match the column type to the aggregation: `SimpleAggregateFunction(sum, UInt64)` for counters, `AggregateFunction(uniq, UInt64)` for unique counts, `AggregateFunction(avg, Float64)` for averages.

## Idempotent Merges

AMT merges are idempotent — merging the same data blocks multiple times produces the same result. This enables safe reprocessing and backfill.

---

# Architecture Guidelines

## Table Chain

Raw Events → Materialized View → AggregatingMergeTree (intermediate states) → Dashboard Query (with -Merge)

The raw table stores every event. The MV processes inserts and writes states to AMT. The AMT table stores compact intermediate states.

## Partition Strategy

AMT tables should have the same partition key as the raw source table. Partition alignment ensures that merges operate on aligned data ranges.

## Query Pattern

```sql
SELECT
    toDate(timestamp) as day,
    countMerge(pageviews) as views,
    uniqMerge(visitors) as unique_visitors
FROM agg_daily_pageviews
WHERE day >= today() - 30
GROUP BY day
```

---

# Performance Considerations

- AMT reduces storage significantly: raw events → compressed states is typically 10-100x reduction.
- Merge operations are background processes. They do not affect INSERT throughput.
- Query performance on AMT tables is independent of raw data volume. Pre-aggregated states are compact.
- Write amplification: each INSERT to raw table triggers MV insert to AMT table. Monitor AMT table part count.

---

# Security Considerations

- AMT stores intermediate states, not raw data. It is not possible to reconstruct individual raw events from AMT states.
- State columns are binary and not human-readable. Access controls apply at the table level.
- Aggregate states cannot be reverse-engineered to identify individual users, providing a privacy benefit.

---

# Examples

## Raw Events Table
```sql
CREATE TABLE events (
    event_id UUID,
    timestamp DateTime,
    url String,
    user_id UInt64
) ENGINE = MergeTree ORDER BY (timestamp, event_id);
```

## AMT Pre-Aggregation Table
```sql
CREATE TABLE agg_daily_url_stats (
    date Date,
    url String,
    pageviews AggregateFunction(count),
    visitors AggregateFunction(uniq, UInt64)
) ENGINE = AggregatingMergeTree
ORDER BY (date, url);
```

## Materialized View Feeding AMT
```sql
CREATE MATERIALIZED VIEW mv_daily_url_stats TO agg_daily_url_stats AS
SELECT
    toDate(timestamp) as date,
    url,
    countState() as pageviews,
    uniqState(user_id) as visitors
FROM events
GROUP BY date, url;
```

---

# Related Topics

- ClickHouse MergeTree — Base engine that AMT extends
- ClickHouse Materialized Views — The MV mechanism that feeds AMT tables
- Write Amplification — AMT background merges contribute to write amplification in MV chains
- Projections vs Materialized Views — Projections as an alternative to MVs + AMT for pre-aggregation
