# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-16 MySQL Instant DDL
**Generated:** 2026-06-03

---

# Decision Inventory

* INSTANT vs INPLACE vs COPY algorithm selection
* 64-version limit management
* Operation-specific algorithm support

---

# Architecture-Level Decision Trees

---

## MySQL DDL Algorithm Selection

---

## Decision Context

Choosing the lowest-impact DDL algorithm for MySQL schema changes, balancing operation support against the 64-version INSTANT limit.

---

## Decision Criteria

* performance: INSTANT = metadata-only (ms). INPLACE = rebuild (minutes). COPY = full copy (hours)
* architectural: operation determines algorithm availability
* maintainability: track INSTANT version count on frequently-migrated tables
* security: no impact

---

## Decision Tree

Performing DDL on a MySQL table?
↓
Does the operation support ALGORITHM=INSTANT?
YES → Use INSTANT
    ↓
    Has the table had ≥ 64 INSTANT operations?
    YES → Must use INPLACE or COPY for this operation
        → Track via INFORMATION_SCHEMA.INNODB_TABLES.TOTAL_ROW_VERSIONS
        → Schedule a periodic table rebuild to reset counter
    NO → INSTANT is safe
NO → Does the operation support ALGORITHM=INPLACE with LOCK=NONE?
    YES → Use INPLACE, LOCK=NONE (allows concurrent DML)
        → Adding/dropping indexes, adding FKs
    NO → Use ALGORITHM=COPY (full table rebuild)
        → Schedule during maintenance window
        → Blocks all DML

---

## Rationale

INSTANT DDL is the preferred choice for supported operations (primarily ADD COLUMN). The 64-version limit is a practical constraint — most tables won't reach it, but frequently-migrated tables need monitoring. INPLACE with LOCK=NONE is the next best option for operations that require a rebuild.

---

## Recommended Default

**Default:** ALGORITHM=INSTANT for column additions, ALGORITHM=INPLACE LOCK=NONE for indexes
**Reason:** INSTANT is metadata-only with zero application impact. INPLACE LOCK=NONE allows concurrent reads and writes during the rebuild.

---

## Risks Of Wrong Choice

* Assuming INSTANT works for all DDL: column drops and type changes cannot use INSTANT
* Hitting 64-version limit: subsequent INSTANT operations raise error 4080; fall back to INPLACE which may hold locks
* Not specifying algorithm explicitly: MySQL defaults to the lowest-impact algorithm but may silently choose COPY

---

## Related Rules

* Always specify explicit ALGORITHM and LOCK in production migrations
* Monitor INSTANT version count via TOTAL_ROW_VERSIONS

---

## Related Skills

* Execute MySQL DDL with appropriate ALGORITHM/LOCK options
