# Skill: Manage Default Partitions Safely

## Purpose

Configure range/list partition catch-all (MAXVALUE or DEFAULT) with monitoring to prevent unbounded growth, or eliminate the default partition and rely on pre-creation with failure alerts.

## When To Use

- Range partitioning with VALUES LESS THAN (MAXVALUE)
- List partitioning with VALUES IN (DEFAULT)
- Need to catch data outside defined partition ranges
- Cannot guarantee all future values are known at schema creation

## When NOT To Use

- All possible partition values are known (no default needed)
- Pre-creation automation guarantees partitions exist for all incoming data
- Team prefers error-on-missing-partition over silent catch-all

## Prerequisites

- Partitioned table (range or list)
- Partition monitoring in place
- Scheduled partition creation

## Inputs

- Partition definition (with or without default)
- Data value range or list
- Monitoring infrastructure

## Workflow (numbered steps)

1. Evaluate whether to use a default partition:
   - **Without default** (recommended): pre-create all needed partitions. If data arrives for unpartitioned range, INSERT fails — immediate alert.
   - **With default** (catch-all): all unmatched data goes to default. Monitor default partition size and growth.
2. If using MAXVALUE (range):
   ```sql
   PARTITION p_future VALUES LESS THAN (MAXVALUE)
   ```
   - Monitor: count rows in p_future, compare to expected fraction
   - Alert: when p_future rows > 10% of total or growing faster than anticipated
3. If using DEFAULT (list):
   ```sql
   PARTITION p_other VALUES IN (DEFAULT)
   ```
   - Monitor: which values are going to default (SELECT DISTINCT partition_key FROM orders PARTITION (p_other))
   - Add new partition for any discovered value: REORGANIZE to split out known values
4. Schedule automatic remediation:
   - If default partition grows, create new partitions for the discovered values
   - Alert on-call if remediation script cannot handle the new values
5. Consider eliminating default partition and relying on pre-creation:
   - Create all partitions up to N periods ahead
   - When a new partition is needed, scheduled job creates it before data arrives
   - If job fails, INSERT fails and monitoring alerts

## Validation Checklist

- [ ] Default partition size monitored and alerts configured
- [ ] Pre-creation schedule covers all needed partitions
- [ ] Alternative (no default) INSERT-failure alert works
- [ ] Regular review of default partition values
- [ ] New partitions are added before data arrives

## Common Failures

- MAXVALUE partition collects years of data — becomes largest partition
- DEFAULT list partition grows with unexpected application values
- "Out of range" INSERT errors when no default and partition creation is missed
- Default partition is never cleaned or split — performance degrades

## Decision Points

- Default vs no-default: safety (catch-all) vs alert-on-miss (pre-creation)
- MAXVALUE vs no-MAXVALUE for range partitioning
- Monitoring threshold for default partition growth (10% of total)
- Automatic creation of new partitions from default vs manual approval

## Performance Considerations

- Default partition without pruning: every query scans the default if WHERE includes it
- Large default = slow queries across the default range
- Pre-creation avoids default entirely: INSERTs target correct partitions
- REORGANIZE to split default: costly operation (data copy)

## Security Considerations

- Default partition may contain unexpected data (unvalidated values)
- Monitor default partition values for security anomalies

## Related Rules

- 8-13-1: Always Monitor Default Partition Size
- 8-13-2: Never Rely on MAXVALUE as Permanent Catch-All

## Related Skills

- Implement Range Partitioning
- Implement List Partitioning
- Automate Partition Creation

## Success Criteria

- Default partition stays small (< 10% of total)
- Pre-creation schedule covers future partition needs
- Monitoring alerts on default growth
- New partitions are proactively created
