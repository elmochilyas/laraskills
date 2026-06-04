# dbt Incremental Models

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 03-etl-elt-pipelines
- **Knowledge Unit:** dbt-incremental-models
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

dbt incremental models process only new or changed data since the last run, avoiding full refreshes that become impractical as data grows. The three incremental strategies — merge (for deduplicated dimension tables), append (for immutable event data), and insert_overwrite (for partition-based fact tables) — have distinct tradeoffs in complexity, data consistency, and warehouse cost, making the choice of strategy a critical engineering decision.

---

## Core Concepts

- **Incremental Model:** Processes only new or changed data since last run using `is_incremental()` macro to filter — first run is full refresh, subsequent runs incremental
- **Unique Key:** Identifies a row for incremental merge operations — when unique key matches an existing row, merge strategy determines update or skip
- **Full Refresh:** Rebuilds entire model table by reprocessing all source data — triggered manually or when model logic changes
- **Incremental Strategies:** Append (new data only, never checks existing rows), Merge (upsert by unique key), Insert Overwrite (replace entire partitions)

---

## Mental Models

- **Incremental as Deltas vs Snapshots:** Full refresh is a snapshot — take everything from scratch. Incremental is deltas — only process the changes since last run. Like updating a backup: full backup weekly, incremental backups daily.
- **Strategy Selection as Tool Choice:** Append is a hammer (simple, effective for event data), Merge is a screwdriver (precise, needed for updates), Insert Overwrite is a saw (powerful, best for large partitions). Use the right tool for the material.

---

## Internal Mechanics

dbt generates SQL based on the incremental strategy. For merge, it creates a `MERGE` or `INSERT ... ON CONFLICT` statement using the unique key. For append, it creates `INSERT INTO ... SELECT`. For insert_overwrite, it creates `INSERT OVERWRITE` targeting specific partitions. The `is_incremental()` macro evaluates to `true` during incremental runs, wrapping the WHERE clause that filters for new records. During full refresh, the macro returns false and the filter is bypassed. The incremental state is tracked using the warehouse's own metadata — dbt queries `information_schema` to determine the latest processed timestamp.

---

## Patterns

- **Always Configure a Unique Key:** Every incremental model should have a unique_key defined even for append-only models — enables duplicate detection and simplifies schema evolution
- **`is_incremental()` for Filtering:** Wrap the WHERE clause limiting processing to new records with `is_incremental()` — during full refresh, the filter is bypassed automatically
- **Strategy Selection by Data Type:** Append for immutable events/logs, Merge for dimension tables with updates, Insert Overwrite for partitioned fact tables

---

## Architectural Decisions

Choose merge strategy for dimension tables that need row-level updates. Choose append for event data that is never modified. Choose insert_overwrite for large fact tables where partition replacement is more efficient than row-by-row operations. Use full refresh for small reference tables (< 100K rows) where the simpler approach is fast enough.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fast incremental runs (process only new data) | Complexity of strategy selection | Wrong strategy causes data corruption |
| Lower warehouse costs (no full scans) | Must configure unique_key and filters | Missing filter causes full scan anyway |
| Merge strategy handles updates | Requires index on unique key for performance | Full table scan without index |
| Insert Overwrite is partition-efficient | Misconfigured partitions delete data | Must verify partition boundaries |

---

## Performance Considerations

Merge strategy requires a unique key index for performance — without it, the merge is a full table scan. Insert Overwrite is the fastest strategy for large fact tables because it replaces partitions without row-by-row operations. Append is fastest because it never checks for existing rows. Full refreshes on tables > 100M rows should use zero-copy cloning (table swap) to avoid warehouse query time.

---

## Production Considerations

Write dbt tests (unique, not_null, relationships) on incremental models — without tests, incremental processing errors accumulate silently. Monitor incremental run times — if incremental takes as long as full refresh, the WHERE filter is not working correctly. Schedule full refreshes based on data volatility: daily for high-change models, weekly for stable, monthly for archival.

---

## Common Mistakes

- **No Unique Key:** Incremental model without `unique_key` using merge strategy — each run adds duplicate rows, table contains 10x expected record count. Better: always define a `unique_key`, use append strategy for truly append-only.
- **Wrong Incremental Strategy:** Fact table uses merge instead of insert_overwrite — each run scans entire table to find matching rows, run times increase linearly. Better: insert_overwrite for large partitioned fact tables.
- **`is_incremental()` Without Full Refresh Path:** WHERE clause filter only works incrementally — full refresh returns zero rows. Better: test the model with both full refresh and incremental during development.

---

## Failure Modes

- **Merge Without Version Handling:** Merge strategy on Type 2 SCD dimension — overwrites current record instead of adding versioned row, history lost. Mitigation: use dbt's `snapshot` feature for Type 2 SCD.
- **Incremental Runs Scanning Full Source:** `is_incremental()` WHERE clause doesn't use an indexed column — each run scans full source table. Mitigation: ensure WHERE clause uses an indexed timestamp column.
- **Silent Row Skipping:** Unique key changes cause rows to be skipped silently. Mitigation: test for unique key drift with dbt tests.

---

## Ecosystem Usage

dbt is not a PHP/Laravel package but integrates with the data warehouse layer. Laravel's ETL Manifesto exports data to the warehouse where dbt transforms it. The `laravel-dbt` community package provides some integration utilities. For most Laravel analytics stacks, dbt runs alongside the Laravel application, transforming data in the warehouse after Laravel has loaded it.

---

## Related Knowledge Units

### Prerequisites
- Medallion Architecture — Framework for where incremental models live (Silver/Gold)

### Related Topics
- dbt Project Structure — Organizing incremental models in the project hierarchy
- dbt Semantic Layer — Building metrics on top of incremental models

### Advanced Follow-up Topics
- Late-Arriving Dimensions — Handling dimension increments when facts arrive before dimensions
- SCD Dimensions — Versioning for dimension tables using dbt snapshots

---

## Research Notes

dbt has become the de facto standard for ELT transformations in modern data warehouses. Its incremental model patterns are based on decades of data warehousing best practices but packaged in a developer-friendly, version-controlled format. The `is_incremental()` macro pattern originated from dbt's early versions and has remained the standard approach for incremental processing.
