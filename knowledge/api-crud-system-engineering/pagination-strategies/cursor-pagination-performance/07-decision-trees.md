# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Cursor Pagination Performance
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Index Strategy Selection

---

## Decision Context

Choosing the correct composite index strategy for cursor pagination queries to ensure O(1) index range scan performance.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Does the cursor query have WHERE equality filters (e.g., `status = 'published'`)?
├── YES → Include equality filter columns as leading index columns
│   └── Followed by sort columns in ORDER BY direction
└── NO → Is there a single sort column or multiple?
    ├── Single → Create index on sort column (with tiebreaker PK)
    └── Multiple → Create composite index matching ORDER BY columns exactly

Is a covering index possible (query selects subset of columns)?
├── YES → Include selected columns in index with INCLUDE (PG) or as included columns
└── NO → Accept table lookups; verify performance is acceptable

---

## Rationale

Composite indexes only optimize queries when their leading columns match the query's column order. Equality filters should lead to narrow the range scan first. Covering indexes eliminate expensive table lookups.

---

## Recommended Default

**Default:** Composite index with equality filters first, then sort columns, include commonly selected columns
**Reason:** Enables index range scan; covering index eliminates table lookups.

---

## Risks Of Wrong Choice

Wrong column order makes index unusable for range scans. Without covering index, each page request requires 15+ random I/O operations for table lookups. Missing index forces full table scan, worse than offset.

---

## Related Rules

* Verify Execution Plan Shows Index Range Scan
* Match Composite Index Column Order to Query Column Order Exactly
* Use Covering Indexes for Frequently Queried Columns

---

## Related Skills

* Ensure Cursor Pagination Performance via Indexed Sequential Columns

---

## Execution Plan Verification Decision

---

## Decision Context

Determining the required execution plan verification steps before deploying cursor pagination to production.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Has EXPLAIN ANALYZE been run with production-scale data?
├── YES → Does the plan show "Index Range Scan" (not "Seq Scan" or "Index Scan")?
│   ├── YES → Does the query use WHERE + ORDER BY columns that match the index exactly?
│   │   ├── YES → Deploy cursor pagination
│   │   └── NO → Reorder composite index columns to match query
│   └── NO → Are there missing indexes?
│       ├── YES → Create matching composite index and re-verify
│       └── NO → Consider offset pagination as fallback
└── NO → Run EXPLAIN ANALYZE before deploying

---

## Rationale

Cursor pagination's O(1) performance guarantee relies entirely on the database using an index range scan. Without it, the query performs a full table scan, often performing worse than offset pagination.

---

## Recommended Default

**Default:** Always run EXPLAIN ANALYZE with production-scale data before deploying cursor pagination
**Reason:** Prevents silent full table scans that degrade performance below offset pagination levels.

---

## Risks Of Wrong Choice

Deploying cursor pagination without index verification causes full table scans on every request, resulting in 10-100x slower responses than expected.

---

## Related Rules

* Verify Execution Plan Shows Index Range Scan
* Match Composite Index Column Order to Query Column Order Exactly

---

## Related Skills

* Ensure Cursor Pagination Performance via Indexed Sequential Columns
