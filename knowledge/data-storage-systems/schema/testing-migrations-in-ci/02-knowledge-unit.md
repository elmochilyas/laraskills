# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.16 Testing migrations in CI (syntax checks, dry runs, data integrity)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Migrations should be tested in CI: syntax check (PHP lint on migration files), dry run (run `migrate --pretend` against CI database), forward/rollback test (migrate then rollback, verify reversibility), and data integrity test (seed data, run migration, verify data). Prevents migration failures during deployment.

---

# Core Concepts

- **Syntax check**: `php -l database/migrations/*.php`. Catches PHP syntax errors in migration files.
- **Dry run**: `php artisan migrate --pretend --database=testing`. Outputs SQL without executing. Catches syntax errors in raw SQL.
- **Forward/rollback**: `php artisan migrate` then `php artisan migrate:rollback` in CI. Verifies `down()` works.
- **Seed + migrate + verify**: Seed test data, run migration, verify data integrity (row counts, column values).

---

# Patterns

**CI migration test workflow**: (1) Create test DB. (2) `php artisan migrate:fresh`. (3) Seed data. (4) Run new migrations. (5) Verify. (6) Rollback. (7) Verify rollback restored previous state.

**Multi-DB migration test**: Test migrations on each connection type (tenant, central, reporting) in CI.

---

# Common Mistakes

**No migration testing in CI**: Migration deploys to production, fails (syntax error, constraint violation). Entire deployment is blocked.

---

# Related Knowledge Units

11.15 Canary | 11.10 Verification
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

