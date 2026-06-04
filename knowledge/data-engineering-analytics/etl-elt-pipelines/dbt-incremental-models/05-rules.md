# Rules: dbt Model Patterns (Incremental Merge, Append, Insert_Overwrite)

## Rule DBTI-01: Unique Key Required for Merge
Incremental models using the merge strategy MUST define a `unique_key`. Without it, merge operations cannot match existing rows and create duplicates.

## Rule DBTI-02: Test All Incremental Models
All incremental models MUST have dbt tests (unique, not_null, relationships). Incremental processing errors accumulate silently without tests.

## Rule DBTI-03: Monitor Incremental Run Duration
Incremental model run times MUST be monitored. If an incremental run takes as long as a full refresh, the WHERE filter is not working correctly.

## Rule DBTI-04: Strategy by Data Type
Use append for immutable events, merge for dimension updates, insert_overwrite for partitioned facts. Mixing strategies with the wrong data type causes data corruption.

## Rule DBTI-05: Index the WHERE Column
The column used in the `is_incremental()` WHERE clause MUST be indexed on the source table. Without an index, incremental runs perform full table scans.

## Rule DBTI-06: Test Full Refresh Path
Every incremental model MUST produce correct results during a full refresh. The model must work both with and without the `is_incremental()` filter.

## Rule DBTI-07: Serialize Runs for Same Model
Concurrent incremental runs for the same model MUST be serialized. Concurrent merges on the same table can cause data loss.

## Rule DBTI-08: No Merge for SCD Type 2
Incremental merge MUST NOT be used for Type 2 SCD dimensions. Use dbt snapshots instead. Merge overwrites historical versions.

## Rule DBTI-09: Document Why Incremental
The model documentation MUST explain why the incremental strategy was chosen and what unique_key defines. Future maintainers need this context.

## Rule DBTI-10: Latest Record Strategy for Append
Append-strategy models SHOULD include a `_loaded_at` timestamp. Consumers need to identify the latest records in append-only tables.
