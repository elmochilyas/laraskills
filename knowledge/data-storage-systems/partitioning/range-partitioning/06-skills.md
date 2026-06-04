# Skill: Implement Range Partitioning

## Purpose

Divide a table into partitions based on column value ranges, typically for time-series data management and efficient archival.

## When To Use

- Time-series data (orders, logs, events) queried by date range
- Need to archive or drop old data by date range
- Queries include the partition key in WHERE for partition pruning
- Monthly or yearly data segmentation

## When NOT To Use

- Non-temporal data without natural range boundaries
- Queries don't include the partition key (no pruning benefit)
- Table is small (< 1M rows) — partitioning overhead > benefit
- Hash or list partitioning is more suitable for the data

## Prerequisites

- Database version: MySQL 5.1+ or PostgreSQL 10+
- Understanding of partition key selection
- Partition maintenance automation planned

## Inputs

- Table schema
- Partition key column (e.g., created_at)
- Range boundaries (monthly, quarterly, yearly)
- Retention policy

## Workflow (numbered steps)

1. Design range boundaries based on query patterns:
   - Monthly: `VALUES LESS THAN (TO_DAYS('2024-02-01'))` for MySQL
   - Quarterly: `VALUES LESS THAN ('2024-04-01')` for PostgreSQL
   - Yearly: sufficient granularity for archival
2. Create partitioned table with future partitions:
   ```sql
   CREATE TABLE orders (
     id INT, created_at DATE, ...
   ) PARTITION BY RANGE (YEAR(created_at)) (
     PARTITION p2023 VALUES LESS THAN (2024),
     PARTITION p2024 VALUES LESS THAN (2025),
     PARTITION p_future VALUES LESS THAN MAXVALUE
   );
   ```
3. For MySQL, prefer `RANGE COLUMNS(created_at)` for date columns (avoids function wrapper)
4. Automate partition creation: scheduled job creates next period's partition before current fills
5. Automate old partition archival: move data out, then DROP old partition

## Validation Checklist

- [ ] Partition pruning works (verify with EXPLAIN)
- [ ] Queries include partition key in WHERE
- [ ] Partition creation automated (scheduled job)
- [ ] Old partition archival planned and automated
- [ ] Partition count stays within practical limits (100-500)

## Common Failures

- Data written to future partition (VALUES LESS THAN MAXVALUE) unexpectedly
- Partition pruning fails due to function wrappers (YEAR(), MONTH())
- Manual partition creation missed — rows go to default/future partition
- Too many partitions (> 8192 MySQL limit, > 500 practical)

## Decision Points

- Range vs RANGE COLUMNS (MySQL): RANGE COLUMNS for non-integer columns
- Partition granularity: daily vs monthly vs yearly
- MAXVALUE partition: include or exclude (risk of unbounded catch-all)

## Performance Considerations

- Partition pruning eliminates irrelevant partitions
- DROP PARTITION is instant (metadata-only, no DELETE)
- Too many partitions: optimizer overhead, increased metadata

## Security Considerations

- Dropped partitions cannot be recovered — ensure backup before DROP
- Access controls apply to entire table, not per-partition

## Related Rules

- 8-1-1: Always Include Partition Key In WHERE
- 8-1-2: Automate Partition Lifecycle

## Related Skills

- Implement Partition Pruning
- Implement Partition Management
- Archive Data With Partition Drop

## Success Criteria

- Queries prune to only relevant partitions
- Old partitions archived and dropped on schedule
- Partition count stable (new added, old removed)
