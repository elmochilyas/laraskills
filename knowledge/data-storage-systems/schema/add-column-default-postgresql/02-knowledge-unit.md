# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.7 ADD COLUMN with default in PostgreSQL (no lock, metadata-only)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

PostgreSQL 11+: `ALTER TABLE ... ADD COLUMN ... DEFAULT ...` is metadata-only — no table rewrite, no row lock. The default value is stored in the system catalog, not per row. Reading a row that was created before the column existed returns the default value without physical storage. This makes adding columns with defaults a zero-downtime operation.

---

# Core Concepts

- **Metadata-only column addition**: PostgreSQL stores the default value in `pg_attrdef`. Rows are not updated. `SELECT` reads the default from catalog for old rows.
- **No lock**: `ADD COLUMN ... DEFAULT (non-volatile)` takes only `ACCESS EXCLUSIVE` lock (blocks writes but is held briefly).
- **NOT NULL consideration**: Adding `NOT NULL` requires a full table scan (or PostgreSQL 11+ `NOT VALID` + VALIDATE).

---

# Patterns

**Add column with default in production**: `ALTER TABLE orders ADD COLUMN status INT DEFAULT 0;` — instant, no locking.

**Add NOT NULL in steps**: (1) Add column as nullable with default. (2) Backfill (already done by default). (3) `ALTER TABLE orders ALTER COLUMN status SET NOT NULL;` — if table is small, this is fast.

---

# Common Mistakes

**Volatile default**: `ALTER TABLE ... ADD COLUMN ... DEFAULT random()` — PostgreSQL 11+ still rewrites the table for volatile defaults. Use stable default.

---

# Related Knowledge Units

11.1 Zero-downtime taxonomy | 11.8 MySQL ALGORITHM options
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

