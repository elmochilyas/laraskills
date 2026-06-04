# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Query Optimization & Profiling
**Knowledge Unit:** 4-1 EXPLAIN Output Interpretation
**Generated:** 2026-06-03

---

# Decision Inventory

* Access method analysis (const vs ref vs range vs index vs ALL)
* Index effectiveness evaluation
* Extra flags interpretation (filesort, temporary, using index)

---

# Architecture-Level Decision Trees

---

## Query Performance Diagnosis with EXPLAIN

---

## Decision Context

Interpreting EXPLAIN output to identify missing indexes, inefficient access methods, and query optimization opportunities.

---

## Decision Criteria

* performance: access method determines rows examined; const=best, ALL=worst
* architectural: index design must match query patterns
* maintainability: regular EXPLAIN review prevents regression
* security: no direct impact

---

## Decision Tree

Running EXPLAIN on a slow query?
↓
Check the `type` column (access method):
→ const/eq_ref: OPTIMAL (unique index lookup)
→ ref: GOOD (non-unique index lookup)
→ range: ACCEPTABLE (index range scan; check rows examined)
→ index: WARNING (full index scan; may be acceptable for small indexes)
→ ALL: PROBLEM (full table scan — needs index)
↓
Is `type` = ALL?
YES → Add an index on the WHERE/JOIN columns
    → Check `possible_keys` and `key` columns
    → If possible_keys has candidates but key is NULL → optimizer chose not to use them
    → If possible_keys is empty → no usable index exists
NO → Check `Extra` flags:
    → "Using filesort" → Add index for ORDER BY
    → "Using temporary" → Add composite index for GROUP BY
    → "Using index" → GOOD (covering index, no table access)

---

## Rationale

EXPLAIN's `type` column is the single most important indicator of query efficiency. const/eq_ref/ref are good. range is acceptable for bounded ranges. index and ALL indicate missing or poorly designed indexes. Extra flags reveal additional optimization opportunities.

---

## Recommended Default

**Default:** Target type=ref or better for all production queries
**Reason:** ref access means indexed lookup with minimal rows examined. EXCEPTION: small tables (< 1000 rows) where a full scan is acceptable.

---

## Risks Of Wrong Choice

* Ignoring type=ALL: full table scans on large tables cause performance degradation
* Not checking Extra flags: filesort/temporary operations consume memory and CPU
* Relying on possible_keys without key: optimizer chose not to use available indexes
* Not comparing before/after: adding index without verifying with EXPLAIN

---

## Related Rules

* Always run EXPLAIN before and after adding an index
* Target const/eq_ref/ref access methods for production queries

---

## Related Skills

* Interpret EXPLAIN output for query optimization
