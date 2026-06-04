# Skill: Implement Time-Based Partitioning

## Purpose

Create partitions aligned to calendar intervals (daily, monthly, quarterly) for time-series data with automated partition creation and retention.

## When To Use

- Time-series data: logs, events, orders, sensor data
- Queries filtered by date ranges
- Data retention policy defined (keep N months, drop older)
- High-volume tables (> 10M rows) with date-based access patterns

## When NOT To Use

- Low-volume tables (partition overhead > benefit)
- No date-based query pattern
- No retention policy (no need to drop old partitions)
- Daily partitions for low-volume tables (365 partitions/year, most unused)

## Prerequisites

- Table with date/timestamp column for partition key
- Retention policy defined
- Automation mechanism (cron, MySQL EVENT, Laravel scheduler)

## Inputs

- Table schema with date column
- Partition interval: daily, monthly, quarterly, yearly
- Retention period (e.g., 12 months)
- Pre-creation window (e.g., create 3 months ahead)

## Workflow (numbered steps)

1. Choose partition interval based on data volume and query patterns:
   - Daily: high volume (> 1M rows/day), 365 partitions/year
   - Monthly: medium volume (10K-1M rows/day), 12 partitions/year
   - Quarterly: low volume, archival only, 4 partitions/year
2. Create table with range partitioning on date column:
   ```sql
   CREATE TABLE events (
     id INT, created_at DATETIME, event_data JSON, ...
   ) PARTITION BY RANGE (TO_DAYS(created_at)) (
     PARTITION p202401 VALUES LESS THAN (TO_DAYS('2024-02-01')),
     PARTITION p202402 VALUES LESS THAN (TO_DAYS('2024-03-01')),
     ...
   );
   ```
3. Use consistent naming: `pYYYYMMDD` (daily), `pYYYYMM` (monthly), `pYYYYQN` (quarterly)
4. Automate partition creation:
   - Monthly cron job creates next month's partitions
   - Create 2-3 months ahead for safety margin
   - Verify partition creation succeeded and alert on failure
5. Automate partition archival:
   - Drop partitions older than retention period
   - Optional: archive data to cold storage before dropping
6. Monitor partition count: stay under 500 practical limit

## Validation Checklist

- [ ] Partition interval matches data volume
- [ ] Partition naming convention defined and consistent
- [ ] Automated partition creation runs before current partition fills
- [ ] Old partitions dropped according to retention policy
- [ ] No insert errors due to missing partitions
- [ ] Partition count monitored and within limits

## Common Failures

- Too many partitions (daily for low-volume table) — metadata overhead
- Scheduled job fails — no new partition, inserts fail with error
- Retention period changes — partitions dropped too early or too late
- Partition naming inconsistency — automation scripts fail

## Decision Points

- Daily vs monthly vs quarterly partitioning
- MySQL RANGE COLUMNS vs TO_DAYS() for date comparison
- Pre-creation window: 1 month vs 3 months ahead
- Drop vs archive before drop

## Performance Considerations

- Daily: 365 partitions/year, pruning narrows to 1-2 partitions
- Monthly: 12 partitions/year, pruning narrows to 1 partition
- Metadata overhead: ~1KB per partition in buffer pool
- DROP PARTITION: instant (range partitioning only)

## Security Considerations

- Time-based data may include sensitive timestamps
- Dropped partitions: ensure backup before dropping

## Related Rules

- 8-7-1: Always Include Partition Key In WHERE
- 8-7-2: Automate Partition Creation and Archival

## Related Skills

- Implement Range Partitioning
- Automate Partition Lifecycle
- Implement Data Retention Policy

## Success Criteria

- Partitions aligned to calendar intervals
- Automated creation runs reliably
- Old partitions archived and dropped on schedule
- Partition count stable and within limits
