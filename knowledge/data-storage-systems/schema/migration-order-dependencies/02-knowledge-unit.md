# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.17 Migration order dependencies (foreign keys, referenced tables)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Migration order matters: referenced tables must be created before referencing tables. Laravel's migration filenames are prefixed with timestamps — executed in order. When adding an FK, ensure the referenced table exists before running the FK migration. Circular dependencies require deferred FK addition.

---

# Core Concepts

- **Timestamp ordering**: `2026_01_01_000001_create_users_table.php` runs before `2026_01_02_000001_create_orders_table.php`. Order determined by filename prefix.
- **FK addition**: Add FK after both tables exist. Separate migration: `2026_01_03_000001_add_user_fk_to_orders.php`.
- **Circular dependencies**: Table A references Table B, and Table B references Table A. Create tables without FK, then add FK in subsequent migration.

---

# Patterns

**Create tables → Add columns → Add constraints**: Standard migration sequence. Create all tables first, then add columns, then add FKs, then add indexes.

**Deferred FK validation**: `ALTER TABLE ... ADD CONSTRAINT ... NOT VALID` (PostgreSQL). Add FK without validating existing data. Validate later.

---

# Common Mistakes

**Creating FK in the same migration as the table**: `Schema::create('orders', fn($table) => $table->foreignId('user_id')->constrained())` — the `users` table must be created in an earlier migration.

---

# Related Knowledge Units

1.13 Migration structure | 15.1 Foreign key constraints
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

