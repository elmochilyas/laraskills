# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Query Optimization & Profiling
**Knowledge Unit:** 4-22 Eloquent Anti-Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Deep whereHas vs JOIN replacement
* Multiple withCount consolidation
* Polymorphic filter indexing
* Sorting by related columns

---

# Architecture-Level Decision Trees

---

## Eloquent Query Pattern Optimization

---

## Decision Context

Identifying and replacing common Eloquent anti-patterns that generate inefficient SQL queries.

---

## Decision Criteria

* performance: deeply nested exists subqueries and repeated aggregates degrade performance
* architectural: some Eloquent patterns generate non-sargable SQL
* maintainability: complex Eloquent chains are harder to optimize than explicit JOINs
* security: no direct impact

---

## Decision Tree

Profiling an Eloquent query that's slower than expected?
↓
Is there deeply nested whereHas (3+ levels)?
YES → Replace with explicit JOIN
    → whereHas('a.b.c') → join('a')...join('b')...join('c')
    → EXISTS subqueries on deep chains are expensive
NO → Multiple withCount calls?
    YES → Use addSelect with subqueries
        → Consolidate multiple aggregates into one query
    NO → Sorting by a related column?
        YES → Add denormalized column or use join with orderBy
        → ORDER BY related_column forces JOIN or subquery
    NO → Polymorphic OR conditions on large table?
        → Index on (morphable_type, morphable_id)
        → Consider splitting polymorphic table

---

## Rationale

Nested whereHash generates deeply nested EXISTS subqueries that can be slow on large tables. JOINs are typically faster. Multiple withCount calls add subqueries to the SELECT clause — consolidate. Sorting by related columns always requires extra work. Polymorphic tables need proper composite indexes.

---

## Recommended Default

**Default:** Replace deep whereHas with JOINs, consolidate withCount, index polymorphic columns
**Reason:** These three patterns account for the majority of Eloquent performance problems that aren't N+1.

---

## Risks Of Wrong Choice

* Deep whereHas on large tables: exponentials scan cost with nesting depth
* Multiple withCount: each adds a correlated subquery to SELECT
* Sorting by related column: forces JOIN even when the relationship isn't otherwise needed
* Polymorphic without composite index: full table scan on type+id filter

---

## Related Rules

* Avoid nested whereHas beyond 2 levels — use JOINs instead
* Index polymorphic columns with composite (type, id) index

---

## Related Skills

* Identify and fix Eloquent anti-patterns
