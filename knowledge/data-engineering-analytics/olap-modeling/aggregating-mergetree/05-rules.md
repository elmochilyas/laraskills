# Rules: ClickHouse AggregatingMergeTree + State/Merge Functions

## Rule AMT-01: MV Feeds AMT
AggregatingMergeTree tables MUST be populated by materialized views, not direct INSERTs. The MV ensures automatic, trigger-based population.

## Rule AMT-02: State Combinators in MV
Materialized views feeding AMT MUST use `-State` combinator aggregation functions. Without State combinators, the MV writes final values, not intermediate states.

## Rule AMT-03: Merge Combinators in Query
Queries against AMT tables MUST use `-Merge` combinators to finalize intermediate states. Without Merge combinators, queries return binary state data.

## Rule AMT-04: Aligned Partition Keys
AMT tables SHOULD have the same partition key as the source MergeTree table. Aligned partitions enable efficient merges.

## Rule AMT-05: Monitor AMT Part Count
AMT table part count MUST be monitored. Each MV insert creates a new part. Excessive parts indicate merge lag or overly aggressive insertion.

## Rule AMT-06: Idempotent Reprocessing
AMT merges are idempotent — merging duplicate data blocks produces correct results. Backfill pipelines must leverage this property.

## Rule AMT-07: Appropriate AggregateFunction Type
AMT column types MUST match the aggregation function: `SimpleAggregateFunction` for additive aggregations, `AggregateFunction` for non-additive (uniq, quantile).

## Rule AMT-08: Test State Roundtrip
State combinator → Merge combinator roundtrip MUST be tested. Verify that `countMerge(countState(x)) = count(x)` for all aggregation functions used.

## Rule AMT-09: Document Granularity
The aggregation granularity (per minute, per hour, per day) MUST be documented in the AMT table schema. Query performance depends on granularity choice.

## Rule AMT-10: No Direct AMT Queries for Raw Data
AMT tables MUST NOT be queried when raw row-level data is needed. AMT provides aggregates only. Use the source MergeTree table for raw data access.
