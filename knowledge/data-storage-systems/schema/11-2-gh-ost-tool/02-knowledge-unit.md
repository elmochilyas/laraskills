# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.2 gh-ost (GitHub's online schema migration tool for MySQL)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

gh-ost (GitHub Online Schema Translation) runs ALTER TABLE on MySQL without locks, triggers, or replicas. Creates a shadow table, streams binlog changes from the primary to keep the shadow table in sync, cuts over atomically. Supports throttling (replica lag, CPU), pause/resume, and dry-run mode. The safest MySQL schema migration tool.

---

# Core Concepts

- **Shadow table**: `_orders_gho` created with the desired schema. Triggerless — gh-ost uses binlog stream capture (hook on replicas or RDS binlog) to keep the shadow table in sync.
- **Cutover**: Atomic rename: rename original table (`orders→_orders_del`), rename shadow table (`_orders_gho→orders`). Instant (metadata only).
- **Throttle controls**: Replica lag threshold, CPU threshold, and manual `throttle` command. Pauses migration when load is high.

---

# Patterns

**gh-ost for large tables**: Tables > 50GB. gh-ost handles incremental copy + binlog streaming. Can pause/resume.

**gh-ost migration workflow**: (1) `gh-ost --alter "ADD COLUMN status INT" --table orders --execute`. (2) Monitor progress via `/tmp/gh-ost.orders.sock`. (3) Verify after cutover.

---

# Common Mistakes

**Running gh-ost without --exact-rowcount**: gh-ost estimates row count. Exact count via `SELECT COUNT(*)` takes time on large tables. Acceptable for accuracy.

---

# Related Knowledge Units

11.1 Zero-downtime taxonomy | 11.3 pt-online-schema-change
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

