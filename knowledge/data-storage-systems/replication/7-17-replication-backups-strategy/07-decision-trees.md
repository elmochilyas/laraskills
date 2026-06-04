# Decision Trees for 7-17 Replication and Backups Strategy

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-17 |
| Title | Replication and Backups Strategy |
| Decision Type | Replication |

## Decision Inventory

- D1: Backup source selection (replica vs primary)
- D2: Backup type (physical vs logical)
- D3: GTID position recording for point-in-time recovery

## Architecture-Level Decision Trees

### D1: Backup source selection (replica vs primary)

**Decision Context**: Choose whether to run backups from the primary or a replica.

**Criteria**:
- Primary I/O sensitivity
- Replica availability
- Replica lag impact

**Tree**:
```
Is a replica available with acceptable lag?
├── Yes → Run backups from replica
│   Zero I/O impact on primary
└── No → Run from primary (accept I/O impact)
    Schedule during low-traffic period
```

**Rationale**: Running backups on the primary adds I/O load that competes with production traffic. Replicas are the recommended backup source.

**Default**: Always backup from a replica when available.

**Risks**: Backup on replica stops replication IO thread, increasing lag. Ensure lag recovers after backup completes.

**Related Rules/Skills**: 7-17-1 (always backup from replica, not primary)

---

### D2: Backup type (physical vs logical)

**Decision Context**: Choose between physical (XtraBackup, pg_basebackup) and logical (mysqldump, pg_dump) backups.

**Criteria**:
- Recovery speed requirement
- Storage budget
- Granularity needs

**Tree**:
```
Is fast recovery more important than granular restore?
├── Yes → Physical backup
│   - Faster backup and restore
│   - Needs same disk space as database
└── No → Logical backup
    - Slower, more portable
    - Can restore individual tables
```

**Rationale**: Physical backups copy raw data files for fast restore. Logical backups produce portable SQL that can restore specific tables.

**Default**: Physical backup for full database recovery; logical backup for selective recovery.

**Risks**: Physical backups must match database version. Logical backups are slower for large databases.

**Related Rules/Skills**: 7-17-2 (never forget GTID/binlog position in backup metadata)

---

### D3: GTID position recording for point-in-time recovery

**Decision Context**: Record replication position in backup metadata.

**Criteria**:
- PITR requirements
- Replica provisioning from backup
- GTID consistency

**Tree**:
```
Is point-in-time recovery required?
├── Yes → Record GTID/binlog position in backup metadata
│   MySQL: SHOW MASTER STATUS or SHOW SLAVE STATUS
│   PostgreSQL: WAL position
└── No → Record anyway (defensive practice)
```

**Rationale**: GTID position is required to set up replication from a restored backup. Without it, restored instances cannot be used as replicas.

**Default**: Always record GTID/binlog position in backup metadata.

**Risks**: Missing GTID position prevents replica provisioning from backup, requiring full data resync.

**Related Rules/Skills**: 7-17-2 (never forget GTID/binlog position in backup metadata)

---
