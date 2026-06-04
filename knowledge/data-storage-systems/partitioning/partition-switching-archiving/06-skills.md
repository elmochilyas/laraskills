# Skill: Implement Partition Switching for Zero-Downtime Archival

## Purpose

Use `ALTER TABLE ... EXCHANGE PARTITION` to atomically swap a partition's data with an external table for instant archival without data copying.

## When To Use

- Archiving old data without downtime
- Loading data into a partition without blocking reads/writes
- Zero-downtime partition maintenance
- Compliance/data retention: moving old data out of active partition
- Need to validate data before it appears in the live partition

## When NOT To Use

- Simple DROP PARTITION suffices (data can be discarded)
- No requirement for instant, atomic data swap
- Table structure doesn't match (EXCHANGE requires identical structure)
- Database doesn't support EXCHANGE PARTITION (MySQL 5.6+, MariaDB)

## Prerequisites

- MySQL 5.6+ or MariaDB 10.0+ (EXCHANGE PARTITION support)
- Range-partitioned table
- Staging/archive table with identical structure
- Understanding of EXCHANGE requirements

## Inputs

- Partitioned table name and partition name
- Staging table (empty or with data to exchange)
- Table structure verification

## Workflow (numbered steps)

1. Create staging table with identical structure:
   ```sql
   CREATE TABLE orders_archive LIKE orders;
   ALTER TABLE orders_archive REMOVE PARTITIONING;
   ```
   - Must have same columns, indexes, storage engine, character set
   - No partitioning on the staging table
   - Staging table must be empty (for archive: swap partition data out)
2. Exchange partition with staging table:
   ```sql
   ALTER TABLE orders EXCHANGE PARTITION p202401 WITH TABLE orders_archive;
   ```
   - Instant operation (metadata-only)
   - Partition p202401 data is now in orders_archive
   - orders_archive table is now standalone with the old partition data
3. Verify the exchange:
   ```sql
   SELECT COUNT(*) FROM orders;  -- decreased by partition size
   SELECT COUNT(*) FROM orders_archive;  -- has the partition data
   ```
4. Process the archived table:
   - Drop it: `DROP TABLE orders_archive;`
   - Compress it: `OPTIMIZE TABLE orders_archive;`
   - Move to cold storage: backup, then drop
   - Keep as standalone archive table
5. For loading data into a partition (reverse):
   - Load data into staging table
   - Validate data quality
   - `ALTER TABLE orders EXCHANGE PARTITION p_new WITH TABLE staging;`
   - Data is instantly available in the partition

## Validation Checklist

- [ ] Staging table structure matches partitioned table (columns, indexes, engine)
- [ ] EXCHANGE PARTITION completes without error
- [ ] Data moved correctly (verify row counts)
- [ ] Indexes on staging table match (for consistency)
- [ ] Archived data handled correctly (dropped, compressed, or stored)
- [ ] No application disruption during EXCHANGE

## Common Failures

- Staging table structure doesn't match — EXCHANGE fails
- Staging table not empty for archive operation — data merges incorrectly
- Indexes missing on staging table — partition loses indexes after exchange
- Foreign key references break (MySQL partitioned tables can't have FKs)
- Exchange with non-empty staging table when swapping data in — data loss

## Decision Points

- EXCHANGE vs DROP PARTITION: EXCHANGE preserves data as standalone table
- EXCHANGE vs INSERT...SELECT: EXCHANGE is instant, no data copy
- Archive table: drop vs compress vs move to cold storage
- Reverse exchange: load into empty staging table vs exchange with data

## Performance Considerations

- EXCHANGE PARTITION: instant, metadata-only, no row copying
- DROP PARTITION: instant, data is gone
- INSERT...SELECT: expensive, copies all rows
- Archive table can be compressed after exchange without affecting active table

## Security Considerations

- Validated data in staging before exchange prevents bad data in partition
- Archived data must maintain access controls
- Exchange should be done in a transaction or with table lock if needed

## Related Rules

- 8-15-1: Always Verify Structure Match Before Exchange
- 8-15-2: Never Exchange Without Backing Up the Staging Table First

## Related Skills

- Implement Partition-Level Backup and Restore
- Implement DROP PARTITION for Archival
- Implement Data Loading with Partition Exchange

## Success Criteria

- EXCHANGE completes instantly without errors
- Data moves correctly (partition data in archive table)
- No application disruption during exchange
- Archived data handled according to retention policy
- Validation step confirms data integrity
