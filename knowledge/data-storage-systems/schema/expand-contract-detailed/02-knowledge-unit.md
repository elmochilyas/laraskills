# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.6 Expand-contract pattern (add, backfill, switch readers, remove old)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Expand-contract (parallel change) is the safest zero-downtime migration pattern. Phase 1 (expand): add new column/table, write to both old and new. Application reads from old. Phase 2 (backfill): fill new structure with data. Phase 3 (switch): read from new, write to both. Phase 4 (contract): remove old code/column. Each phase is a deployable code change.

---

# Core Concepts

- **Phase 1 — Expand**: Deploy app update that writes to both old and new structures. Old structure is still source of truth for reads.
- **Phase 2 — Backfill**: Fill new structure with existing data (batch job). Not a deploy step.
- **Phase 3 — Switch**: Deploy app update that reads from new structure. Old structure is still written to (fallback).
- **Phase 4 — Contract**: Deploy app update that removes old structure writes and code. Old structure dropped.

---

# Patterns

**Column rename**: Expand: add new column `email_v2`, dual-write. Backfill: copy email to email_v2. Switch: read from email_v2. Contract: drop email.

**Table migration**: Expand: create `orders_v2`, dual-write. Backfill: copy orders to orders_v2. Switch: read from orders_v2. Contract: drop orders.

---

# Common Mistakes

**Skipping dual-write phase**: Direct switch from old to new without dual-write = rollback requires data backfill. Dangerous.

---

# Related Knowledge Units

11.1 Zero-downtime taxonomy | 11.9 Data backfill
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

