# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** clickhouse-mergetree
**Difficulty:** Foundation
**Category:** Storage Engine
**Last Updated:** 2026-06-03

---

# Overview

ClickHouse's MergeTree engine family is the foundation of its analytical performance. Unlike MySQL/PostgreSQL B-tree indexes optimized for point lookups, MergeTree uses a columnar storage format with sparse primary indexes, partition pruning, and merge sort-based compaction.

Configuration of `ORDER BY`, `PARTITION BY`, `PRIMARY KEY`, `TTL`, and `SETTINGS` (granularity, compression) directly determines query performance, storage efficiency, and write throughput. Getting this configuration right is the single most impactful optimization in any ClickHouse-based analytics pipeline.

Engineers must care because MergeTree configuration mistakes are the most common cause of poor ClickHouse performance. A wrong ORDER BY can make queries 100x slower. Wrong partitioning can cause OOM during merges. Missing TTL leads to unbounded storage growth.

---

# Core Concepts

## ORDER BY Key

Defines the sort order of data within a partition. This is the primary mechanism for query performance. WHERE clauses that filter on ORDER BY columns can use the sparse index to skip large data ranges. Not necessarily the primary key.

## PARTITION BY

Divides data into partitions based on an expression (typically month or day). Partitions enable partition-level operations: DROP PARTITION for TTL, ATTACH/DETACH for data movement. Partitions are independent merge units. Too many partitions (> 1000) degrades performance.

## PRIMARY KEY

In MergeTree, the primary key is a secondary index on top of the ORDER BY. It does not need to be unique. If not specified, the primary key defaults to the ORDER BY key. Specifying a different primary key can reduce index size when the ORDER BY has many columns.

## Merge Behavior

Data parts are sorted per INSERT block and merged in the background. The merge process combines smaller parts into larger ones based on merge algorithm settings. Understanding merges is key to managing write amplification.

## TTL (Time-To-Live)

Automatic deletion or aggregation of old data based on a time column. TTL expressions can delete rows, move data between storage tiers (hot/cold), or recompress with different codecs. TTL is the primary data lifecycle management mechanism.

---

# When To Use

- Every ClickHouse analytics table
- Columnar analytical workloads where query performance over large datasets is critical
- Time-series data that benefits from partition pruning
- Tables requiring data lifecycle management (TTL)
- Systems that need to balance query performance with storage efficiency

---

# When NOT To Use

- Non-analytical workloads (use MySQL/PostgreSQL for OLTP)
- Tables that store fewer than 1M rows (MergeTree advantages do not apply)
- Systems requiring row-level updates or deletes (MergeTree is append-oriented)
- Real-time streaming with exactly-once semantics (use ReplacingMergeTree or separate logic)

---

# Best Practices

## ORDER BY Columns First in WHERE

The ORDER BY key should match the most common query patterns. Columns used in WHERE clauses should appear leftmost in the ORDER BY. This enables partition-level skipping.

## Limit Partition Count

Keep partitions between 10-200 for most tables. Each partition creates a separate merge queue. Too many partitions causes merge thrashing and poor insert performance. Partition by month for most analytics use cases.

## Set Appropriate Index Granularity

Default `index_granularity = 8192` works for most workloads. Decrease for tables with many short rows to improve index precision. Increase for tables with wide rows to reduce index size.

## Use TTL from Day One

Configure TTL on every table during creation. Adding TTL later requires an ALTER that rewrites data. TTL prevents unbounded storage growth and automatically manages data lifecycle.

---

# Architecture Guidelines

## ORDER BY Design

Strategy: Place high-cardinality filter columns first, low-cardinality filter columns second, time column last. Example: `ORDER BY (site_id, event_type, toDate(timestamp))`.

## Partition Strategy

General: Partition by date — `toYYYYMM(timestamp)` for monthly, `toDate(timestamp)` for daily. Consider partition key prefix if filtering on a high-cardinality dimension that aligns with access patterns.

## Merge Settings

Production settings: `merge_with_ttl_timeout = 86400`, `max_part_loading_threads = auto`, `max_parts_in_total = 100000`. These balance merge aggressiveness with insert throughput.

---

# Performance Considerations

- ORDER BY key determines query performance. A query filtering on a non-ORDER BY column requires a full table scan.
- Partitions control write amplification during merges. Each partition's parts are merged independently.
- Wide ORDER BY keys (many columns) increase index size and memory usage during merges.
- TTL deletion runs during merges; it does not add query overhead but may delay merge completion.

---

# Security Considerations

- MergeTree is append-oriented. Deleted rows (via TTL or ALTER DELETE) are marked as inactive parts and eventually removed by merges. Data is not immediately purged.
- TTL expressions and partition keys may expose data patterns. Avoid partition keys that leak sensitive customer information in partition names.
- Settings like `allow_remote_fs_zero_copy_replication` affect data consistency in multi-node setups.

---

# Common Mistakes

## Mistake: ORDER BY Wrong Column

ORDER BY is set to `id` (a surrogate key), but queries always filter by `user_id` and `date`. Every query is a full table scan because the ORDER BY does not match query patterns.

**Better approach:** ORDER BY should match query patterns. Analyze slow queries to understand which columns are used in WHERE clauses.

## Mistake: Daily Partitions for High-Volume Tables

Partitioning by day for a table receiving 10M rows/hour. Each day creates one partition, but hourly inserts create hundreds of parts within that partition. Merge pressure increases, insert throughput decreases.

**Better approach:** Partition by hour or use a two-level partition scheme (site_id, toDate(timestamp)).

## Mistake: No TTL

A table is created without TTL and stores data indefinitely. After 2 years, the table has 10TB of data that is never queried. Storage costs are 10x what they should be.

**Better approach:** Set TTL from table creation. Default: 90 days for raw data, 2 years for aggregated data.

---

# Anti-Patterns

## Multi-Column ORDER BY With Low-Cardinality First
ORDER BY is set to `(status, type, date)` where `status` has 3 values and `type` has 5 values. The first two columns provide almost no filtering, and the date column (which could skip partitions) is last.

**Solution:** Place high-cardinality columns with high selective filters first in ORDER BY. Low-cardinality dimensions go right of high-cardinality ones.

## Too Many Partitions (10000+)
Partitioning by `(site_id, toDate(timestamp))` when there are 1000+ sites with daily data. Each partition gets its own merge queue. Merge thrashing causes insert stalls and memory pressure.

**Solution:** Reduce partition granularity. Use site_id hash buckets: `toDate(timestamp)` and distribute site_id across fewer partitions.

## No Primary Key for Wide ORDER BY
ORDER BY has 8 columns. Without a separate PRIMARY KEY, the sparse index includes all 8 columns, making it large and slow to scan.

**Solution:** Set PRIMARY KEY to only the most selective columns. The ORDER BY maintains sort order for merges.

## Ignoring Index Granularity
Default `index_granularity = 8192` is used for a table with 500-byte rows. Each index mark covers 4MB of data, making the index too coarse for selective queries.

**Solution:** Reduce `index_granularity` for wide rows. Increase for narrow rows. Monitor index effectiveness with `system.data_skipping_indices`.
