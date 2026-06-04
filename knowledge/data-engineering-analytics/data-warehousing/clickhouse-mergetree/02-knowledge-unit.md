# ClickHouse MergeTree

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 04-data-warehousing
- **Knowledge Unit:** clickhouse-mergetree
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary

ClickHouse's MergeTree engine family is the foundation of its analytical performance, using columnar storage with sparse primary indexes, partition pruning, and merge sort-based compaction — fundamentally different from MySQL/PostgreSQL B-tree indexes. Configuration of `ORDER BY`, `PARTITION BY`, `PRIMARY KEY`, `TTL`, and merge settings directly determines query performance, storage efficiency, and write throughput, and is the single most impactful optimization in any ClickHouse-based analytics pipeline.

---

## Core Concepts

- **ORDER BY Key:** Defines the sort order within a partition — primary mechanism for query performance — WHERE clauses filtering on ORDER BY columns use the sparse index to skip large data ranges
- **PARTITION BY:** Divides data into partitions based on an expression (typically month or day) — enables partition-level operations (DROP, ATTACH/DETACH) — too many partitions (> 1000) degrades performance
- **PRIMARY KEY:** Secondary index on top of ORDER BY — does not need to be unique — defaults to ORDER BY key if not specified — separate PK can reduce index size for wide ORDER BY
- **Merge Behavior:** Data parts sorted per INSERT block and merged in background — smaller parts combine into larger ones based on merge algorithm settings — understanding merges is key to managing write amplification
- **TTL (Time-To-Live):** Automatic deletion or aggregation of old data based on a time column — can delete rows, move data between storage tiers, or recompress — primary data lifecycle management mechanism

---

## Mental Models

- **MergeTree as Filing Cabinet by Date:** ORDER BY is like organizing files by date (most recent first). PARTITION BY is like having separate drawers for each month. The sparse index is like the divider tabs — not every file has a tab, but you can skip whole sections. Merges are like combining small scattered papers into organized folders.
- **Partitions as Ice Cubes:** Each partition is like an ice cube in an ice tray. You can remove individual cubes (DROP PARTITION) without affecting others. Too many small cubes (too many partitions) means the tray is inefficient. Merging is like water refreezing into fewer, larger cubes.

---

## Internal Mechanics

ClickHouse stores data in columns within partitions. When data is inserted, it's sorted according to ORDER BY and written as a new "part" (a directory of column files). Background merges combine these parts into larger ones. The sparse primary index records the first value of each ORDER BY column for every `index_granularity` rows (default 8192). When a query filters on ORDER BY columns, ClickHouse uses the sparse index to identify which granules to read, skipping entire ranges. Each partition is an independent merge unit — parts from different partitions are never merged together. TTL expressions run during merges, deleting or recompressing expired data.

---

## Patterns

- **ORDER BY First in WHERE:** ORDER BY key should match most common query patterns — columns used in WHERE clauses should appear leftmost in ORDER BY for partition-level skipping
- **Limit Partition Count:** Keep partitions between 10-200 — each partition creates a separate merge queue — partition by month for most analytics use cases
- **Set TTL from Day One:** Configure TTL on every table during creation — adding TTL later requires ALTER that rewrites data — prevents unbounded storage growth

---

## Architectural Decisions

Design ORDER BY with high-cardinality filter columns first, low-cardinality second, time column last — e.g., `ORDER BY (site_id, event_type, toDate(timestamp))`. Partition by `toYYYYMM(timestamp)` for monthly or `toDate(timestamp)` for daily. Set `index_granularity = 8192` as default — decrease for many short rows, increase for wide rows. Configure production merge settings: `merge_with_ttl_timeout = 86400`, `max_parts_in_total = 100000`.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fast range scans with ORDER BY alignment | Wrong ORDER BY causes full table scans | Must match ORDER BY to query patterns |
| Partition-level operations (DROP, TTL) | Too many partitions cause merge thrashing | Keep 10-200 partitions |
| Sparse index is memory-efficient | Poor precision for non-ORDER BY filters | Add skip indexes for other query patterns |
| Append-oriented design (fast inserts) | No row-level updates or deletes | Use ReplacingMergeTree for upserts |
| TTL automates data lifecycle | Adding TTL later requires data rewrite | Configure TTL from table creation |

---

## Performance Considerations

ORDER BY key determines query performance — filtering on non-ORDER BY columns requires full table scan. Partitions control write amplification during merges — each partition's parts are merged independently. Wide ORDER BY keys increase index size and memory usage during merges. TTL deletion runs during merges, not adding query overhead but potentially delaying merge completion.

---

## Production Considerations

MergeTree is append-oriented — deleted rows are marked as inactive parts and eventually removed by merges (not immediately purged). TTL expressions and partition keys may expose data patterns — avoid partition keys that leak sensitive customer information in partition names. Settings like `allow_remote_fs_zero_copy_replication` affect data consistency in multi-node setups.

---

## Common Mistakes

- **ORDER BY Wrong Column:** ORDER BY set to `id` (surrogate key) but queries filter by `user_id` and `date` — every query is full table scan. Better: ORDER BY should match query patterns — analyze slow queries.
- **Daily Partitions for High-Volume Tables:** Partitioning by day for table receiving 10M rows/hour — each day creates one partition but hourly inserts create hundreds of parts within it. Better: partition by hour or use two-level scheme.
- **No TTL:** Table created without TTL stores data indefinitely — after 2 years, 10TB of never-queried data. Better: set TTL from creation — 90 days for raw, 2 years for aggregated.

---

## Failure Modes

- **Multi-Column ORDER BY With Low-Cardinality First:** ORDER BY `(status, type, date)` where status has 3 values — first two columns provide almost no filtering, date (which could skip partitions) is last. Mitigation: high-cardinality selective columns first.
- **Too Many Partitions (10000+):** Partitioning by `(site_id, toDate(timestamp))` with 1000+ sites — each partition gets its own merge queue, merge thrashing causes insert stalls. Mitigation: use site_id hash buckets.
- **No Primary Key for Wide ORDER BY:** ORDER BY has 8 columns without separate PRIMARY KEY — sparse index includes all 8 columns, large and slow to scan. Mitigation: set PRIMARY KEY to most selective columns only.

---

## Ecosystem Usage

MergeTree is the default engine for all ClickHouse tables in Laravel analytics pipelines. When using `laravel-clickhouse` package, table creation statements define MergeTree configuration. The ETL Manifesto and dbt models that load data into ClickHouse specify MergeTree engine settings. Proper MergeTree configuration is the foundation for all downstream performance.

---

## Related Knowledge Units

### Prerequisites
- ClickHouse Fundamentals — Understanding of columnar storage basics

### Related Topics
- ClickHouse Codecs — Per-column compression within MergeTree tables
- AggregatingMergeTree — Pre-aggregation engine extending MergeTree

### Advanced Follow-up Topics
- Projections vs Materialized Views — Alternative data layouts within MergeTree
- Multi-Region ClickHouse — ReplicatedMergeTree for distributed deployments

---

## Research Notes

MergeTree configuration is the single most impactful optimization in ClickHouse. The ORDER BY key determines whether queries scan a few granules or the entire table. Partition strategy controls merge behavior and TTL operations. The sparse index design (vs B-tree) is what enables ClickHouse's exceptional analytical query performance on large datasets. Understanding and applying these configuration options correctly separates effective ClickHouse deployments from problematic ones.
