# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-26 MySQL ALGORITHM/LOCK Options
**Generated:** 2026-06-03

---

# Decision Inventory

* ALGORITHM selection (INSTANT vs INPLACE vs COPY)
* LOCK mode selection (NONE vs SHARED vs EXCLUSIVE)
* Explicit vs default specification

---

# Architecture-Level Decision Trees

---

## MySQL Online DDL Algorithm & Lock Selection

---

## Decision Context

Choosing ALGORITHM and LOCK options for MySQL DDL operations to minimize application impact during schema changes.

---

## Decision Criteria

* performance: INSTANT is metadata-only; INPLACE rebuilds table; COPY duplicates it
* architectural: operation type determines available algorithms
* maintainability: explicit options prevent silent fallback to blocking COPY
* security: no direct impact

---

## Decision Tree

Specifying DDL options for a MySQL ALTER TABLE?
↓
Does the operation support ALGORITHM=INSTANT (metadata-only)?
YES → Use ALGORITHM=INSTANT, LOCK=NONE
    (Supported: ADD COLUMN 8.0.12+, RENAME COLUMN 8.0.28+, modify ENUM)
NO → Does the operation support ALGORITHM=INPLACE?
    YES → Use ALGORITHM=INPLACE, LOCK=NONE
        → Allows concurrent reads and writes
        (Supported: ADD/DROP INDEX, ADD/DROP FK, DROP COLUMN)
    NO → ALGORITHM=COPY is the only option
        → Use ALGORITHM=COPY, LOCK=EXCLUSIVE
        → Schedule during maintenance window
        → Blocks all reads and writes

---

## Rationale

ALGORITHM=INSTANT is always the best choice for supported operations. ALGORITHM=INPLACE with LOCK=NONE is acceptable for index and FK operations. ALGORITHM=COPY should be avoided in production — schedule it during a maintenance window. Specifying explicit ALGORITHM and LOCK prevents MySQL from silently falling back to COPY (which blocks all DML).

---

## Recommended Default

**Default:** Always specify explicit ALGORITHM and LOCK. Prefer INSTANT, then INPLACE with LOCK=NONE
**Reason:** Explicit specification prevents silent fallback to blocking COPY. Testing on staging first catches operations that don't support the chosen options.

---

## Risks Of Wrong Choice

* Not specifying ALGORITHM/LOCK: MySQL may choose COPY, blocking writes for extended duration
* Assuming INPLACE is always concurrent: some INPLACE operations require read/shared locks
* Operation doesn't support chosen options: migration fails with an error — test on staging first

---

## Related Rules

* Always specify explicit ALGORITHM and LOCK in production migrations
* Test DDL options on staging before production deployment

---

## Related Skills

* Execute MySQL DDL with optimal ALGORITHM and LOCK options
