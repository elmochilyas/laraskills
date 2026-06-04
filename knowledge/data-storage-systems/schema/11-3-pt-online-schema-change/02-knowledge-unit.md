# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.3 pt-online-schema-change (Percona Toolkit trigger-based online migration)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

pt-online-schema-change (pt-osc) uses triggers to keep a shadow table in sync. Creates a copy of the table, adds triggers (INSERT/UPDATE/DELETE) on the original table replicating changes to the shadow table. Runs `ALTER TABLE` on the shadow table (no lock), then atomic rename. Works on all MySQL versions.

---

# Core Concepts

- **Trigger-based sync**: AFTER INSERT/UPDATE/DELETE triggers on the original table write changes to the shadow table. Overhead: triggers fire on every DML. ~5-10% performance impact during migration.
- **Chunked copy**: Copies data in chunks (default 1000 rows per chunk). Sleep between chunks. Chunk size configurable.
- **Dry run**: `pt-online-schema-change --dry-run` — checks for FK issues, triggers, replicas. No actual migration.

---

# Patterns

**pt-osc for older MySQL (< 5.6)**: MySQL versions before 5.6 don't support online DDL. pt-osc is the only zero-downtime option.

**pt-osc with foreign keys**: Requires `--alter-foreign-keys-method=auto`. Rebuilds FK relationships on the new table.

---

# Common Mistakes

**Trigger overhead on write-heavy tables**: Triggers add latency to every INSERT/UPDATE/DELETE. For tables with > 1000 writes/second, use gh-ost (triggerless).

---

# Related Knowledge Units

11.1 Zero-downtime taxonomy | 11.2 gh-ost
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

