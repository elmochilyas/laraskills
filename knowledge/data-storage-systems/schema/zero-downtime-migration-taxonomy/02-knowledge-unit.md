# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.1 Zero-downtime migration taxonomy (expand-contract, online DDL, shadow tables)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Zero-downtime migrations prevent application outages during schema changes. Three approaches: expand-contract pattern (add new column/app code/remove old — multi-deploy), online DDL (database-native: MySQL INSTANT/INPLACE, PostgreSQL without locks), shadow tables (create new table, dual-write, swap). Choose based on migration type, database engine, and risk tolerance.

---

# Core Concepts

- **Expand-contract**: Step 1 (expand): add column, app writes to both old and new. Step 2 (migrate): backfill data. Step 3 (contract): remove old column/app code. Multi-deploy, safe.
- **Online DDL**: MySQL `ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE` — non-blocking DML during DDL. PostgreSQL `ALTER TABLE ... ADD COLUMN` — fast if no default.
- **Shadow table**: Create `new_orders` with desired schema. Set up triggers or dual-write. Backfill data. Atomic rename.

---

# Patterns

**Expand-contract for risky migrations**: Column type changes, constraint additions, nullable→NOT NULL. Multiple deploys, rollback-safe at each step.

**Online DDL for simple additions**: Add column, add index. Use MySQL ALGORITHM=INPLACE or PostgreSQL native.

---

# Common Mistakes

**Blocking ALTER TABLE in production**: `ALTER TABLE ... ALGORITHM=COPY` locks table for minutes/hours. Production outage. Always check algorithm.

---

# Related Knowledge Units

11.6 Expand-contract | 11.2 gh-ost | 11.3 pt-online-schema-change
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

