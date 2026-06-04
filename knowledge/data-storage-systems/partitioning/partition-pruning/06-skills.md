# Skill: Verify and Optimize Partition Pruning

## Purpose

Ensure the database optimizer scans only relevant partitions by writing queries that include the partition key with compatible conditions, and verify pruning via EXPLAIN.

## When To Use

- Querying partitioned tables
- Tuning query performance on partitioned tables
- Verifying new queries or schema changes don't break pruning
- Debugging slow queries on partitioned tables

## When NOT To Use

- Non-partitioned tables (no pruning to verify)
- Queries that need to scan all partitions (reporting, analytics)

## Prerequisites

- Table is partitioned
- Partition key identified
- EXPLAIN access

## Inputs

- Query to run
- Partition key and type
- EXPLAIN output

## Workflow (numbered steps)

1. Identify the partition key for the target table
2. Write queries that include the partition key in WHERE with supported conditions:
   - ✅ Equality: `WHERE partition_key = value`
   - ✅ Range: `WHERE partition_key BETWEEN a AND b`
   - ✅ IN list: `WHERE partition_key IN (1, 2, 3)`
   - ✅ Comparison: `WHERE partition_key > date`
   - ❌ Function wrapper: `WHERE YEAR(partition_key) = 2024` (MySQL RANGE COLUMNS)
   - ❌ OR conditions on other columns
   - ❌ Subqueries with partition key outside
3. Verify pruning with EXPLAIN:
   ```sql
   EXPLAIN SELECT * FROM orders WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01';
   ```
   - Check `partitions` column: should list 1-2 partitions, not ALL
   - For hash partitions: equality condition (`WHERE user_id = 123`) prunes to 1 partition
4. If pruning fails:
   - Remove function wrapper on partition key
   - Convert to range comparison
   - Add partition key condition to WHERE
5. Document query patterns that achieve pruning for the team

## Validation Checklist

- [ ] EXPLAIN shows specific partitions (not ALL)
- [ ] Partition key appears in WHERE without function wrapper
- [ ] Range queries use direct column comparison
- [ ] Hash partition queries use equality on partition key
- [ ] OR conditions don't bypass partition pruning
- [ ] Dynamic parameters (prepared statements) still prune correctly

## Common Failures

- Function wrapper on partition key — pruning disabled
- OR condition where one branch lacks partition key
- Date string compared without quoting — full scan
- Partition pruning works in EXPLAIN but not at runtime (parameterized query with type mismatch)

## Decision Points

- Static vs dynamic pruning
- Function wrapper alternatives (range comparison vs YEAR() function)
- Using RANGE COLUMNS to avoid function wrapper on dates

## Performance Considerations

- Pruning reduces scanned partitions from N to 1-K
- Range queries: scans partition range between boundaries
- Hash queries: exact match prunes to exactly 1 partition
- EXPLAIN overhead: negligible for query verification

## Security Considerations

- EXPLAIN can reveal partition structure and data distribution
- No security difference between pruned and full scan

## Related Rules

- 8-5-1: Always Include Partition Key In WHERE
- 8-5-2: Never Use Function Wrapper on Partition Key

## Related Skills

- Implement Range Partitioning
- Implement Hash Partitioning
- Use EXPLAIN for Query Analysis

## Success Criteria

- All queries with partition key in WHERE prune correctly
- Function wrappers eliminated from partition key conditions
- EXPLAIN shows specific partitions (not ALL) for filtered queries
- Pruning behavior documented for common query patterns
