# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-24 Schema & Data Migration Separation
**Generated:** 2026-06-03

---

# Decision Inventory

* Schema migration vs data migration file separation
* Synchronous vs asynchronous data migration dispatch
* Rollback independence strategy

---

# Architecture-Level Decision Trees

---

## Migration Type Separation Strategy

---

## Decision Context

Determining whether a schema change should be split into separate files for DDL and DML operations.

---

## Decision Criteria

* performance: DDL is fast (ms-s); DML can be hours-long
* architectural: schema must exist before data can reference it
* maintainability: separate files enable independent rollback
* security: no direct impact

---

## Decision Tree

Writing a migration that adds a column AND populates it?
↓
Is the data operation a simple DEFAULT value?
YES → Combine with the schema change (single migration)
    → ALTER TABLE ADD COLUMN col type DEFAULT value
NO → Does the data operation require computation or external data?
    YES → SEPARATE into two files:
        1. Schema migration: DDL only (add column, nullable or default)
        2. Data migration: dispatches a queued backfill job
        → Schema migration runs synchronously in deploy
        → Data migration dispatches job, completes asynchronously
    NO → Is the data operation a simple UPDATE that takes < 1 second?
        → Combine in single migration file
        → Acceptable risk for very small tables

---

## Rationale

Schema changes (DDL) are fast and must complete before code that depends on them is deployed. Data changes (DML) can take hours and should not block deployment. Separate files enable the schema deploy to complete quickly while the data migration runs asynchronously via queue workers.

---

## Recommended Default

**Default:** Separate files for schema and data migrations when data change takes > 1 second
**Reason:** Schema migration completes quickly; data migration runs async. Enables independent rollback and retry.

---

## Risks Of Wrong Choice

* Heavy UPDATE in schema migration: blocks deployment, may time out
* Data migration before schema migration: queued job references column that doesn't exist yet
* Orphaned data migration: migration recorded as "run" but job not tracked

---

## Related Rules

* Never put heavy data operations in the same file as schema changes
* Data migrations should dispatch queue jobs, not process data directly

---

## Related Skills

* Separate schema and data migrations for deployment safety
