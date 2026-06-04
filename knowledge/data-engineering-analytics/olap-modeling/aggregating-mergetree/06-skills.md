# Skills: ClickHouse AggregatingMergeTree + State/Merge Functions

## Skill: Implementing AggregatingMergeTree Pipeline
**Purpose:** Set up real-time pre-aggregation using ClickHouse AggregatingMergeTree.
**When to use:** Building real-time dashboard aggregations from raw event data.
**Steps:**
1. Create raw MergeTree table for event data
2. Design aggregation granularity (per minute, per hour)
3. Create AMT table with AggregateFunction column types
4. Create materialized view using -State combinators, writing to AMT
5. Test by inserting events and querying AMT with -Merge combinators
6. Verify aggregation values match query-time aggregation of raw data
7. Monitor AMT part count and merge speed
