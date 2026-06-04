# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Eloquent ORM / Query Builder
**Knowledge Unit:** 2-21 Upsert
**Generated:** 2026-06-03

---

# Decision Inventory

* upsert vs updateOrCreate
* upsert vs insertOrIgnore
* Batch upsert vs row-by-row

---

# Architecture-Level Decision Trees

---

## Upsert vs updateOrCreate vs insertOrIgnore

---

## Decision Context

Choosing the correct atomic insert-or-update strategy for batch data ingestion.

---

## Decision Criteria

* performance: upsert is a single atomic query; updateOrCreate is SELECT + INSERT/UPDATE
* architectural: upsert requires a unique index; updateOrCreate does not
* maintainability: upsert fires no model events
* security: no mass-assignment concerns with upsert (uses Query Builder)

---

## Decision Tree

Need to insert-or-update data?
↓
Is the operation concurrent (multiple requests may conflict)?
YES → Use upsert (atomic, no race condition)
    ↓
    Need model events (saving/saved/updating/updated)?
    YES → Use updateOrCreate wrapped in DB::transaction
    NO → Use upsert
NO → Is the data idempotent (imports, syncs)?
    YES → Use upsert
        ↓
        Should existing rows be silently skipped (not updated)?
        YES → Use insertOrIgnore
        NO → Use upsert
    NO → Is it a single row with no unique index?
        → Use firstOrCreate (non-concurrent) or updateOrCreate

---

## Rationale

upsert is the only atomic option that guarantees no race conditions. updateOrCreate is two separate queries (SELECT + INSERT/UPDATE) and can fail under concurrent writes. insertOrIgnore skips conflicts silently, which is correct for deduplication but incorrect when you need to update existing rows.

---

## Recommended Default

**Default:** upsert() for batch operations
**Reason:** Single atomic query, no race condition, best performance for batch operations. Fall back to updateOrCreate only when model events are required.

---

## Risks Of Wrong Choice

* Using firstOrCreate in concurrent environments: duplicate key exceptions
* Using updateOrCreate in loops: N+1 database queries instead of one batch upsert
* Using upsert without a unique index: silently inserts duplicates on PostgreSQL

---

## Related Rules

* Always prefer batch operations over row-by-row for bulk data
* Model events are not fired by upsert

---

## Related Skills

* Execute batch upsert operations
