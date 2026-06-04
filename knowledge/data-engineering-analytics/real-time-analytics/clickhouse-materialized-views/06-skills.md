# Skills: ClickHouse Materialized View Trigger Model

## Skill: Creating Real-Time Aggregation MV
**Purpose:** Build a ClickHouse materialized view for real-time analytics aggregation.
**When to use:** Pre-computing aggregations from raw event data at insert time.
**Steps:**
1. Create target MergeTree table with appropriate schema, ORDER BY, codecs
2. Write SELECT query that transforms source data
3. Create MV with `TO target_table AS SELECT ...`
4. Verify: insert test data to source, query target table
5. Monitor target table part count and MV lag
6. Backfill historical data separately
7. Document MV source, target, and transformation
