# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Query Optimization & Profiling
**Knowledge Unit:** 4-7 Sargable vs Non-Sargable
**Generated:** 2026-06-03

---

# Decision Inventory

* Sargable vs non-sargable condition identification
* Function-wrap elimination strategies
* Index usability analysis

---

# Architecture-Level Decision Trees

---

## Sargability Check

---

## Decision Context

Identifying and fixing non-sargable WHERE conditions that force full table scans by wrapping indexed columns in functions.

---

## Decision Criteria

* performance: non-sargable conditions cause full table scans
* architectural: index usability depends on bare column comparison
* maintainability: sargable queries are more portable across databases
* security: no direct impact

---

## Decision Tree

Reviewing a WHERE clause for index usability?
↓
Does the indexed column appear inside a function?
YES → NON-SARGABLE — rewrite to bare column
    → LOWER(col) = ? → col = ? (use case-insensitive collation)
    → DATE(col) = ?  → col >= ? AND col < ? (range query)
    → YEAR(col) = ?  → col >= 'YYYY-01-01' AND col < 'YYYY+1-01-01'
    → CAST(col AS CHAR) = ? → fix type mismatch instead
    → col LIKE '%pattern' → col LIKE 'pattern%' (move wildcard to end)
NO → Is the column on the left side of the operator with no wrapping?
    YES → SARGABLE — index can be used
    ↓
    Is the comparison type-compatible?
    YES → Index is usable
    NO → Implicit cast may make it non-sargable

---

## Rationale

The fundamental rule: the indexed column must appear alone (no function wrapping) on one side of the comparison operator. Function wrapping forces the database to evaluate the function on every row, making the index unusable. Range queries are the standard replacement for function-wrapped date comparisons.

---

## Recommended Default

**Default:** Always use bare column comparisons; use range queries instead of date functions
**Reason:** Bare columns enable index usage. Range queries (>= AND <) are sargable and equivalent to date function patterns.

---

## Risks Of Wrong Choice

* whereDate/whereMonth/whereYear in Eloquent: these helpers wrap columns in functions
* ORDER BY with function: ORDER BY LOWER(col) causes filesort
* LIKE with leading wildcard: prevents index usage entirely

---

## Related Rules

* Never wrap indexed columns in functions in WHERE clauses
* Use range queries (>= AND <) instead of date functions

---

## Related Skills

* Write sargable queries for index utilization
