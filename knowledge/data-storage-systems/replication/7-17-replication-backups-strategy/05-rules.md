# 7-17 Replication and Backups Strategy - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-17 |
| Knowledge Unit | 7-17 Replication and Backups Strategy |
| Total Rules | 3 |
| Generated | 2026-06-04 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Backup From Replica, Not Primary
---
## Category
Operations
---
## Rule
Always run database backups from a replica, never from the primary, to avoid I/O impact on production traffic.
---
## Reason
Backup I/O on the primary competes with production read/write traffic, causing application slowdowns.
---
## Bad Example
Running mysqldump on the primary at peak hours.
---
## Good Example
Run XtraBackup or pg_basebackup on a low-lag replica during off-peak hours.
---
## Exceptions
No replica is available, or replica lag is too high to produce a consistent backup.
---
## Consequences Of Violation
Production database performance degradation during backup window.

---

## 2. Never Forget GTID/Binlog Position in Backup Metadata
---
## Reliability
---
## Rule
Always record the GTID or binlog position in every backup's metadata for point-in-time recovery.
---
## Reason
Without GTID/binlog position, a restored backup cannot be used as a replica or for point-in-time recovery.
---
## Bad Example
Taking a mysqldump without --master-data or --dump-slave (no binlog position recorded).
---
## Good Example
MySQL: XtraBackup automatically records GTID. pg_dump: record WAL position separately.
---
## Exceptions
Backups used only for logical data export (not for replica provisioning).
---
## Consequences Of Violation
Cannot set up replication from restored backup. Must do full data resync.

---

## 3. Always Test Backup Restore and Replica Provisioning
---
## Operations
---
## Rule
Always test the full backup restore and replica provisioning process at least quarterly.
---
## Reason
Untested backups are unreliable — corruption, version mismatches, or metadata gaps go undetected.
---
## Bad Example
Assuming backups work because the script runs without errors.
---
## Good Example
Quarterly restore drill: take backup, restore to test instance, verify data, set up as replica.
---
## Exceptions
Cloud-managed databases with provider SLA on backup restore.
---
## Consequences Of Violation
Backup unusable when needed, extending recovery time beyond RTO.

---
