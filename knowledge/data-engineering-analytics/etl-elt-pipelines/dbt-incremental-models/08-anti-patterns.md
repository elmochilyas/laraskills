# Anti-Patterns: dbt Model Patterns (Incremental Merge, Append, Insert_Overwrite)

## Incremental Without Unique Key
An incremental model uses merge strategy without defining a `unique_key`. dbt cannot match incoming records to existing rows, so every incremental run appends duplicate data. The table grows unbounded with duplicates.

**Solution:** Always define a `unique_key` for merge-strategy models. For truly append-only data, use append strategy explicitly.

## Full Scan Incremental
The `is_incremental()` WHERE clause does not use an indexed column. Each incremental run scans the entire source table. Run time equals a full refresh, defeating the purpose of incremental processing.

**Solution:** Ensure the WHERE clause filters on an indexed timestamp column. Add indexes on source tables if missing.

## Merge on Type 2 SCD
Using dbt incremental merge to load a Type 2 SCD dimension. The merge overwrites the current row instead of inserting a new versioned row. Historical versions are silently destroyed.

**Solution:** Use `dbt snapshot` for Type 2 SCD dimensions. Snapshots handle versioning, effective dates, and current row markers correctly.

## Insert Overwrite With Wrong Partition Boundary
The incremental model selects 3 days of data but the partition is by month. Insert Overwrite replaces the entire month partition, deleting data from 27 days that were not included in the incremental run.

**Solution:** Align the incremental WHERE clause with partition boundaries. Use the same date range as the partition definition.

## Relying on Full Refreshes for Accuracy
Running full refreshes of all models every night because incremental models don't produce trustworthy results. The warehouse spends most of its budget on full table scans.

**Solution:** Fix the incremental model logic rather than defaulting to full refresh. Test incremental results against full refresh results to verify correctness.
