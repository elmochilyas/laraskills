# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.12 Migration locking (MySQL metadata locks, advisory locks for coordination)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

MySQL DDL statements acquire metadata locks (MDL) to prevent concurrent DDL/DML conflicts. `ALTER TABLE` acquires exclusive MDL. If a long-running query holds a shared MDL (during table access), the ALTER TABLE waits. Waiting ALTER blocks subsequent queries (MDL queue). Solution: `LOCK TABLE ... NOWAIT`, `GET_LOCK()` for coordination, or use online tools.

---

# Core Concepts

- **Metadata lock (MDL)**: MySQL 5.5+. Any query on a table acquires shared MDL. `ALTER TABLE` requires exclusive MDL. If a query holds shared MDL, ALTER waits.
- **MDL queue**: While ALTER waits for MDL, all subsequent queries on the table are blocked. A simple `SELECT * FROM orders WHERE id = 1` can cause a chain reaction.
- **Prevention**: Kill long-running queries before ALTER. Use `ALTER TABLE ... WAIT N` (MySQL 8.0+) or online tools.

---

# Patterns

**Check for blocking queries before migration**: `SELECT * FROM performance_schema.metadata_locks WHERE object_name = 'orders'`. Kill blockers before running migration.

**Advisory lock for multi-node coordination**: `SELECT GET_LOCK('migrate_orders', 30)` — ensures only one app server runs the migration.

---

# Common Mistakes

**Running ALTER TABLE during active query**: A reporting query holds shared MDL. ALTER waits. All subsequent queries queue. App outage.

---

# Related Knowledge Units

11.8 MySQL ALGORITHM | 9.6 Table-level locks
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

