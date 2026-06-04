# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.10 Verification during migrations (data integrity checks)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

After running a migration + backfill, verify data integrity before switching traffic. Checks: row count match (old vs new), checksum/aggregate match (SUM, MD5), sample comparison (random 1000 rows compared side-by-side), constraint validation (FK, UNIQUE, NOT NULL). Verification catches data corruption, truncation, and mapping errors.

---

# Core Concepts

- **Row count verification**: `SELECT COUNT(*) FROM old_table` vs `SELECT COUNT(*) FROM new_table`. Must match exactly.
- **Checksum verification**: `SELECT MD5(GROUP_CONCAT(column ORDER BY id)) FROM old_table` vs new table. Catches data differences.
- **Constraint verification**: `SELECT * FROM new_table WHERE constraint_column IS NULL` — finds NOT NULL violations. `SELECT orphan_column FROM new_table WHERE NOT EXISTS (SELECT 1 FROM referenced WHERE ...)` — finds FK violations.
- **Null/empty check**: Verify no unexpected NULLs in columns that should be filled.

---

# Patterns

**Automated verification script**: Run after backfill. Fail the deploy if any check fails. `php artisan migrate:verify --table=orders --old-connection=mysql --new-connection=mysql`.

**Verification in CI**: Migration verification runs in staging/test environment. Catches issues before production.

---

# Common Mistakes

**No verification before cutover**: "We'll correct it later" — old column is dropped, data is gone. Verify before contract phase.

---

# Related Knowledge Units

11.9 Data backfill | 11.16 Testing migrations in CI
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

