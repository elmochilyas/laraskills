# Rules: JSON Aggregation Query Optimization

## Rule JAO-01: One Level Deep Only
JSON aggregation MUST NOT be used for relationships deeper than one level (parent → children). For 2+ levels, use Eloquent `with()`.

## Rule JAO-02: Foreign Key Indexes Required
JOIN columns used in JSON aggregation queries MUST be indexed. Query plans must be reviewed with EXPLAIN ANALYZE.

## Rule JAO-03: Paginate Parent Results
JSON aggregation queries MUST be paginated when the parent result set may exceed 1,000 rows.

## Rule JAO-04: Benchmark Against Eloquent
JSON aggregation performance MUST be benchmarked against Eloquent `with()` for the specific query pattern before production adoption.

## Rule JAO-05: Consider Read Models
JSON aggregation patterns used in 3+ places SHOULD be pre-computed in a read model or materialized view.

## Rule JAO-06: No JSON Aggregation in Write Paths
JSON aggregation MUST NOT be used in write operations or data mutations. It is a read-only optimization.

## Rule JAO-07: Document JSON Structure
The JSON structure produced by aggregation MUST be documented with example output for API consumers.

## Rule JAO-08: Handle Null Relations
JSON aggregation queries MUST handle parent records with no related records. Empty JSON arrays (`[]`) must be returned, not NULL.

## Rule JAO-09: Test With Production Data Volumes
JSON aggregation performance MUST be tested with production-scale data. Small-dataset benchmarks are not representative.

## Rule JAO-10: No Raw SQL Without Review
`DB::raw()` used in JSON aggregation queries MUST be reviewed for SQL injection risks and database compatibility.
