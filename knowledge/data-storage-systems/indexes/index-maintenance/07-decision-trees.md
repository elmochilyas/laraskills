# 3-19 Index Maintenance - Decision Trees

## REINDEX vs pg_repack for Index Bloat Recovery

---

## Decision Context

Choosing between PostgreSQL REINDEX (with or without CONCURRENTLY) and pg_repack for rebuilding bloated indexes in production.

---

## Decision Criteria

* performance: REINDEX blocks writes; CONCURRENTLY avoids locks but takes longer
* architectural: pg_repack requires extension installation
* maintainability: REINDEX is built-in; pg_repack needs setup
* security: none

---

## Decision Tree

Index is bloated (>20%) — how to rebuild it?

↓

Can you accept a brief write lock?

YES → Use REINDEX (fastest, blocks writes)

    ↓
    PostgreSQL 12+: `REINDEX TABLE CONCURRENTLY index_name;`
    (CONCURRENTLY avoids exclusive lock)
    
    Pre-12: `REINDEX TABLE table_name;`
    (blocks ALL writes — plan maintenance window)

NO → Zero downtime required?

    YES → Use pg_repack (no exclusive lock)
    
        ↓
        Install: `CREATE EXTENSION pg_repack;`
        Run: `pg_repack -t table_name`
        
        ↓
        Takes longer but no write blocking
        Requires free disk space (table copy)
        
        Alternative: `REINDEX INDEX CONCURRENTLY` (PG 12+)
        
        ↓
        Which approach for zero downtime?
        
        pg_repack: rebuilds entire table + indexes
        CONCURRENTLY: rebuilds single index only
        
        → pg_repack for full table maintenance
        → CONCURRENTLY for single index maintenance

---

## Rationale

REINDEX is fast but blocks writes — acceptable in maintenance windows. pg_repack is zero-downtime but requires disk space and takes longer. CONCURRENTLY (PG 12+) bridges the gap for individual indexes.

---

## Recommended Default

**Default:** PostgreSQL 12+: `REINDEX INDEX CONCURRENTLY`; Pre-12: pg_repack for production
**Reason:** CONCURRENTLY is built-in and zero-downtime for single indexes. pg_repack is the fallback for older versions or full-table needs.

---

## Risks Of Wrong Choice

REINDEX without CONCURRENTLY in production: minutes of downtime for large tables. Not maintaining indexes: progressive performance degradation as bloat accumulates. Using pg_repack without enough disk space: operation fails mid-way.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Maintain and Rebuild Indexes for Bloat Management

---

## fillfactor Tuning for High-Update Tables

---

## Decision Context

Setting the `fillfactor` for B-Tree indexes on frequently updated columns to balance between page splits and index size.

---

## Decision Criteria

* performance: lower fillfactor = fewer page splits at cost of larger index
* architectural: determined at CREATE INDEX time
* maintainability: requires REINDEX to change
* security: none

---

## Decision Tree

Table has high UPDATE frequency on indexed columns?

↓

What's the update pattern?

↓

Frequent UPDATEs on indexed column (e.g., status changes)?

YES → Use lower fillfactor (70-80)

    ↓
    `CREATE INDEX ON orders (status) WITH (fillfactor = 70)`
    
    ↓
    30% free space per page for HOT updates (PostgreSQL)
    Reduces page splits
    Larger index (30% more storage)

NO → Append-only or rarely updated table?

    YES → Use default fillfactor (90) or even 100
        
        No updates → no page splits → fillfactor doesn't matter
        
        Exception: if you ever plan to update, keep default 90

NO → Balanced read/write workload?

    → Start with default 90, monitor bloat, reduce if needed

---

## Rationale

fillfactor reserves free space in each index page for future updates. With updates, the database can store the new tuple version in the same page (HOT update) if there's space. Without free space, updates cause page splits, fragmenting the index and creating bloat.

---

## Recommended Default

**Default:** 90 (default) for most tables; 70-80 for high-update columns
**Reason:** Default 90 is a good balance. Reduce for update-heavy workloads to reduce bloat. No benefit for append-only tables.

---

## Risks Of Wrong Choice

fillfactor too low: index is larger than necessary, wastes buffer pool memory. fillfactor too high on update-heavy columns: excessive page splits, index bloat, performance degradation.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Maintain and Rebuild Indexes for Bloat Management
