# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** dbt-incremental-models
**Difficulty:** Intermediate
**Category:** Data Transformation
**Last Updated:** 2026-06-03

---

# Overview

dbt (data build tool) is the de facto standard for ELT transformations in modern data warehouses. It converts raw data (loaded by Fivetran/Airbyte) into analytics-ready models using SQL SELECT statements. dbt's incremental model strategies — **merge**, **append**, **insert_overwrite** — determine how new and changed data is incorporated into existing tables without full refreshes.

The core engineering challenge is choosing the right incremental strategy for each model: merge for deduplicated dimension tables, append for immutable event data, insert_overwrite for partition-based fact tables. Each strategy has tradeoffs in complexity, data consistency, and warehouse cost.

Engineers must care because incremental processing is what makes dbt pipelines production-ready. Full refreshes become impractical as data grows. The wrong incremental strategy causes data corruption, duplicate records, or excessive warehouse costs.

---

# Core Concepts

## dbt Model

A dbt model is a SQL SELECT statement that defines a transformation. The model is materialized as a table, view, or incremental table in the warehouse. Models can be tested, documented, and version-controlled.

## Incremental Model

An incremental model processes only new or changed data since the last run. The `is_incremental()` macro wraps the WHERE clause that filters for new records. The first run is a full refresh; subsequent runs are incremental.

## Unique Key

The unique key identifies a row for incremental merge operations. It is configured in the model config. When the unique key matches an existing row, the merge strategy determines whether to update or skip.

## Full Refresh

A full refresh rebuilds the entire model table by reprocessing all source data. It is triggered manually or when model logic changes. During development, full refreshes are common; in production, they are avoided for large tables.

---

# When To Use

- Data warehouse models that grow beyond 10M rows
- Fact tables loaded from streaming or daily data sources
- Dimension tables that receive daily updates from source systems
- Any model where full rebuilds take more than 10 minutes
- Cost-sensitive warehouse environments where full scans are expensive

---

# When NOT To Use

- Small reference tables (< 100K rows) — full refresh is simpler and fast enough
- Tables rebuilt from scratch daily (truncate + load is acceptable)
- View-based models that don't store data (always use view materialization)
- Temporary or debug models during development

---

# Best Practices

## Always Configure a Unique Key

Every incremental model should have a `unique_key` defined, even for append-only models. The unique key enables dbt's built-in duplicate detection and simplifies schema evolution.

## Use `is_incremental()` for Filtering

The `is_incremental()` macro should wrap the WHERE clause that limits processing to new records. During a full refresh, the macro returns false and the filter is bypassed.

## Test Incremental Models

Write dbt tests (unique, not_null, relationships) on incremental models. Without tests, incremental processing errors accumulate silently over time.

## Monitor Incremental Run Times

Incremental runs should be fast. If an incremental run takes as long as a full refresh, the incremental strategy is not working correctly — the WHERE filter is not selecting the expected rows.

---

# Architecture Guidelines

## Layer Placement

Incremental models are used at every layer of the medallion architecture: staging (Bronze → Silver), intermediate (Silver transformation), and marts (Silver → Gold).

## Strategy Selection by Data Type

- **Append:** Immutable events, logs, page views. New data is appended; existing rows never change.
- **Merge:** Dimension tables, slowly changing data. New data is merged with existing rows by unique key.
- **Insert Overwrite:** Partitioned fact tables. New data replaces entire partitions.

## Full Refresh Cadence

Schedule full refreshes based on data volatility: daily for high-change models, weekly for stable models, monthly for archival models. Automate with dbt's `--full-refresh` flag in scheduled jobs.

---

# Performance Considerations

- Merge strategy requires a unique key index for performance. Without an index, the merge is a full table scan.
- Insert Overwrite is the fastest strategy for large fact tables because it replaces partitions without row-by-row operations.
- Append is the fastest incremental strategy because it never needs to check for existing rows.
- Full refreshes on tables > 100M rows should use zero-copy cloning (table swap) to avoid warehouse query time.

---

# Security Considerations

- Incremental models can silently skip rows if the unique key changes. Test for unique key drift.
- Insert Overwrite on misconfigured partitions can delete data outside the target partition. Always verify partition boundaries.
- Merge conflicts on concurrent incremental runs can cause data loss. Serialize dbt runs for the same model.

---

# Common Mistakes

## Mistake: No Unique Key

An incremental model without a `unique_key` using the merge strategy. Each run adds duplicate rows. The table contains 10x the expected record count, and no one notices because queries use SUM() or COUNT().

**Better approach:** Always define a `unique_key`. Use append strategy for truly append-only models (and skip the unique key).

## Mistake: Wrong Incremental Strategy

A fact table uses the merge strategy instead of insert_overwrite. Each incremental run must scan the entire table to find matching rows. Run times increase linearly with table size.

**Better approach:** Use insert_overwrite for large partitioned fact tables. Use merge only for dimension tables that require row-level updates.

## Mistake: `is_incremental()` Without Full Refresh Path

The incremental model filters on `is_incremental()` but the SELECT statement only works when the WHERE clause is active. A full refresh returns zero rows because the filter column doesn't exist in the source.

**Better approach:** Test the model with both a full refresh and an incremental run during development.

---

# Anti-Patterns

## Incremental Runs That Scan the Full Source

The `is_incremental()` WHERE clause does not use an indexed column. Each incremental run scans the full source table, taking as long as a full refresh.

**Solution:** Ensure the WHERE clause uses an indexed timestamp column. Add an index on the source table's create/update timestamp.

## Overusing Full Refresh

Running full refreshes for all models on every dbt run. The data warehouse spends most of its compute budget on full table scans for models that change little.

**Solution:** Use incremental models by default. Reserve full refreshes for schema changes and quarterly data reconciliation.

## Merge Without Version Handling

Using merge strategy on a Type 2 SCD dimension. The merge overwrites the current record instead of adding a new versioned row. Historical data is lost.

**Solution:** Use dbt's `snapshot` feature for Type 2 SCD. Don't use incremental merge for versioned dimensions.

---

# Examples

## Incremental Model with Merge Strategy

```sql
{{
    config(
        materialized='incremental',
        unique_key='order_id',
        incremental_strategy='merge'
    )
}}

SELECT
    order_id,
    customer_id,
    order_date,
    total,
    status,
    updated_at
FROM {{ source('oltp', 'orders') }}
{% if is_incremental() %}
    WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
{% endif %}
```

## Incremental Model with Insert Overwrite

```sql
{{
    config(
        materialized='incremental',
        incremental_strategy='insert_overwrite',
        partition_by='order_date'
    )
}}

SELECT
    order_id,
    customer_id,
    order_date,
    total,
    status
FROM {{ source('oltp', 'orders') }}
{% if is_incremental() %}
    WHERE order_date >= CURRENT_DATE - INTERVAL '3 days'
{% endif %}
```

---

# Related Topics

**Prerequisites:**
- Medallion Architecture — Framework for where incremental models live (Silver/Gold)

**Closely Related:**
- dbt Project Structure — Organizing incremental models in the project hierarchy
- dbt Semantic Layer — Building metrics on top of incremental models

**Advanced Follow-Up:**
- Late-Arriving Dimensions — Handling dimension increments when facts arrive before dimensions
- SCD Dimensions — Versioning for dimension tables using dbt snapshots

**Cross-Domain Connections:**
- Data Warehousing — Warehouse-specific incremental strategy optimizations
