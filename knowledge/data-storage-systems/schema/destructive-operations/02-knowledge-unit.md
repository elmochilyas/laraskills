# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.13 Destructive operations (DROP COLUMN, DROP TABLE, TRUNCATE) safety
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Destructive DDL operations should never be the first step. Always: backup data → verify no references → run in expand-contract → wait for old-column usage to drop to zero → drop. DROP COLUMN is irreversible. TRUNCATE is irreversible. DROP TABLE is irreversible. Treat them as final steps after all rollback windows have passed.

---

# Core Concepts

- **DROP COLUMN risk**: Dropped column data is gone (MySQL) or requires VACUUM FULL to reclaim space (PostgreSQL). Restore from backup only.
- **DROP TABLE risk**: Table and all its data gone. FK constraints referencing this table will fail.
- **TRUNCATE risk**: All rows deleted. Cannot roll back (DDL, not DML, in some contexts). Faster than DELETE but irreversible.

---

# Patterns

**Safe DROP COLUMN**: (1) Add `_deprecated` suffix to column name (or rename). (2) Wait 2 weeks. Monitor for errors accessing the column. (3) If no errors, drop. (4) If errors, restore column.

**DROP TABLE checklist**: (1) Backup. (2) Check FK references. (3) Verify no code references the table. (4) Move to archive first (RENAME). (5) Wait 30 days. (6) Drop.

---

# Common Mistakes

**DROP COLUMN as part of standard migration**: "I added a column then dropped it in the next migration" — data is gone. Use expand-contract to allow rollback.

---

# Related Knowledge Units

11.11 Rollback planning | 11.6 Expand-contract
## Ecosystem Usage

gh-ost for MySQL trigger-free migrations. pt-online-schema-change for trigger-based MySQL. pgroll for PostgreSQL view-based migrations. Spirit as gh-ost successor for MySQL 8.0+.

## Failure Modes

Trigger overhead from pt-osc degrades write performance. gh-ost cut-over fails under high write load. Insufficient disk space during online DDL.

## Performance Considerations

Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

## Production Considerations

Test full migration flow in staging. Monitor disk space during migration. Have rollback plan for every phase.

## Research Notes

Spirit provides faster row copying for MySQL 8.0+. pgroll view-based approach avoids trigger overhead. Industry trends toward application-level orchestration.

## Internal Mechanics

gh-ost creates ghost table, copies rows in chunks, streams binlog, atomically swaps. pt-osc uses triggers. pgroll creates PostgreSQL views.

## Architectural Decisions

gh-ost: MySQL 8.0+, binlog trigger-free, millisecond lock. pt-osc: MySQL 5.7+, trigger-based, millisecond lock. pgroll: PostgreSQL 14+, view-based, no exclusive locks.

## Tradeoffs

Zero-downtime DDL requires complex tool setup. Reversible migrations only with PostgreSQL. Trigger-free requires binlog enabled.

## Mental Models

Online schema changes use shadow table strategy. Think of changing a tire while the car is moving.

