# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Offset Pagination Performance
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Deep Offset Mitigation Strategy

---

## Decision Context

When offset pagination shows performance degradation at deep page depths (page 100+), choose a mitigation strategy: enforce a maximum offset, implement a hybrid switch, or migrate to cursor pagination.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Is the dataset expected to grow beyond 50K records?
├── YES → Migrate to cursor pagination (definitive solution)
└── NO → Is the average page depth > 100?
    ├── YES → Is the total dataset < 10K records?
    │   ├── YES → Enforce maximum offset limit (e.g., 10,000 rows)
    │   └── NO → Implement hybrid: offset for shallow, cursor for deep pages
    └── NO → Is the COUNT(*) query the dominant cost?
        ├── YES → Switch to simplePaginate() or cache the total count
        └── NO → Optimize with covering indexes + benchmark

---

## Rationale

Cursor pagination is the definitive solution for deep-offset degradation since it uses O(1) index range scans. For bounded datasets with moderate depth, a maximum offset guard prevents catastrophic queries. The hybrid approach allows gradual migration.

---

## Recommended Default

**Default:** Maximum offset guard (10,000 rows) + plan cursor migration
**Reason:** Prevents immediate resource exhaustion while providing time to migrate.

---

## Risks Of Wrong Choice

No guard allows clients to trigger catastrophic database load. Premature migration adds complexity. Delayed migration causes production incidents as data grows.

---

## Related Rules

* Enforce a Maximum Offset Limit
* Benchmark COUNT(*) Separately From Data Query
* Use simplePaginate() When Total Count Is Not Required

---

## Related Skills

* Mitigate Offset Pagination Degradation with Indexing and Page Limits

---

## COUNT(*) Optimization Decision

---

## Decision Context

Choosing the optimal strategy for COUNT(*) queries on large tables when offset pagination with total is required.

---

## Decision Criteria

* performance
* security
* maintainability

---

## Decision Tree

Does the table have more than 100K rows?
├── YES → Is an exact count required (financial/audit context)?
│   ├── YES → Create a covering index for the count query
│   └── NO → Is the count allowed to be stale up to 5 minutes?
│       ├── YES → Cache the total count with short TTL
│       └── NO → Use approximate count (pg_class/information_schema)
└── NO → Is the WHERE clause complex with unindexed columns?
    ├── YES → Create covering index for the WHERE clause
    └── NO → Standard COUNT(*) is acceptable (<5ms)

---

## Rationale

Exact COUNT(*) on large tables with complex WHERE can take seconds. Covering indexes enable index-only count scans. Approximate and cached counts trade precision for speed. For most use cases, the exact count is not required on every request.

---

## Recommended Default

**Default:** SimplePaginate() when total not needed; cached count with 300s TTL otherwise
**Reason:** Eliminates or drastically reduces count query overhead for the majority of cases.

---

## Risks Of Wrong Choice

Exact COUNT(*) on 10M+ rows dominates response time. Excessive caching returns stale total that confuses clients. Approximate count without documentation leads clients to rely on inaccurate values.

---

## Related Rules

* Create Covering Indexes for Common Count Queries
* Benchmark COUNT(*) Separately From Data Query

---

## Related Skills

* Optimize Total Count Queries for Large Paginated Datasets
