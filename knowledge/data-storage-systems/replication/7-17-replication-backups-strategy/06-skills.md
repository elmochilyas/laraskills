# Skill: Implement Replication and Backups Strategy

## Purpose

Coordinate replication with backup schedules to ensure backups capture consistent states without impacting replication health or data integrity.

## When To Use

- Running database backups in a replicated environment
- Need to minimize backup impact on primary
- Using replicas for backup sources (recommended)
- Ensuring backup consistency with replication state

## When NOT To Use

- Single-node database (backup strategy simpler)
- Cloud-managed backups (handled by provider)
- Replica lag too high to use replica as backup source

## Prerequisites

- Replication topology with at least one replica
- Backup tool (mysqldump, XtraBackup, pg_dump, pg_basebackup)
- Disk space for backups

## Inputs

- Primary host
- Replica host(s) used for backup
- Backup schedule
- Retention policy
- RPO/RTO requirements

## Workflow (numbered steps)

1. Choose backup source:
   - **Replica** (recommended): run backups from a low-lag replica to avoid primary I/O impact
   - **Primary**: only if no replica available or replica lag is too high
2. For physical backups (XtraBackup, pg_basebackup) on replica:
   - Stop replication IO thread or application threads to get consistent snapshot
   - Take backup while replica shows data at a known GTID position
   - Record GTID or LSN of backup for point-in-time recovery
3. For logical backups (mysqldump, pg_dump) on replica:
   - Use `--single-transaction` (MySQL) or consistent snapshot (PostgreSQL)
   - Record GTID position in backup (MySQL: `SHOW MASTER STATUS`; PostgreSQL: WAL position)
4. Integrate with replication monitoring:
   - Pause replication IO thread if lag is too high (don't overload replica)
   - Resume replication after backup completes
5. Verify backup:
   - Restore backup to a test instance
   - Verify replication can be set up from the backup (GTID continuity)

## Validation Checklist

- [ ] Backups run on replica (not primary)
- [ ] Replica lag during backup stays within acceptable range
- [ ] Backup includes GTID/binlog position for point-in-time recovery
- [ ] Backup restores successfully and replication works from restored instance
- [ ] Retention policy applied (old backups deleted)
- [ ] Backup monitoring and alerting configured

## Common Failures

- Running backup on primary — I/O impact causes application slowdown
- Backup on replica stops replication IO thread — lag accumulates
- Backup doesn't record GTID position — can't set up new replica from backup
- Restored backup can't be used as replica (GTID gap)
- Binary logs expire before backup is taken (replication breaks)

## Decision Points

- Replica vs primary for backup source
- Physical vs logical backup
- Pause replication vs backup during active replication
- Backup retention and frequency

## Performance Considerations

- Physical backup: faster, but needs same disk space as database
- Logical backup: slower, more portable, can be selective
- Backup on replica: zero impact on primary
- Replication IO paused during backup: lag increases at primary write rate * backup duration

## Security Considerations

- Backup storage must be encrypted (at rest and in transit)
- Backup files contain all data — access must be restricted
- Backups should be stored in different region/account from primary

## Related Rules

- 7-17-1: Always Backup From Replica, Not Primary
- 7-17-2: Never Forget GTID/Binlog Position in Backup Metadata

## Related Skills

- Implement Database Backup Strategy
- Implement Point-in-Time Recovery
- Implement Replica Provisioning from Backup

## Success Criteria

- Backups run regularly on replica without impacting primary
- Backup includes replication position for point-in-time recovery
- Restored backup can be used as new replica
- Backup retention and compliance met
