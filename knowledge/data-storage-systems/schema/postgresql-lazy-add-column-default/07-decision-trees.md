# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-17 PostgreSQL Lazy ADD COLUMN DEFAULT
**Generated:** 2026-06-03

---

# Decision Inventory

* ADD COLUMN with default vs nullable first + backfill
* Volatile vs non-volatile default expressions
* NOT NULL enforcement timing

---

# Architecture-Level Decision Trees

---

## PostgreSQL Column Addition Strategy

---

## Decision Context

Choosing between instant metadata-only column addition (PG 11+) and the multi-phase nullable + backfill approach, based on default expression volatility.

---

## Decision Criteria

* performance: metadata-only addition is O(1); volatile defaults trigger full table rewrite
* architectural: PostgreSQL 11+ required for instant non-volatile defaults
* maintainability: NOT NULL enforcement requires full table scan
* security: no impact

---

## Decision Tree

Adding a column to a PostgreSQL table?
↓
Is the database PostgreSQL 11+?
YES → Use metadata-only addition
    ↓
    Is the default value non-volatile (constant, NOW(), etc.)?
    YES → ADD COLUMN with DEFAULT is instant (no table rewrite)
        → ALTER TABLE ADD COLUMN col type NOT NULL DEFAULT value
    NO → Is the default volatile (gen_random_uuid(), clock_timestamp())?
        → Must rewrite table — use nullable first, backfill, enforce NOT NULL
NO → PostgreSQL < 11: All ADD COLUMN with DEFAULT rewrites the table
    → Use nullable first, backfill, enforce NOT NULL

---

## Rationale

PostgreSQL 11+ makes ADD COLUMN with a non-volatile DEFAULT a metadata-only operation — no table rewrite, no lock. This is the most zero-downtime approach available for adding columns. Volatile defaults still require a full table rewrite. NOT NULL enforcement (on an existing nullable column) requires a full table scan with ACCESS EXCLUSIVE lock.

---

## Recommended Default

**Default:** ADD COLUMN with NOT NULL and non-volatile DEFAULT (PG 11+)
**Reason:** Instant, no table rewrite, no lock. Use nullable + backfill only when the default is volatile or the database version is < 11.

---

## Risks Of Wrong Choice

* Adding column with volatile default: triggers full table rewrite, defeating the purpose
* NOT NULL validation scan: setting NOT NULL on existing column requires ACCESS EXCLUSIVE lock and full scan
* Version incompatibility: metadata-only DDL not supported on PG < 11

---

## Related Rules

* Always verify default volatility before adding columns in PostgreSQL
* Set NOT NULL in a separate operation with a maintenance window

---

## Related Skills

* Add columns with defaults instantly in PostgreSQL 11+
