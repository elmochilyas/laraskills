# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Eloquent ORM / Query Builder
**Knowledge Unit:** 2-26 UpdateOrCreate / FirstOrCreate
**Generated:** 2026-06-03

---

# Decision Inventory

* updateOrCreate vs firstOrCreate vs firstOrNew
* Atomic vs non-atomic find-or-create
* Loop vs batch performance

---

# Architecture-Level Decision Trees

---

## Find-or-Create Method Selection

---

## Decision Context

Choosing the correct method for finding existing records or creating new ones, balancing atomicity and performance.

---

## Decision Criteria

* performance: each method = SELECT + INSERT/UPDATE (2 queries); N+1 in loops
* architectural: none are atomic — race condition possible
* maintainability: firstOrNew returns unsaved model for draft workflows
* security: all respect $fillable

---

## Decision Tree

Need to find a record or create one if not found?
↓
Is the operation in a concurrent environment?
YES → Wrap in DB::transaction or use upsert() (atomic)
    ↓
    Need to update if found, create if not?
    YES → DB::transaction(fn() => Model::updateOrCreate(...))
    NO → DB::transaction(fn() => Model::firstOrCreate(...))
NO → Is this a batch operation (loop over many items)?
    YES → Use upsert() instead (single query, not N+1)
    NO → Single item processing?
        YES → Does record exist?
            → YES → updateOrCreate (update) or firstOrCreate (no update needed)
            → NO → firstOrCreate
        NO → Need an unsaved draft instance?
            → Use firstOrNew (returns unsaved model)

---

## Rationale

updateOrCreate and firstOrCreate are non-atomic (SELECT then INSERT). Under concurrent requests, both may SELECT null and both INSERT, causing a duplicate key violation. Wrap in a transaction or use upsert for atomicity.

---

## Recommended Default

**Default:** firstOrCreate() for reference data, upsert() for batch/concurrent
**Reason:** firstOrCreate is simple for non-concurrent reference data seeding. upsert is the only atomic option for concurrent environments.

---

## Risks Of Wrong Choice

* Race condition under concurrent requests: duplicate key exceptions
* Using firstOrCreate in a loop: N+1 database pattern (N SELECTs + N INSERTs)
* Using firstOrNew when a persisted model is expected: caller may forget to save()

---

## Related Rules

* Wrap updateOrCreate in a transaction for concurrent safety
* Use upsert for batch operations, not firstOrCreate in a loop

---

## Related Skills

* Execute find-or-create logic safely
