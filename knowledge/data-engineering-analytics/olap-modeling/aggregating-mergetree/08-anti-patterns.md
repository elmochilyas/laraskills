# Anti-Patterns: ClickHouse AggregatingMergeTree + State/Merge Functions

## Direct INSERT to AMT
Inserting final aggregation values directly into an AMT table. Without -State combinators, the values are treated as intermediate states and merged incorrectly during background merges.

**Solution:** Always feed AMT tables through materialized views that use -State combinators.

## Missing -Merge in Queries
Querying an AMT table with standard aggregation functions (count, sum) instead of -Merge variants. The query returns binary intermediate state data instead of numeric values.

**Solution:** Always use `countMerge()`, `sumMerge()`, `uniqMerge()` when querying AMT tables.

## AMT for Row-Level Data
Using AggregatingMergeTree as the primary table for event storage. AMT cannot provide individual event access because it stores only aggregated states.

**Solution:** Store raw events in MergeTree. Use AMT only for pre-computed aggregations.

## Wrong Column Type for Aggregation
Using `AggregateFunction(count, UInt64)` for a column that should be `SimpleAggregateFunction(sum, UInt64)`. The wrong type causes incorrect merge results.

**Solution:** Match column type to aggregation: SimpleAggregateFunction for additive, AggregateFunction for non-additive.

## Too-Fine Granularity
AMT aggregated per second for a dashboard that shows daily data. The AMT table has 86,400x more rows than needed. Query performance benefit is lost due to excessive row count.

**Solution:** Match AMT granularity to query requirements. Aggregate to coarser granularity than the raw data but finer than the most common query.
