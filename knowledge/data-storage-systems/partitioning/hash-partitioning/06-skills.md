# Skill: Implement Hash Partitioning

## Purpose

Distribute rows evenly across a fixed number of partitions using a hash function on the partition key, for write load distribution.

## When To Use

- Even write distribution needed across partitions
- Partition key has high cardinality (user_id, order_id)
- No natural range or list for data separation
- Write-heavy table where each partition acts as a smaller table

## When NOT To Use

- Range queries on partition key (no pruning benefit)
- Need to archive range-based data (use range partitioning)
- Partition count needs to change frequently (data must be rebuilt)
- Table is small enough without partitioning

## Prerequisites

- Fixed partition count determined (changing requires rebuild)
- High-cardinality partition key identified

## Inputs

- Partition key (integer or hashed column)
- Number of partitions (choose carefully — cannot change easily)
- Query patterns (must include partition key for pruning)

## Workflow (numbered steps)

1. Determine the number of partitions:
   - Power of 2 (8, 16, 32, 64) for even distribution
   - Consider growth: start with 16-64 partitions for most OLTP tables
   - MySQL max: 8192 total partitions; practical: 100-500
2. Create hash-partitioned table:
   ```sql
   CREATE TABLE user_events (
     user_id INT, event_date DATE, ...
   ) PARTITION BY HASH (user_id) PARTITIONS 16;
   ```
3. For MySQL, prefer `PARTITION BY KEY(user_id)` if primary key includes it:
   ```sql
   PARTITION BY KEY() PARTITIONS 16;  -- uses primary key
   ```
4. Queries must include the partition key for partition pruning:
   ```sql
   SELECT * FROM user_events WHERE user_id = 123;
   ```
5. To change partition count: must rebuild entire table (REORGANIZE or recreate)
6. Consider composite partitioning for better lifecycle management

## Validation Checklist

- [ ] Partition count is a power of 2 for even distribution
- [ ] Query includes partition key for pruning
- [ ] Data distributed evenly across partitions (verify with COUNT per partition)
- [ ] No partition larger than average by more than 10%
- [ ] Partition count documented (changing requires rebuild)

## Common Failures

- Changing partition count requires full table rebuild
- Hash partition on low-cardinality column — data skew
- Range queries don't benefit from pruning (all partitions scanned)
- Key vs HASH: KEY uses MD5 (more even), HASH uses MOD (integer only)

## Decision Points

- HASH vs KEY (MySQL): KEY for non-integer columns, KEY uses primary key
- Number of partitions: too few (hot partitions), too many (metadata overhead)
- Single partition vs composite (hash + range) partitioning

## Performance Considerations

- Write distribution: even across N partitions (theoretically)
- Partition pruning: only for equality on partition key
- Range scan: must scan all partitions (O(N) cost)
- Rebuilding partitions: full table rewrite (time and disk I/O)

## Security Considerations

- Hash doesn't encrypt data — access controls still apply per table
- Partition metadata may expose schema design

## Related Rules

- 8-3-1: Always Include Partition Key In WHERE
- 8-3-2: Choose Partition Count Carefully (cannot change easily)

## Related Skills

- Implement Range Partitioning
- Implement Composite Partitioning
- Implement KEY Partitioning

## Success Criteria

- Data evenly distributed across partitions
- Queries with partition key prune correctly
- Partition count matches growth plan (won't need to change soon)
