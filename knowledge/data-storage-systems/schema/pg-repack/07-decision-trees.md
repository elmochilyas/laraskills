# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-15 pg_repack
**Generated:** 2026-06-03

---

# Decision Inventory

* pg_repack vs autovacuum for bloat management
* Full table repack vs index-only repack
* Scheduled vs reactive repack scheduling

---

# Architecture-Level Decision Trees

---

## PostgreSQL Bloat Management Strategy

---

## Decision Context

Choosing between autovacuum and pg_repack for managing table and index bloat in high-write PostgreSQL environments.

---

## Decision Criteria

* performance: pg_repack requires ~2x table disk space; bloat >20% degrades query performance
* architectural: pg_repack avoids ACCESS EXCLUSIVE lock during rebuild
* maintainability: scheduled pg_repack reduces ongoing autovacuum pressure
* security: no direct impact

---

## Decision Tree

PostgreSQL table has significant bloat?
↓
Check bloat level using pgstattuple or bloat query
↓
Is bloat < 20%?
YES → Tune autovacuum settings
    → Increase autovacuum_work_mem
    → Decrease autovacuum_vacuum_scale_factor
    → Schedule more frequent autovacuum runs
NO → Use pg_repack
    ↓
    Is the bloat in both table and indexes?
    YES → Full table repack (reclaims both)
    NO → Index-only repack (if only indexes are bloated)
    ↓
    Is sufficient free space available (~2x table size)?
    YES → Schedule pg_repack during low traffic
    NO → Free up space or increase disk capacity first

---

## Rationale

Autovacuum is the first line of defense against bloat. When bloat exceeds 20%, autovacuum alone cannot keep up, and pg_repack is needed to physically compact the table. Regular pg_repack scheduling prevents bloat from accumulating to problematic levels.

---

## Recommended Default

**Default:** Monitor bloat weekly; run pg_repack when bloat > 20%
**Reason:** Autovacuum handles low-level bloat. pg_repack handles the compaction that autovacuum cannot, restoring query performance.

---

## Risks Of Wrong Choice

* Disk space exhaustion: pg_repack requires ~2x table space; insufficient space causes failure
* Exclusive lock wait: final swap waits if a long-running query holds a conflicting lock
* Trigger conflicts: pg_repack triggers may conflict with CDC or replication triggers
* WAL explosion: high-write tables generate significant WAL during repack

---

## Related Rules

* Monitor bloat levels regularly with pgstattuple
* Ensure sufficient free disk space before running pg_repack

---

## Related Skills

* Reclaim PostgreSQL storage with pg_repack
