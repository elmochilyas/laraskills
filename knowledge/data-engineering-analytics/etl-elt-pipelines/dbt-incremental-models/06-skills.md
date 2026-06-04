# Skills: dbt Model Patterns (Incremental Merge, Append, Insert_Overwrite)

## Skill: Implementing dbt Incremental Merge Model
**Purpose:** Create a dbt incremental model using merge strategy for dimension tables.
**When to use:** Building dimension tables that receive daily updates from source systems.
**Steps:**
1. Create model SQL file in appropriate directory (models/marts/)
2. Configure `materialized='incremental'` with `incremental_strategy='merge'`
3. Define `unique_key` that identifies rows for merge matching
4. Implement `is_incremental()` WHERE clause on update timestamp
5. Add dbt tests (unique, not_null) for the unique key
6. Run full refresh for initial load
7. Verify incremental run only processes new/changed records

## Skill: Implementing Insert Overwrite for Partitioned Facts
**Purpose:** Create an incremental model using insert_overwrite for large partitioned fact tables.
**When to use:** High-volume fact tables where partition-level replacement is optimal.
**Steps:**
1. Configure `partition_by` on the model config (date or integer range)
2. Set `incremental_strategy='insert_overwrite'`
3. Implement WHERE clause that selects only recent partitions
4. Ensure partition boundary alignment between source and target
5. Test full refresh on small date range before production
6. Monitor incremental run cost (bytes processed)
7. Schedule full refresh quarterly for partition compaction
