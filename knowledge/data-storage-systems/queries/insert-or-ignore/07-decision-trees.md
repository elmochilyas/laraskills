# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Eloquent ORM / Query Builder
**Knowledge Unit:** 2-22 Insert Or Ignore
**Generated:** 2026-06-03

---

# Decision Inventory

* insertOrIgnore vs upsert
* Batch insert with deduplication vs single-row checks

---

# Architecture-Level Decision Trees

---

## insertOrIgnore vs upsert

---

## Decision Context

Choosing between silently skipping duplicates vs updating existing rows.

---

## Decision Criteria

* performance: single query for both methods; upsert adds update overhead
* architectural: insertOrIgnore never modifies existing data
* maintainability: both skip model events
* security: safe for user-supplied batch data

---

## Decision Tree

Inserting data where some rows might already exist?
↓
Should existing matching rows be UPDATED with new values?
YES → Use upsert
NO → Do NOT update existing rows — just skip them?
    YES → Use insertOrIgnore
        ↓
        Do you need to know which rows were skipped?
        YES → Compare count of input rows vs inserted rows
        NO → insertOrIgnore is correct
    NO → Use insert (will throw on duplicates, catch and handle)

---

## Rationale

insertOrIgnore is the right choice when you want to insert new data and leave existing data untouched. It's ideal for idempotent seeding, log deduplication, and one-time data loads where updates would be incorrect.

---

## Recommended Default

**Default:** insertOrIgnore() for idempotent batch inserts
**Reason:** Silently skips duplicates without error handling overhead. Prefer upsert when existing rows need updating.

---

## Risks Of Wrong Choice

* Assuming all rows were inserted: insertOrIgnore gives no feedback on skipped rows
* Missing model events: observers and event listeners will not fire
* Oversized batches: >1000 rows may exceed database limits; split into batches of 100-500

---

## Related Rules

* Never assume insertOrIgnore inserted all rows — verify with row count
* Model events are not fired by insertOrIgnore

---

## Related Skills

* Execute idempotent batch inserts
