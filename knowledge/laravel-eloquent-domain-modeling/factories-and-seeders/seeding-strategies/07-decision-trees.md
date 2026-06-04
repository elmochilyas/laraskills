# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Factories & Seeders
**Knowledge Unit:** Seeding Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

* Factory vs raw DB::insert for bulk data
* Batch size for large datasets
* Transaction strategy for seeding

---

# Architecture-Level Decision Trees

---

## Factory vs Raw DB::insert for Bulk Data

---

## Decision Context

Choosing between using Eloquent factories and raw `DB::table()->insert()` for bulk data seeding.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Does the data need relationships, events, or attribute casting?
↓
YES → Use factory — relationships and events are handled automatically
NO → Is the data a flat lookup table (no relationships)?
    YES → Use raw `DB::table()->insert()` — 5-10x faster
    NO → Does the data have constraints or defaults managed by Eloquent?
        YES → Use factory — Eloquent handles type coercion
        NO → Raw insert is acceptable for performance

---

## Recommended Default

**Default:** Factory for related data; raw insert for flat bulk data
**Reason:** Factories handle complexity well; raw insert outperforms for simple bulk loads.

---

## Risks Of Wrong Choice

Using factories for 50,000 flat records causes massive memory and performance overhead. Using raw inserts for data that needs event dispatch misses critical side effects.

---

## Related Rules

* Use Raw DB::table()->insert() for Bulk Performance

---

## Related Skills

* Set Up migrate:fresh --seed Development Workflow

---

## Batch Size for Large Datasets

---

## Decision Context

Choosing batch sizes for large factory seeding operations to avoid memory exhaustion.

---

## Decision Criteria

* performance

---

## Decision Tree

Is the dataset larger than 10,000 records?
↓
YES → Batch into chunks of ~1,000 records — prevents memory exhaustion
NO → Is memory a concern for the environment?
    YES → Batch into smaller chunks (500-1,000)
    NO → Single batch is fine for datasets under 10,000

---

## Recommended Default

**Default:** Batch size of 1,000 for datasets over 10,000 records
**Reason:** Balances memory usage with insert performance.

---

## Risks Of Wrong Choice

Creating 50,000 records in a single factory call loads all models into memory simultaneously, causing memory exhaustion on resource-constrained environments.

---

## Related Rules

* Batch Large Seed Sets to Avoid Memory Exhaustion

---

## Related Skills

* Set Up migrate:fresh --seed Development Workflow

---

## Transaction Strategy for Seeding

---

## Decision Context

Choosing whether to wrap large seeding operations in explicit database transactions.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Is the seeding operation large (10,000+ inserts)?
↓
YES → Wrap in `DB::transaction()` — single commit, much faster, atomic
NO → Does partial seeding success cause issues?
    YES → Wrap in transaction for atomicity
    NO → Default per-factory transaction is sufficient

---

## Recommended Default

**Default:** `DB::transaction()` for all bulk seeding operations (10,000+)
**Reason:** Dramatically improves insert speed (single commit) and ensures atomicity.

---

## Risks Of Wrong Choice

No explicit transaction for large seeding operations causes per-insert commits (slow) and partial data on failure.

---

## Related Rules

* Wrap Large Seed Operations in Explicit Transactions

---

## Related Skills

* Set Up migrate:fresh --seed Development Workflow
