# Skills: Custom ClickHouse Codec Selection

## Skill: Codec Selection for Analytics Tables
**Purpose:** Select optimal per-column codecs for ClickHouse MergeTree tables.
**When to use:** Creating new ClickHouse tables or optimizing existing ones.
**Steps:**
1. Identify column data types and access patterns
2. Select codecs per type: DoubleDelta+LZ4 for timestamps, Gorilla+LZ4 for floats, ZSTD for text
3. Apply LZ4 (no heavy codec) to ORDER BY key columns
4. Create table with per-column CODEC specifications
5. Test with representative data: compare compressed size, insert speed, query speed
6. Configure tiered codec strategy for long-retention tables
7. Monitor storage ratio improvement

## Skill: Implementing Tiered Codec Strategy with TTL
**Purpose:** Automatically transition column codecs as data ages.
**When to use:** Reducing storage costs for historical data while maintaining hot performance.
**Steps:**
1. Define TTL expression for codec transition (e.g., 90 days)
2. Use `ALTER TABLE MODIFY COLUMN ... CODEC` in TTL
3. Set LZ4 for current partition, ZSTD level 3 for medium, ZSTD level 6 for old
4. Test codec transition with historical data
5. Monitor storage savings by partition
6. Verify query performance difference between hot and cold partitions
