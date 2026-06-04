# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Query Optimization & Profiling
**Knowledge Unit:** 4-3 Type Column Values
**Generated:** 2026-06-03

---

# Decision Inventory

* Access method classification by type column
* Query optimization priority based on type
* Index effectiveness assessment

---

# Architecture-Level Decision Trees

---

## Access Method Assessment

---

## Decision Context

Using EXPLAIN type column to assess query efficiency and prioritize optimization targets.

---

## Decision Criteria

* performance: const > eq_ref > ref > range > index > ALL
* architectural: type determines index vs full scan
* maintainability: regular sweep for ALL/index scans

---

## Decision Tree

EXPLAIN shows `type` = ALL (full table scan)?
YES → Is table < 1000 rows?
    YES → Acceptable — full scan is cheaper than index lookup
    NO → Add index on WHERE/JOIN columns
EXPLAIN shows `type` = index (full index scan)?
YES → Is the index small and covering?
    YES → Acceptable (Using index in Extra means covering)
    NO → Missing WHERE clause — narrow the query
EXPLAIN shows `type` = range/ref/eq_ref/const?
→ GOOD — indexed access
→ Verify `rows` is reasonable

---

## Recommended Default

**Default:** Target ref or better for all production queries on tables > 1000 rows
**Reason:** ref enables indexed lookup with minimal rows examined
