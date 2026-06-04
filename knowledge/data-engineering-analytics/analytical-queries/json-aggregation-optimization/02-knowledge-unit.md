# JSON Aggregation Optimization

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 09-analytical-queries
- **Knowledge Unit:** json-aggregation-optimization
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

JSON aggregation replaces Eloquent's N+1 relationship loading with a single SQL query that returns related data as a JSON array embedded in each parent row — reducing query count from 100+ to 1 and total data transfer by eliminating redundant parent data repeated in JOIN results. This fundamentally changes the data access pattern from row-based to document-based, which can be dramatically more efficient for API responses and dashboard widgets.

---

## Core Concepts

- **JSON_ARRAYAGG (MySQL):** MySQL aggregate function collecting values from multiple rows into JSON array — combined with `JSON_OBJECT()` to shape element structure: `JSON_ARRAYAGG(JSON_OBJECT('id', id, 'name', name))`
- **json_agg (PostgreSQL):** PostgreSQL equivalent returning JSON array of rows or objects — use `json_build_object` for custom shapes: `json_agg(json_build_object('id', id, 'name', name))`
- **JSON Object Aggregation:** Creates JSON object (not array) from related rows keyed by unique identifier — `json_object_agg(relation_key, relation_value)` creates `{"key1": "value1", "key2": "value2"}`
- **Lateral Join Approach:** Using `LEFT JOIN LATERAL` to aggregate related records per parent row — more flexible than standard aggregation because it can include LIMIT, ORDER BY, and complex WHERE per-row
- **Aggregation vs Collection:** JSON aggregation returns single query with nested JSON — `with()` returns separate queries and hydrates models — JSON aggregation is faster for large datasets but loses model layer

---

## Mental Models

- **JSON Aggregation as Gift Basket:** Instead of carrying each item separately (multiple queries), JSON aggregation packs all related items into a single gift basket (JSON column) attached to each parent. One trip, everything inside.
- **Eloquent with() as Shopping with Separate Bags:** Eloquent's `with()` is like shopping where each store (relationship) gives you a separate bag. You need one trip per store, then you have to match items from different bags at home. JSON aggregation is like putting everything in one cart — you see all items together immediately.

---

## Internal Mechanics

The query uses GROUP BY on the parent table's primary key and aggregates the related table's columns into a JSON structure using `json_agg` or `JSON_ARRAYAGG`. For example: `SELECT users.*, json_agg(json_build_object('id', orders.id, 'total', orders.total)) as orders FROM users LEFT JOIN orders ON orders.user_id = users.id GROUP BY users.id`. The related rows are returned as a JSON array in the `orders` column. The PHP application then decodes the JSON to access the related data. PostgreSQL's `json_agg` is more efficient than MySQL's `JSON_ARRAYAGG` for large result sets.

---

## Patterns

- **Use With Caution on Deeply Nested Data:** JSON aggregation works best for 1-level relationships (parent → children) — for 2+ levels, JSON becomes deeply nested and hard to work with
- **Combine With Indexing:** Ensure foreign key columns are indexed — JSON aggregation avoids N+1 but still performs JOIN-based retrieval — without indexes, JOIN performance degrades
- **Consider Read Models:** If the same JSON-aggregated structure is used in multiple places, consider creating a read model (materialized view or cached projection) that pre-builds the JSON structure

---

## Architectural Decisions

Use JSON aggregation for API endpoints returning parent + related data in a single response, dashboard widgets displaying parent records with related aggregates, and read-only responses where Eloquent model hydration is unnecessary. Do not use when you need to modify related models after loading (no model hydration), for complex nested relationships (3+ levels), or when the parent dataset is small (< 50 records) where overhead is negligible.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single query replaces N+1 | JSON serialization overhead: 5-20% per row | More than offsets N+1 overhead for > 100 records |
| No model hydration overhead | Raw arrays, not Eloquent models | Cannot use model methods or relationships |
| 2-10x faster for large datasets | Deep nesting becomes unreadable | Best for 1-level relationships |
| Reduced data transfer (no redundant parent data) | Pagination required to avoid memory issues | Must paginate parent query |

---

## Performance Considerations

JSON aggregation: 1 query, 1 round trip, serialized JSON overhead per row. Eloquent `with()`: 1 + N queries, N round trips, Eloquent object overhead. JSON aggregation is typically 2-10x faster for > 100 parent records. JSON serialization adds 5-20% overhead per row compared to raw columns. PostgreSQL `json_agg` is more efficient than MySQL `JSON_ARRAYAGG` for large result sets.

---

## Production Considerations

Paginate the parent query to avoid memory issues — JSON aggregation on 10K parent records can produce a 500MB result. Ensure JOIN columns are indexed. Benchmark JSON aggregation against Eloquent `with()` for the specific query — JSON can be slower for small datasets. Consider read models for frequently-used JSON aggregation patterns.

---

## Common Mistakes

- **JSON Aggregation for Nested Relations:** Three levels of JSON aggregation — resulting JSON is complex, hard to parse, query is unmaintainable. Better: use Eloquent `with()` for deeply nested relations, maintainability gain outweighs per-query overhead.
- **JSON Aggregation Without Pagination:** JSON aggregation on 10K parent records returns single result with 10K parent rows each containing JSON array — result size 500MB, web server runs out of memory. Better: paginate parent query, apply JSON aggregation per page.
- **No Indexing on JOIN Column:** `json_agg` with JOIN without index — JOIN scans full related table for each parent row. Better: ensure foreign key columns are indexed, review with `EXPLAIN ANALYZE`.

---

## Failure Modes

- **Memory Exhaustion from Unpaged Results:** JSON aggregation on large dataset without pagination — all data loaded into memory, OOM crash. Mitigation: always paginate, use lazy loading for subsets.
- **Model Layer Bypass Issues:** API response needs Resource transformation — JSON aggregation returns raw arrays, developer must manually transform data. Mitigation: use Eloquent `with()` with `Resource::collection()` when model hydration needed.
- **Database-Specific Syntax Problems:** Using `json_agg` syntax in MySQL where `JSON_ARRAYAGG` is required — query fails with syntax error. Mitigation: write database-specific queries, test on target platform.

---

## Ecosystem Usage

JSON aggregation is a raw SQL technique used in Laravel API development and dashboard query optimization. It's typically implemented through `DB::raw()` expressions, `addSelect()` with subqueries, or raw SQL via `DB::select()`. The technique is especially useful for dashboard widget providers that need to fetch parent records with aggregated children in a single query.

---

## Related Knowledge Units

### Prerequisites
- Eloquent Relationships — Understanding of the N+1 problem that JSON aggregation solves
- Database JSON Functions — `json_agg`, `JSON_ARRAYAGG`, `json_build_object`

### Related Topics
- Eloquent Aggregates — Alternative approach for simpler aggregation needs
- Dashboard Widget Provider — Common consumer of JSON aggregation results

### Advanced Follow-up Topics
- Read Models — Pre-computed JSON structures as an alternative to query-time aggregation
- CQRS — Separating read models for document-style data access

---

## Research Notes

JSON aggregation is the most effective technique for solving the N+1 problem in read-heavy API scenarios. The key insight is that it fundamentally changes the data access pattern from row-based to document-based — for certain workloads, this can be 10x more efficient. The technique is best applied at 1-level relationship depth and with pagination. PostgreSQL's `json_agg` is generally more performant than MySQL's `JSON_ARRAYAGG`.
