# 7-17 Replication and Backups Strategy

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-17 |
| Knowledge Unit Title | Replication and Backups Strategy |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.1 Master-replica topology | 7.14 GTID-based replication |
| Last Updated | 2026-06-04 |

## Overview

Coordinating backups with replication is critical for data protection. Best practice is running backups on replicas to avoid I/O impact on the primary. Backups must record GTID/binlog positions for point-in-time recovery and the ability to provision new replicas from the backup.

---

## Core Concepts

- **Backup from replica**: Run backups on a low-lag replica to avoid primary I/O impact.
- **GTID position recording**: Backup must record the GTID or binlog position for PITR and replica provisioning.
- **Physical backup**: Raw data file copy (XtraBackup, pg_basebackup). Fast, but version-specific.
- **Logical backup**: SQL dump (mysqldump, pg_dump). Portable, slower, can restore individual tables.
- **Backup impact on replication**: Pausing replication IO thread during backup increases lag.

## When To Use

- Running database backups in replicated environment
- Minimizing backup impact on primary
- Ensuring backup consistency with replication state

## When NOT To Use

- Single-node database (simpler strategy)
- Cloud-managed backups (handled by provider)

## Best Practices

- Always run backups from a replica, not primary
- Record GTID/binlog position in every backup
- Test backup restore and replica provisioning regularly

## Architecture Guidelines

| Backup Source | Primary Impact | Replica Lag Impact | Data Consistency |
|-------------|---------------|-------------------|------------------|
| Replica | None | Increases during backup | GTID-consistent |
| Primary | High I/O | N/A | Latest state |
| Replica (paused replication) | None | Lag grows | GTID-consistent |

## Performance Considerations

- Physical backup: fastest but needs disk space equal to database
- Logical backup: slower, more portable
- Backup on replica: zero impact on primary

## Security Considerations

- Backup storage must be encrypted at rest and in transit
- Backup files contain all data — access must be restricted

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Running backup on primary | Convenience | Application slowdown from I/O | Use replica as backup source |
| 2 | No GTID position in backup | Forgetting metadata | Cannot provision replica from backup | Always record GTID/binlog position |
| 3 | Binary logs expire before backup | Short retention | Replication breaks after restore | Align binlog retention with backup schedule |

## Anti-Patterns

- Running backups on primary during peak hours
- Not testing backup restore before production
- Storing backups in same region as primary

## Verification

- [ ] Backups run on replica (not primary)
- [ ] Replica lag during backup stays acceptable
- [ ] Backup includes GTID/binlog position
- [ ] Backup restores successfully
- [ ] Retention policy applied
