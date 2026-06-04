# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.5 pgroll (PostgreSQL zero-downtime migration tool)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

pgroll is a PostgreSQL migration tool that creates a new version of the schema, supports dual-write (write to both old and new schema), and cuts over atomically. Unlike MySQL tools, pgroll is PostgreSQL-native, understanding PostgreSQL features (NOT VALID, GENERATED columns, RLS). Provides rollback capability without data loss.

---

# Core Concepts

- **Version-based**: Create schema version V2 alongside V1. Write to both during migration. Reads served from V1 until cutover.
- **PostgreSQL-native**: Uses PostgreSQL features: `NOT NULL` via `NOT VALID`, defaults via `SET DEFAULT`, column renames via views.
- **Rollback**: Since V1 schema/data is preserved during migration, rollback is instant (just stop writing to V2).

---

# Patterns

**pgroll for production**: Run pgroll in `--mode=read-write` (dual-write). Monitor. At cutover, switch to `--mode=read-write-new` (reads from new schema). Then `--complete`.

**pgroll for NOT NULL addition**: Add column as nullable. Backfill. `pgroll` changes constraint to NOT NULL via `NOT VALID` — no table scan.

---

# Common Mistakes

**pgroll requires dual application awareness**: Application must be compatible with both V1 and V2 schemas during migration.

---

# Related Knowledge Units

11.1 Zero-downtime taxonomy | 11.6 Expand-contract
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

