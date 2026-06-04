# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.18 Last-mile migration validation (pre-deployment checklist)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Before deploying a production migration, run a final validation checklist: verify database storage space, check for long-running queries that may block DDL, confirm backup is recent, test rollback plan, verify CI tests passed, run migration against staging with production-like data, check replica lag baseline, and schedule during maintenance window.

---

# Core Concepts

- **Storage check**: `SELECT SUM(data_length + index_length) / 1024 / 1024 AS size_mb FROM information_schema.tables WHERE table_name = 'orders'`. Ensure enough free space for shadow table/rebuild.
- **Query check**: `SHOW FULL PROCESSLIST` or `SELECT * FROM pg_stat_activity`. Kill long-running queries before migration.
- **Backup confirmation**: Verify recent backup exists. Run `SELECT NOW() - MIN(check_time)` on backup tooling.

---

# Patterns

**Pre-migration checklist script**: Artisan command that runs all checks. Exits with error if any check fails. `php artisan migrate:check`.

**Maintenance window**: Define migration window (e.g., 02:00-04:00 Sunday). Block deploys outside this window for risky migrations.

---

# Common Mistakes

**Skipping validation before production migration**: "It worked in staging" — staging data differs from production. Always run validation against production (read-only checks).

---

# Related Knowledge Units

11.16 Testing in CI | 11.10 Verification | 11.12 Migration locking
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

