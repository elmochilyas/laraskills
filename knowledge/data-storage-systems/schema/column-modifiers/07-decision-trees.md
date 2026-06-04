# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-3 Column Modifiers
**Generated:** 2026-06-03

---

# Decision Inventory

* nullable vs NOT NULL with default
* virtualAs vs storedAs for generated columns
* Migration safety modifiers

---

# Architecture-Level Decision Trees

---

## Adding a Column to an Existing Table

---

## Decision Context

Choosing the correct modifiers when adding a new column to an existing table to prevent migration failures and downtime.

---

## Decision Criteria

* performance: storedAs adds write cost; virtualAs adds read cost
* architectural: modifier choice determines row storage format
* maintainability: NOT NULL on add requires handling existing rows
* security: default values may bypass app-level validation

---

## Decision Tree

Adding a column to an existing table with data?
↓
Will the column hold data for existing rows?
NO → Use nullable() (existing rows get NULL)
YES → Is zero-downtime required?
    YES → Use nullable() first, backfill, then change to NOT NULL
        → Multi-deploy pattern: add nullable, backfill, enforce NOT NULL
    NO → Use default($value) for required values
        → NOT NULL with default is safe if no table scan is triggered
↓
Is this a derived/computed column?
YES → virtualAs() or storedAs()?
    → Frequently queried, rarely written → virtualAs() (computed on read)
    → Frequently read, rarely changed → storedAs() (computed on write)

---

## Rationale

Nullable addition is the safest approach for existing tables — it never blocks reads/writes and never fails. NOT NULL with default can be instant in PostgreSQL 11+ but causes a table rewrite in MySQL. Generated columns should prefer virtualAs() for most cases to avoid write amplification.

---

## Recommended Default

**Default:** nullable() for new columns on existing tables
**Reason:** Zero risk of migration failure. Backfill and enforce NOT NULL in a separate deploy.

---

## Risks Of Wrong Choice

* NOT NULL without default on existing table: migration fails immediately
* Omitting modifiers in ->change(): existing defaults/indexes are lost
* storedAs() on write-heavy tables: significant write amplification

---

## Related Rules

* Always use nullable() or default() when adding columns to existing tables
* Re-specify ALL existing modifiers when using ->change()

---

## Related Skills

* Define column modifiers for data integrity
