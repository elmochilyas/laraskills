# Skill: Manage Partitions (Add, Drop, Truncate, Reorganize)

## Purpose

Perform partition lifecycle operations — adding new partitions for incoming data, dropping old partitions for instant archival, truncating partitions for data removal, and reorganizing for structural changes.

## When To Use

- Adding new time range partitions for incoming data
- Archiving or deleting old data by dropping partitions
- Clearing data from a partition without removing the structure (TRUNCATE)
- Splitting or merging partitions (REORGANIZE)
- Automating partition lifecycle via scheduled jobs

## When NOT To Use

- Non-partitioned tables
- Hash partitions (cannot ADD PARTITION without REORGANIZE)
- Partition count changes needed frequently (bad partition design)

## Prerequisites

- Partitioned table with range or list partitioning
- Maintenance window or online DDL capability
- Backup before destructive operations (DROP PARTITION)

## Inputs

- Table name
- Partition name(s)
- Operation type (ADD, DROP, TRUNCATE, REORGANIZE)
- New partition definition (for ADD/REORGANIZE)

## Workflow (numbered steps)

1. **ADD PARTITION** (range/list):
   ```sql
   ALTER TABLE orders ADD PARTITION (
     PARTITION p202406 VALUES LESS THAN (TO_DAYS('2024-07-01'))
   );
   ```
   - Only for range/list partitioning (not hash)
   - New partition must be higher than highest range

2. **DROP PARTITION** (instant archive):
   ```sql
   ALTER TABLE orders DROP PARTITION p202301;
   ```
   - Instant metadata operation
   - Data is gone — ensure backup first
   - Cannot be rolled back

3. **TRUNCATE PARTITION**:
   ```sql
   ALTER TABLE orders TRUNCATE PARTITION p202301;
   ```
   - Removes data, keeps partition structure
   - Faster than DELETE (no logging per row)

4. **REORGANIZE PARTITION** (split or merge):
   ```sql
   ALTER TABLE orders REORGANIZE PARTITION p2023 INTO (
     PARTITION p2023_h1 VALUES LESS THAN (TO_DAYS('2023-07-01')),
     PARTITION p2023_h2 VALUES LESS THAN (TO_DAYS('2024-01-01'))
   );
   ```
   - Copies data between partitions
   - Can be online (depends on database)
   - Use for splitting overfull partitions or merging sparse ones

5. Automate with scheduled jobs:
   - Monthly cron: ADD next month's partition, DROP partition older than retention
   - Monitor partition count to ensure it stays within limits

## Validation Checklist

- [ ] ADD PARTITION successful (new partition visible in information_schema)
- [ ] DROP PARTITION action backed up first
- [ ] TRUNCATE PARTITION removes data only (structure remains)
- [ ] REORGANIZE completes without data loss
- [ ] Scheduled job creates partitions ahead of time
- [ ] Retention policy enforced (old partitions dropped)

## Common Failures

- ADD PARTITION on hash-partitioned table — requires REORGANIZE
- DROP PARTITION with no backup — data loss
- REORGANIZE fails due to lack of disk space (copies data)
- Scheduled job fails — no new partition, insert errors
- Partition out of range — data can't be inserted

## Decision Points

- DROP vs TRUNCATE: DROP removes structure, TRUNCATE keeps it
- REORGANIZE vs rebuild: REORGANIZE keeps data, rebuild recreates
- Automation: cron job vs database event (MySQL EVENT)

## Performance Considerations

- DROP/TRUNCATE: instant (metadata-only or data delete without logging)
- REORGANIZE: full data copy (I/O intensive, requires disk space)
- ADD PARTITION: metadata-only for range (instant)
- Schedule maintenance during low traffic

## Security Considerations

- DROP PARTITION is irreversible — ensure backup
- Reorganize should not be run during peak traffic
- Partition operations should be audited

## Related Rules

- 8-6-1: Always Automate Partition Creation
- 8-6-2: Always Backup Before DROP PARTITION

## Related Skills

- Implement Range Partitioning
- Archive Data with Partition Drop
- Automate Partition Lifecycle with Cron

## Success Criteria

- New partitions created before old ones fill
- Old partitions dropped according to retention policy
- Partition count stays within practical limits
- No insert errors due to missing partitions
