# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-27 Online Index Creation
**Generated:** 2026-06-03

---

# Decision Inventory

* CONCURRENTLY vs standard index creation (PostgreSQL)
* Single-migration vs combined operations
* Index creation timing: during deploy vs separate window

---

# Architecture-Level Decision Trees

---

## Online Index Creation Strategy

---

## Decision Context

Choosing between concurrent (non-blocking) and standard index creation based on table size, write load, and maintenance window availability.

---

## Decision Criteria

* performance: CONCURRENTLY takes 2-3x longer but doesn't block writes
* architectural: CONCURRENTLY cannot run inside a transaction
* maintainability: each CONCURRENTLY index needs its own migration file
* security: no impact

---

## Decision Tree

Creating an index on a production table?
↓
Is the table < 1M rows or in a maintenance window?
YES → Use standard CREATE INDEX (simpler, faster)
NO → Is the table actively written to 24/7?
    YES → Use CONCURRENTLY (PostgreSQL) or equivalent online method
        ↓
        PostgreSQL: CREATE INDEX CONCURRENTLY
        → MUST be in its OWN migration file (cannot run inside transaction)
        → Use raw DB::statement('CREATE INDEX CONCURRENTLY ...')
        → Multiple indexes = multiple migration files
        → Monitor for invalid index on failure
    NO → Standard index during low-traffic window
        → Acceptable if brief lock is tolerable

---

## Rationale

CONCURRENTLY index creation prevents write blocking but comes with constraints: no transaction context, own migration file per index, and 2-3x slower. Standard index creation is simpler but blocks writes for the duration. The choice depends on whether the table is actively being written to.

---

## Recommended Default

**Default:** CONCURRENTLY for tables > 1M rows under live traffic, standard for smaller/quiescent tables
**Reason:** CONCURRENTLY avoids write blocking at the cost of longer build time and migration complexity. Standard is simpler but blocks writes.

---

## Risks Of Wrong Choice

* Running CONCURRENTLY inside a transaction: PostgreSQL raises an error
* Multiple CONCURRENTLY in one migration: second one fails due to implicit commit
* Failed CONCURRENTLY leaves invalid index: must be dropped before retry
* Standard index on large active table: blocks writes for minutes to hours

---

## Related Rules

* Each CONCURRENTLY index requires its own migration file
* Never run CONCURRENTLY inside a transaction

---

## Related Skills

* Create indexes online with PostgreSQL CONCURRENTLY
