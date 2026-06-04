# Skill: Implement Partition-Level Backup and Restore

## Purpose

Back up and restore individual partitions (not entire tables) for faster, more storage-efficient backups and granular restores.

## When To Use

- Very large partitioned tables (> 100GB)
- Need granular restore of specific time periods
- Archival: back up a partition before dropping it
- Compliance: retain specific partition backups for audit
- Reducing backup time and storage by skipping static partitions

## When NOT To Use

- Small tables (full table backup is simpler and fast enough)
- No requirement for granular restore
- Full table backup is already meeting RTO/RPO

## Prerequisites

- Partitioned table with range partitioning
- Backup tool (mysqldump, pg_dump, XtraBackup)
- Storage for partition-level backups

## Inputs

- Partition names to back up
- Backup schedule (active partitions vs archived)
- Retention policy per partition

## Workflow (numbered steps)

1. Identify which partitions need backup:
   - Active partitions (current month): back up daily
   - Recent partitions (last 6 months): back up weekly
   - Archived partitions (older than 6 months): back up once before dropping
2. Back up a partition (MySQL):
   ```bash
   # Using mysqldump with partition filter
   mysqldump --where="1=1" --tables orders --partition=p202401 > orders_p202401.sql
   
   # Or select from partition directly
   SELECT * FROM orders PARTITION (p202401) INTO OUTFILE '...'
   ```
3. Back up a partition (PostgreSQL):
   ```sql
   -- Detach partition, back up, re-attach
   ALTER TABLE orders DETACH PARTITION orders_2024;
   pg_dump -t orders_2024 > orders_2024.sql
   ALTER TABLE orders ATTACH PARTITION orders_2024
     FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
   ```
4. Restore a partition (MySQL):
   ```sql
   -- Option 1: Create standalone table, load data, exchange partition
   CREATE TABLE orders_archived LIKE orders;
   ALTER TABLE orders_archived REMOVE PARTITIONING;
   -- Load data from backup
   ALTER TABLE orders EXCHANGE PARTITION p202401 WITH TABLE orders_archived;
   
   -- Option 2: INSERT INTO ... PARTITION (p202401) SELECT from restored data
   ```
5. Archive before DROP: back up partition, then `ALTER TABLE ... DROP PARTITION`
6. Verify restore: query restored partition data for consistency

## Validation Checklist

- [ ] Backup for each partition verified (can restore)
- [ ] Active partitions backed up on correct schedule
- [ ] Archived partitions backed up before DROP PARTITION
- [ ] Granular restore procedure tested
- [ ] Backup storage costs within budget
- [ ] Retention policy applied per partition

## Common Failures

- Backing up entire table weekly (static partitions backed up unnecessarily)
- Missing partition backup before DROP PARTITION — data lost permanently
- Partition backup doesn't include indexes — rebuild needed on restore
- MySQL: mysqldump with --partition flag not available in all versions
- PostgreSQL: detach/re-attach causes brief data unavailability

## Decision Points

- Full table backup vs per-partition backup
- Active partition backup frequency (daily vs weekly)
- Archive partition backup (once before DROP vs periodic)
- Storage tier: standard storage for active, cold storage for archived

## Performance Considerations

- Per-partition backup: faster than full table, skips static partitions
- MySQL: mysqldump per partition is slower than XtraBackup
- PostgreSQL: detach needed for physical backup (logical backup can target partition)
- Storage: archive storage (Glacier, S3 Glacier) for old partitions

## Security Considerations

- Partition backups contain all data — encrypt at rest
- Archived partition backups may contain sensitive historical data — manage access
- Restore partition into production should be audited

## Related Rules

- 8-14-1: Always Back Up Partitions Before Dropping
- 8-14-2: Never Do Full Table Backup When Partition-Level Works

## Related Skills

- Implement Backup Strategy
- Implement DROP PARTITION for Archival
- Implement EXCHANGE PARTITION for Restoration

## Success Criteria

- Active partitions backed up on schedule
- Archived partitions backed up before dropping
- Granular restore tested and working
- Storage costs minimized by backing up only changed partitions
