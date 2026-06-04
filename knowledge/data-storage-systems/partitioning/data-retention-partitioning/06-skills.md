# Skill: Implement Data Retention with Partitioning

## Purpose

Automate data retention using partition DROP operations instead of DELETE, providing instant, bloat-free removal of old data.

## When To Use

- Legal/regulatory data retention requirements (GDPR, HIPAA, PCI-DSS)
- Business data retention policy (keep N months of data)
- Time-series data that accumulates and needs periodic cleanup
- Large tables where DELETE causes bloat and performance degradation

## When NOT To Use

- Non-partitioned tables (DELETE cannot be replaced with DROP)
- Retention requires selective deletion (specific rows, not time range)
- Data must be preserved in cold storage (archive before DROP)
- Short retention periods (daily drops for small tables)

## Prerequisites

- Range-partitioned table by date
- Retention period defined (in months, days, or years)
- Scheduled job mechanism (cron, MySQL EVENT, Laravel scheduler)
- Backup mechanism for data before dropping

## Inputs

- Partitioned table names
- Retention period (e.g., 12 months)
- Grace period (optional: 7 days before dropping)
- Archive strategy (backup before drop or skip)

## Workflow (numbered steps)

1. Define retention policy for each table:
   - Keep 12 months of data for orders
   - Keep 6 months for logs
   - Keep permanent for audit (no drop)
2. Create a scheduled job to enforce retention:
   - List all partitions for the table
   - For each partition, calculate age from partition range boundary
   - If age > retention_period + grace_period: DROP PARTITION
   - If archive is needed: back up partition data first
3. Implement retention stored procedure (MySQL):
   ```sql
   CREATE PROCEDURE drop_old_partitions(IN table_name VARCHAR(64), IN retention_months INT)
   BEGIN
     -- Iterate partitions, calculate age, DROP if older than retention
     -- Use PREPARE/EXECUTE for dynamic SQL
   END;
   ```
4. Schedule execution:
   - Cron: `0 3 1 * * mysql -e "CALL drop_old_partitions('orders', 12)"`
   - MySQL EVENT: `CREATE EVENT enforce_retention ON SCHEDULE EVERY 1 MONTH DO ...`
   - Laravel command: `$schedule->command('retention:enforce')->monthly()`
5. Add grace period: don't drop immediately at retention boundary
   - Retention = 12 months, grace = 7 days
   - Drop partition when its end date + 12 months + 7 days has passed
6. Monitor: log all dropped partitions, verify data count changed correctly

## Validation Checklist

- [ ] Retention policy defined and documented per table
- [ ] Scheduled job creates and drops partitions
- [ ] Grace period applied (data retained slightly beyond minimum)
- [ ] Backup performed before DROP PARTITION (if archival needed)
- [ ] No DELETE queries used for retention (only DROP PARTITION)
- [ ] Logs show successful retention enforcement each cycle
- [ ] Compliance/audit requirements met

## Common Failures

- Using DELETE instead of DROP PARTITION — table bloat and slow cleanup
- Dropping partitions that still contain active data — data loss
- Retention period too short — compliance violation
- Scheduled job fails — partitions accumulate, retention not enforced
- No archive before drop — data permanently lost

## Decision Points

- DROP PARTITION vs EXCHANGE + archive: EXCHANGE preserves data as standalone table
- Retention period per table vs uniform retention
- Grace period: 0 days (hard boundary) vs 7 days (soft boundary)
- Active partitions vs archived partitions: different backup schedules

## Performance Considerations

- DROP PARTITION: instant, removes partition filesystem directory
- DELETE with large WHERE: slow, creates bloat, needs OPTIMIZE later
- DROP PARTITION: no VACUUM needed (PostgreSQL) or OPTIMIZE (MySQL)
- Scheduled job runs monthly — negligible performance impact

## Security Considerations

- Compliance: verify retention period meets regulatory requirements
- Audit: log all partition drops for audit trail
- Data breach: old data is gone — reduces breach impact surface area
- Accidental drop: backup before DROP as safety measure

## Related Rules

- 8-16-1: Always Use DROP PARTITION for Retention (not DELETE)
- 8-16-2: Always Back Up Before Dropping Retention Partitions

## Related Skills

- Implement Partition Management
- Implement Partition-Level Backup
- Implement Compliance-Driven Data Retention

## Success Criteria

- Old partitions dropped automatically on schedule
- No DELETE statements used for data retention
- Retention period complies with regulatory requirements
- Backup created before each DROP PARTITION
- Scheduled job runs reliably and alerts on failure
