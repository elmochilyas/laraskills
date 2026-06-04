# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-10 Zero-Downtime Migration Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Expand-contract pattern vs shadow-table vs online DDL tool
* Instant DDL vs online tool selection per DB engine
* Backfill strategy and timing

---

# Architecture-Level Decision Trees

---

## Zero-Downtime Migration Strategy

---

## Decision Context

Choosing the correct approach for schema changes that must not block reads or writes on production tables.

---

## Decision Criteria

* performance: table copy operations double storage and I/O
* architectural: approach varies by database engine and operation type
* maintainability: expand-contract requires multiple deployments
* security: no direct impact

---

## Decision Tree

Need to alter a production table without downtime?
↓
Is the operation a simple ADD COLUMN in MySQL 8.0.12+?
YES → Use ALGORITHM=INSTANT (metadata-only, no downtime)
NO → Is it ADD COLUMN with DEFAULT in PostgreSQL 11+?
    YES → Instant (metadata-only, no rewrite)
    NO → Is it a simple additive change (add column, add index)?
        YES → Use expand-contract pattern:
            1. Add column (nullable)
            2. Deploy code (dual-write)
            3. Backfill data in chunks
            4. Enforce NOT NULL
            5. Remove old structures
        NO → Is it a complex change (column type change, index restructuring)?
            YES → Table size > 10M rows?
                YES → Use online DDL tool:
                    → MySQL: gh-ost or pt-online-schema-change
                    → PostgreSQL: pgroll or pg_repack
                NO → Standard ALTER TABLE (lock may be acceptable)

---

## Rationale

The expand-contract pattern is the most versatile and database-agnostic approach. Online DDL tools add operational complexity but are necessary for large tables where even brief locks are unacceptable. Instant DDL operations (MySQL INSTANT, PostgreSQL lazy DEFAULT) are the preferred first choice when available.

---

## Recommended Default

**Default:** Expand-contract pattern for most changes, instant DDL when available
**Reason:** Expand-contract works across all database engines and change types. Instant DDL is faster but limited to specific operations and versions.

---

## Risks Of Wrong Choice

* Dropping old column before all code references removed: delayed queue jobs fail
* Backfill in the same deploy as column addition: long-running transaction blocks
* INSTANT DDL 64-version limit reached: subsequent changes forced to INPLACE/COPY
* Dual-write bug: old and new columns drift apart

---

## Related Rules

* Add columns nullable first, then backfill, then enforce NOT NULL
* Never drop old columns until all code referencing them is removed

---

## Related Skills

* Execute zero-downtime schema migrations
