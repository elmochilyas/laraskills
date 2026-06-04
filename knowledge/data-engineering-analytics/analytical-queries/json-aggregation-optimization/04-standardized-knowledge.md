# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 09-analytical-queries
**Knowledge Unit:** json-aggregation-optimization
**Difficulty:** Intermediate
**Category:** Query Optimization
**Last Updated:** 2026-06-03

---

# Overview

JSON aggregation is a query optimization technique that replaces Eloquent's N+1 relationship loading with a single SQL query that returns related data as a JSON array embedded in each parent row. Instead of 1 query for parents + many queries for relations, JSON aggregation produces one query using `JSON_ARRAYAGG` (MySQL) or `json_agg` (PostgreSQL) to collect related records into a JSON column. This reduces query count from 100+ to 1, and total data transfer by eliminating redundant parent data repeated in JOIN results.

Engineers must care because the N+1 problem is the most common performance issue in Laravel applications. JSON aggregation is not just a different way to write the query — it fundamentally changes the data access pattern from row-based to document-based, which can be dramatically more efficient for certain workloads.

---

# Core Concepts

## JSON_ARRAYAGG (MySQL)

A MySQL aggregate function that collects values from multiple rows into a JSON array. Combined with `JSON_OBJECT()` to shape each element's structure: `JSON_ARRAYAGG(JSON_OBJECT('id', id, 'name', name))`.

## json_agg (PostgreSQL)

The PostgreSQL equivalent of `JSON_ARRAYAGG`. `json_agg` returns a JSON array of rows or objects. Use `json_build_object` for custom object shapes: `json_agg(json_build_object('id', id, 'name', name))`.

## JSON Object Aggregation

Creating a JSON object (not array) from related rows, keyed by a unique identifier. `json_object_agg(relation_key, relation_value)` creates `{"key1": "value1", "key2": "value2"}`.

## Lateral Join Approach

Using `LEFT JOIN LATERAL` to aggregate related records per parent row. More flexible than standard aggregation because it can include LIMIT, ORDER BY, and complex WHERE clauses per-row.

## Aggregation vs Collection

The key tradeoff: JSON aggregation returns a single query result with nested JSON. Eloquent's `with()` returns separate query results and hydrates models. JSON aggregation is faster for large datasets but loses Eloquent's model layer benefits.

---

# When To Use

- API endpoints returning parent + related data in a single response
- Dashboard widgets that display parent records with related aggregates
- Read-only API responses where Eloquent model hydration is unnecessary
- Large datasets where N+1 query overhead is significant (> 100 parent records)

---

# When NOT To Use

- When you need to modify related models after loading (no model hydration)
- Complex nested relationships (3+ levels deep)
- Star-schema data models where JOINs are already efficient
- Cases where a simple `with()` with `select()` optimization is sufficient
- When the parent dataset is small (< 50 records) — overhead is negligible

---

# Best Practices

## Use With Caution on Deeply Nested Data

JSON aggregation works best for 1-level relationships (parent → children). For 2+ levels, the JSON structure becomes deeply nested and hard to work with.

## Combine With Indexing

Ensure foreign key columns are indexed. JSON aggregation avoids N+1 but still performs JOIN-based retrieval. Without indexes, JOIN performance degrades.

## Consider Read Models

If the same JSON-aggregated structure is used in multiple places, consider creating a read model (materialized view or cached projection) that pre-builds the JSON structure.

## Test Both Approaches

Benchmark JSON aggregation against Eloquent `with()` for the specific query. JSON aggregation can be slower for small datasets due to JSON serialization overhead.

---

# Performance Considerations

- JSON aggregation: 1 query, 1 round trip, serialized JSON overhead per row.
- Eloquent with(): 1 + N queries, N round trips (with connection pooling), Eloquent object overhead.
- JSON aggregation is typically 2-10x faster for > 100 parent records.
- JSON serialization adds 5-20% overhead per row compared to raw columns.
- PostgreSQL `json_agg` is more efficient than MySQL `JSON_ARRAYAGG` for large result sets.

---

# Common Mistakes

## Mistake: JSON Aggregation for Nested Relations

Three levels of JSON aggregation: `json_agg(json_build_object('orders', (SELECT json_agg(...) FROM orders WHERE ...)))`. The resulting JSON is complex, hard to parse, and the query is unmaintainable.

**Better approach:** Use Eloquent `with()` for deeply nested relations. The per-query overhead is worth the maintainability gain.

## Mistake: JSON Aggregation Without Pagination

JSON aggregation on 10K parent records returns a single query result with 10K parent rows, each containing a JSON array of related records. Result size: 500MB. The web server runs out of memory.

**Better approach:** Paginate the parent query. Apply JSON aggregation per page. Or use lazy loading for small sub-sets.

## Mistake: No Indexing on JOIN Column

`json_agg` with JOIN on `orders.user_id` without an index. The JOIN scans the full orders table for each parent row.

**Better approach:** Ensure `orders.user_id` is indexed. Review the query plan with `EXPLAIN ANALYZE`.

## Mistake: JSON Aggregation When Models Are Needed

The API response needs to return `UserResource` with nested `OrderResource`. JSON aggregation returns raw arrays/objects, not Eloquent models. The developer must manually transform data.

**Better approach:** Use Eloquent `with()` with `Resource::collection()` when model hydration and resource transformation are required.
