# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.8 MySQL ALGORITHM options (INSTANT, INPLACE, COPY) and LOCK options (NONE, SHARED, EXCLUSIVE)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

MySQL ALTER TABLE supports three algorithms: INSTANT (metadata only — MySQL 8.0.12+), INPLACE (rebuilds table but allows concurrent DML), COPY (full table copy, blocks DML). LOCK options: NONE (no lock — concurrent reads/writes), SHARED (read lock — concurrent reads), EXCLUSIVE (exclusive lock — no concurrent access). Choose algorithm + lock for zero-downtime DDL.

---

# Core Concepts

- **INSTANT**: ALGORITHM=INSTANT. Operations: ADD COLUMN (append only), DROP COLUMN (MySQL 8.0.29+), ADD/DROP DEFAULT, RENAME COLUMN (8.0.29+). Metadata only. No table rebuild.
- **INPLACE**: ALGORITHM=INPLACE. Operations: ADD/DROP INDEX, ADD/DROP FK, CHANGE COLUMN type (some). Rebuilds table. Concurrent DML allowed (LOCK=NONE).
- **COPY**: ALGORITHM=COPY. All operations that can't use INSTANT/INPLACE. Full table copy. Blocks DML.

---

# Patterns

**INSTANT for column additions**: `ALTER TABLE orders ADD COLUMN status INT, ALGORITHM=INSTANT, LOCK=NONE` — instant, no locking.

**INPLACE for index creation**: `CREATE INDEX idx_status ON orders(status), ALGORITHM=INPLACE, LOCK=NONE` — no downtime.

**Avoid COPY in production**: `ALTER TABLE orders MODIFY COLUMN id BIGINT` (may use COPY). Check before running.

---

# Common Mistakes

**Adding column in non-append position**: MySQL INSTANT only supports append (adding column at end). Adding a column in the middle of column order requires INPLACE or COPY.

---

# Related Knowledge Units

13.5 Online DDL | 13.6 ALGORITHM=INSTANT
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

