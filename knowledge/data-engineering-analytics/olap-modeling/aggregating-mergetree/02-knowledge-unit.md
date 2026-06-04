# AggregatingMergeTree

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 05-olap-modeling
- **Knowledge Unit:** aggregating-mergetree
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

ClickHouse's AggregatingMergeTree (AMT) engine pre-aggregates data at insert time by storing intermediate aggregation states (not final values) and merging them during background merges, enabling continuous incremental aggregation without data loss or duplicate counting. Combined with `-State` and `-Merge` combinator functions, this is ideal for real-time dashboards where raw data arrives continuously and queries must return instantly.

---

## Core Concepts

- **AggregatingMergeTree (AMT):** MergeTree variant storing intermediate aggregation states using `AggregateFunction` column types — during merges, partial states combine into more complete states — final result materialized only when queried
- **State Combinator:** Appended to aggregation functions: `countState()`, `sumState()`, `uniqState()` — return intermediate states instead of final values — states can be stored in AMT columns
- **Merge Combinator:** Appended to aggregation functions: `countMerge()`, `sumMerge()`, `uniqMerge()` — accept intermediate states and return final aggregated value — used at query time to finalize aggregation
- **Materialized View + AMT Pattern:** Standard pattern — MV reads from raw MergeTree table, applies `-State` aggregation functions, writes intermediate states to AMT target table — queries use `-Merge` combinators

---

## Mental Models

- **AMT as LEGO Kit:** Raw data is a pile of individual LEGO bricks. The AMT collects bricks into partially-built sections (intermediate states). When you need the final model, you snap the sections together (Merge combinator). You never need to find individual bricks again.
- **Pre-Aggregation as Cooking in Bulk:** Instead of cooking each meal from scratch (query-time aggregation), you prep ingredients in bulk (AMT insert). When it's time to eat (query), you just heat and serve (Merge combinator). The prep work was done when ingredients arrived.

---

## Internal Mechanics

A materialized view is created on the raw MergeTree table. When data is inserted into the raw table, the MV fires and applies aggregate functions with the `-State` combinator. The resulting intermediate states are written to the AMT target table. During background merges, ClickHouse combines partial states from different data parts into more complete states. When a query executes with `-Merge` combinators, the stored states are finalized into the aggregate result. AMT merges are idempotent — merging the same blocks multiple times produces the same result.

---

## Patterns

- **Materialized Views to Feed AMT:** Create a MV reading from raw table and writing to AMT — ensures automatic, trigger-based population of pre-aggregated states without application-level orchestration
- **Choose Correct AggregateFunction Type:** Match column type to aggregation — `SimpleAggregateFunction(sum, UInt64)` for counters, `AggregateFunction(uniq, UInt64)` for unique counts, `AggregateFunction(avg, Float64)` for averages
- **Same Partition Key as Source:** AMT tables should have the same partition key as the raw source table — partition alignment ensures merges operate on aligned data ranges

---

## Architectural Decisions

Use AMT for any aggregation that benefits from incremental pre-computation — real-time dashboards, high-cardinality rollups, time-series analytics. Do not use for tables requiring exact row-level data or for small datasets (< 1M rows). Use materialized views to populate AMT automatically. Match partition keys between source and AMT tables.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| 10-100x storage reduction vs raw data | Cannot reconstruct individual events | Privacy benefit — aggregate states are binary |
| Query performance independent of data volume | Write amplification from MV chain | Each INSERT to raw table triggers AMT insert |
| Real-time incremental aggregation | Limited to mergeable aggregation functions | topK, quantile approximations may not use states |
| Idempotent merges enable safe reprocessing | Final result only materialized at query time | Query must use -Merge combinators |

---

## Performance Considerations

AMT reduces storage significantly — raw events to compressed states is typically 10-100x reduction. Merge operations are background processes that do not affect INSERT throughput. Query performance on AMT tables is independent of raw data volume — pre-aggregated states are compact. Write amplification: each INSERT to raw table triggers MV insert to AMT table — monitor AMT table part count.

---

## Production Considerations

AMT stores intermediate states, not raw data — it is not possible to reconstruct individual raw events. State columns are binary and not human-readable — access controls apply at the table level. Aggregate states cannot be reverse-engineered to identify individual users, providing a privacy benefit. Idempotent merges enable safe reprocessing and backfill.

---

## Common Mistakes

- **Using AMT Without Materialized Views:** Manually inserting aggregated states instead of using an MV to automate the pipeline — data inconsistencies when inserts are missed. Better: always use MV + AMT pattern for automatic population.
- **Wrong AggregateFunction Type:** Using `AggregateFunction(avg, Float64)` when `SimpleAggregateFunction(sum, UInt64)` with count + sum would suffice — overcomplicates schema. Better: match column type to the simplest appropriate function.
- **Different Partition Keys:** AMT table partitioned differently from source — merges cannot align data ranges, query performance degrades. Better: use same partition key as source table.

---

## Failure Modes

- **MV Block Level Issues:** MVs fire on block insertion, not row — very small inserts (< 10 rows) may not trigger MV immediately. Mitigation: ensure batch sizes align with MV trigger granularity.
- **Part Explosion:** High-frequency inserts to raw table create many parts in AMT table — merge process cannot keep up, part count grows. Mitigation: monitor AMT part count, adjust insert batching.
- **State Serialization Changes:** ClickHouse version upgrade changes internal state serialization format — existing AMT states cannot be read. Mitigation: test version upgrades, plan for state migration if needed.

---

## Ecosystem Usage

AMT is configured at the ClickHouse schema level, not in Laravel code. When using `laravel-clickhouse`, the schema builder can define AMT tables with `AggregateFunction` columns. The ETL Manifesto or dbt models define the MV+AMT pipeline. This pattern is commonly used in real-time analytics dashboards where pre-aggregated data feeds the dashboard widget providers.

---

## Related Knowledge Units

### Prerequisites
- ClickHouse MergeTree — Base engine that AMT extends

### Related Topics
- ClickHouse Materialized Views — The MV mechanism that feeds AMT tables
- Write Amplification — AMT background merges contribute to write amplification in MV chains

### Advanced Follow-up Topics
- Projections vs Materialized Views — Projections as an alternative to MVs + AMT for pre-aggregation

---

## Research Notes

AggregatingMergeTree is the mechanism that makes ClickHouse pre-aggregation work at scale. The key design insight is storing intermediate aggregation states rather than final values — this enables incremental aggregation where merges are idempotent and query-time finalization is always up-to-date. The MV + AMT pattern has become the standard approach for real-time analytics in ClickHouse.
