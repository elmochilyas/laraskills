# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.10 Zero-downtime migration patterns (expand-contract, shadow-table)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Zero-downtime migrations allow schema changes on production databases without blocking reads or writes. The expand-contract pattern is the most versatile approach: add columns/ tables, deploy code that uses both old and new, then remove old structures. Shadow-table operations involve creating a new table alongside the old one, migrating data, and swapping. These patterns decouple schema changes from code deployments, enabling safe evolution under live traffic.

---

# Core Concepts

- **Expand-contract (add, dual-write, backfill, drop)**: Multi-phase pattern where new schema elements are added first, code is updated to write to both, data is backfilled, reads are migrated, and old elements are removed — all across separate deployments.
- **Shadow-table**: Create an exact copy of the table, apply changes to the shadow, migrate data, atomically swap via RENAME TABLE.
- **Online DDL tools**: Third-party tools (gh-ost, pt-online-schema-change, pgroll, Spirit) automate the shadow-table approach for specific operations (ALTER TABLE, index creation).
- **MySQL instant DDL**: `ALGORITHM=INSTANT` for adding columns (8.0.12+) — a metadata-only change with no table copy.
- **PostgreSQL lazy ADD COLUMN DEFAULT**: Adding a column with a non-volatile DEFAULT is metadata-only (no rewrite) since PostgreSQL 11.

---

# Mental Models

Schema changes are deployments, not just database operations. Every DDL is a potential outage. Zero-downtime patterns treat schema changes as distributed system operations with a compatibility window where old and new code must coexist.

---

# Internal Mechanics

**Expand-contract phases**:
1. **Add**: Deploy migration that adds the new column (nullable), creates the new index, or creates the new table. Old code continues to work unchanged.
2. **Dual-write**: Deploy code that writes to both old and new columns/tables. Old reads still use old columns. New reads can use new columns optionally.
3. **Backfill**: Populate new column's NULL values in batches (queued jobs, chunked processing).
4. **Dual-read**: Switch reads to new column/table. Verify correctness. Keep old as fallback.
5. **Remove**: In a separate deployment, drop old column/table. This is destructive — must ensure no code references old structures.

**Shadow-table**: CREATE new table, trigger-based/binary-log-based sync, atomic RENAME TABLE old TO old_backup, new TO old.

---

# Patterns

**Add column nullable then enforce NOT NULL later**: Phase 1: `$table->string('slug')->nullable()`. Phase 2: Backfill data. Phase 3: `$table->string('slug')->nullable(false)->change()`. This prevents locking on addition.

**Add column with DEFAULT in PostgreSQL 11+**: `ALTER TABLE ADD COLUMN slug VARCHAR(255) DEFAULT ''` is instant — no table rewrite. This is the only safe way to add a non-nullable column with a default.

**Rename column via add + backfill + drop (never ALTER RENAME)**: ALTER RENAME is exclusive-locked. Instead, add new column, dual-write, backfill, switch reads, drop old.

---

# Architectural Decisions

| Pattern | Best For | Avoid When |
|---------|----------|------------|
| Expand-contract | Adding/removing columns, complex changes | Simple additive changes (use instant DDL) |
| Shadow-table (gh-ost) | Large table ALTER (indexes, column types) | Tables < 10M rows (table copy cost may not justify tooling overhead) |
| Instant DDL | Adding columns (MySQL 8.0.12+), adding DEFAULT (PG 11+) | Complex changes requiring table rebuild |
| pgroll | PostgreSQL migrations requiring safe rollback | MySQL environments |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Zero application downtime | Multiple deployments per change | Longer time to complete a schema evolution
Safe rollback at any phase | Increased complexity, coordination overhead | More deploy scripts, more monitoring
No table locks | Dual-write doubles write workload temporarily | Increased database load during transition period
Code-schema compatibility | Must maintain backward-compatible code | More conditional logic in application

---

# Performance Considerations

- Dual-write phase doubles INSERT/UPDATE throughput to the affected tables. Monitor database write capacity.
- Backfill operations should be throttled to avoid replication lag and resource contention. Use chunked processing with rate limiting.
- Shadow-table operations double storage temporarily (the shadow table exists alongside the original).
- gh-ost/throttle mechanisms monitor replication lag, thread count, and load to self-regulate.

---

# Production Considerations

- **Compatibility window**: Old code must work with new schema and new code must work with old schema during transitions.
- **Rollback planning**: Each phase must have a documented rollback plan. If phase 2 fails, the database still has the old schema — rollback is deploying the previous code version.
- **Monitoring**: Track dual-write success rates, backfill progress, and replica lag during zero-downtime operations.
- **Destructive operations require a compatibility window**: Drop a column only after verifying that no code (including queue jobs, delayed tasks) references it. 24-48 hours is a minimum.

---

# Common Mistakes

**Dropping old column before all code is updated**: A queue job that was delayed runs after the column is dropped. It references the old column and fails. Compatibility window must account for all running code paths.

**Backfill in the same deploy as column addition**: The backfill may take hours on a large table, holding a transaction open. Use separate queued jobs with chunked processing.

**Assuming INSTANT DDL is always available**: MySQL's ALGORITHM=INSTANT has a 64-version limit — after 64 INSTANT changes to a table, it must use INPLACE or COPY.

---

# Failure Modes

- **Partial backfill**: Backfill job fails halfway. The column has mixed NULL/populated values. Application code reading the new column gets inconsistent data.
- **Dual-write bug**: Application writes to old column but not new column, or writes different values to each. The columns drift, and switching reads produces incorrect results.
- **Table rename race**: In shadow-table swaps, the RENAME TABLE operation (MySQL) requires an exclusive lock. Brief write unavailability occurs during the atomic swap.

---

# Ecosystem Usage

`daursu/laravel-zero-downtime-migration` integrates gh-ost and pt-online-schema-change with Laravel migrations. `tpetry/laravel-postgresql-enhanced` provides partition-aware migration support. Laravel's own migration system doesn't natively support zero-downtime patterns — they require tooling and custom scripts.

---

# Related Knowledge Units

1.11 gh-ost tool | 1.12 pt-online-schema-change | 1.14 pgroll tool | 1.16 MySQL instant DDL | 1.17 PostgreSQL lazy ADD COLUMN DEFAULT | 1.18 Expand-contract pattern detailed | 1.19 Data backfill strategies

---

# Research Notes

The expand-contract pattern is the most universally applicable zero-downtime approach. It works regardless of database engine or version. Teams should default to expand-contract for all non-trivial schema changes and use instant DDL only for verified compatible operations. The most common production incident involving zero-downtime migrations is the "dropped-too-soon" mistake — a column is removed before all queue jobs and delayed code paths stop referencing it.
