# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Total Count Performance
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Count Strategy Selection

---

## Decision Context

Choosing between exact COUNT(*), approximate count, cached count, or eliminating the count entirely based on table size and accuracy requirements.

---

## Decision Criteria

* performance
* architectural
* security
* maintainability

---

## Decision Tree

Is the total count actually needed by the client UI?
├── NO → Use simplePaginate() or cursorPaginate() — eliminate count entirely
└── YES → Does the table have fewer than 100K rows?
    ├── YES → Use exact COUNT(*) — acceptable performance
    └── NO → Is the exact count required (financial, audit, regulatory)?
        ├── YES → Is the WHERE clause filterable by a covering index?
        │   ├── YES → Create covering index for index-only count scan
        │   └── NO → Accept slower exact count; optimize as possible
        └── NO → Is stale-up-to-N-minutes acceptable?
            ├── YES → Cache the total count with short TTL (60-300s)
            └── NO → Use approximate count (pg_class / information_schema)

---

## Rationale

The COUNT(*) query can be 10x slower than the data query on large tables. Eliminating the count (via simplePaginate/cursorPaginate) is the most effective optimization. When a count is required, covering indexes, caching, and approximations trade precision for speed.

---

## Recommended Default

**Default:** cursorPaginate() for new endpoints (no count); cached count for existing offset endpoints with tables > 100K rows
**Reason:** Eliminating the count query entirely is always faster than optimizing it.

---

## Risks Of Wrong Choice

Exact COUNT(*) on 10M+ rows dominates response time. No count optimization on growing tables guarantees performance degradation. Cache without invalidation returns stale totals that confuse clients.

---

## Related Rules

* Benchmark COUNT(*) Separately From the Data Query
* Use simplePaginate() When Total Count Is Not Required
* Create Covering Indexes for Common Count Queries

---

## Related Skills

* Optimize Total Count Queries for Large Paginated Datasets

---

## Covering Index Decision

---

## Decision Context

Determining whether a covering index for COUNT(*) queries is needed and which columns to include.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is the WHERE clause of the count query frequently used?
├── YES → Does the WHERE clause reference columns that are part of an existing index?
│   ├── YES → Is the existing index narrow enough for an efficient index-only scan?
│   │   ├── YES → Existing index is sufficient
│   │   └── NO → Create a narrow covering index for the count query
│   └── NO → Create a covering index including WHERE columns + primary key
└── NO → Is the COUNT(*) query unfiltered (no WHERE)?
    ├── YES → Database uses smallest secondary index automatically (InnoDB)
    └── NO → Create covering index for the specific WHERE clause

---

## Rationale

A narrow index on (status, id) enables MySQL InnoDB and PostgreSQL to count rows by scanning only the index, which is much smaller than the table. Index-only count scans are dramatically faster than table scans.

---

## Recommended Default

**Default:** Create a covering index for common count query WHERE clauses if table exceeds 100K rows
**Reason:** Reduces count query time from seconds to milliseconds; index size overhead is modest.

---

## Risks Of Wrong Choice

No covering index forces full table scan for every count query. Overly broad covering index (too many columns) wastes disk and buffer pool.

---

## Related Rules

* Create Covering Indexes for Common Count Queries

---

## Related Skills

* Optimize Total Count Queries for Large Paginated Datasets
