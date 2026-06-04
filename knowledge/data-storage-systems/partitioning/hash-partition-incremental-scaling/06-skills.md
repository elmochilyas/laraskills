# Skill: Plan Hash Partition Count for Incremental Scaling

## Purpose

Choose the right number of hash partitions at table creation time — using power-of-2 counts and pre-partitioning for growth — to avoid costly rebuilds when data grows.

## When To Use

- Designing new hash-partitioned tables
- Re-partitioning existing tables with hash strategy
- Estimating partition count for expected data growth
- Planning future scaling of hash partitions

## When NOT To Use

- Range or list partitioning (different considerations)
- Small tables (1-10M rows) where partition count matters less
- Tables with future migration to different partition strategy planned

## Prerequisites

- Hash partitioning strategy confirmed
- Estimated data volume and growth rate
- Understanding that changing partition count requires full rebuild

## Inputs

- Estimated table size at maturity
- Target row count per partition (e.g., 5-10M rows per partition)
- Expected growth rate
- Hardware and performance requirements

## Workflow (numbered steps)

1. Estimate maximum expected table size over the table's lifespan
2. Choose target rows per partition:
   - MySQL: 5-10M rows per partition is manageable
   - Partitions should be small enough for efficient operations but not too many
3. Calculate initial partition count:
   ```
   partition_count = max_expected_rows / target_rows_per_partition
   ```
   - Example: 100M rows expected, 10M per partition → 10 partitions
   - Round up to next power of 2: 16 partitions
4. Choose power-of-2 partition count: 8, 16, 32, 64, 128
   - Power of 2 enables easier future splitting/merging
   - Start conservatively (16 for most tables)
5. Create table with chosen partition count:
   ```sql
   CREATE TABLE user_events (
     user_id INT, event_data JSON, ...
   ) PARTITION BY HASH (user_id) PARTITIONS 16;
   ```
6. Document the choice and expected growth timeline
7. Monitor partition sizes and overall table growth
8. If partition count must change:
   - Full table rebuild: `ALTER TABLE ... PARTITION BY HASH (key) PARTITIONS N`
   - Use pt-online-schema-change for production
   - Schedule during maintenance window
   - Consider merging partitions (REORGANIZE) as intermediate step

## Validation Checklist

- [ ] Partition count is power of 2 (8, 16, 32, 64, 128)
- [ ] Expected rows per partition within target range (5-10M)
- [ ] Estimated growth timeline before partition changes needed
- [ ] Rebuild procedure documented (if count changes needed)
- [ ] Partition count documented in schema design
- [ ] Monitoring tracks partition sizes over time

## Common Failures

- Too few partitions (2-4) — each partition grows too large
- Too many partitions (256+) — metadata overhead and connection management
- Non-power-of-2 count — uneven distribution with MOD function
- Partition count chosen without growth margin — need rebuild sooner
- No monitoring of partition sizes — hot partitions go unnoticed

## Decision Points

- Start with 16 vs 32 vs 64 partitions
- Expected data growth: 2 years vs 5 years vs 10 years
- Rebuild strategy: online vs offline, tool choice (pt-online-schema-change, gh-ost)
- Composite partitioning: hash + range for lifecycle management

## Performance Considerations

- Each partition adds ~1KB of metadata in buffer pool
- More partitions = more concurrent index scanning (if no pruning)
- Fewer partitions = larger individual partitions (slower maintenance)
- Rebuild cost: proportional to table size, requires free disk space equal to table size

## Security Considerations

- Modify partition count operations require ALTER privilege
- Online DDL tools need extra database permissions
- Document partition strategy changes in change management process

## Related Rules

- 8-12-1: Always Use Power of 2 Partition Count
- 8-12-2: Always Pre-Partition for Expected Growth

## Related Skills

- Implement Hash Partitioning
- Rebuild Partitioned Tables Online
- Monitor Partition Size and Growth

## Success Criteria

- Partition count is power of 2
- Row distribution even across partitions (within 10% variance)
- No rebuild needed for at least 2 years (expected growth)
- Partition sizes monitored and tracked
- Rebuild procedure documented if needed
