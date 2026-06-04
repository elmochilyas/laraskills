# 4-25 Subquery Optimization

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-25 |
| Knowledge Unit Title | Subquery Optimization |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 4.8 whereDate sargability breakage | 4.10 Function wraps in WHERE clause | 4.18 Keyset pagination | 12.18 Lateral joins in PostgreSQL |
| Last Updated | 2026-06-02 |

## Overview

Subqueries are powerful but easy to misuse. Eloquent's relationship subqueries (addSelect, orderBy with subquery) can generate inefficient correlated subqueries. PostgreSQL lateral joins convert row-by-row subquery execution into an optimized loop. Understanding when the database flattens a subquery into a join, when it materializes a derived table, and when it re-executes per row is critical for Laravel applications with complex reporting or nested relationship queries.

---

## Core Concepts

- **Correlated subquery**: References columns from the outer query and executes once per outer row. This is the most dangerous subquery pattern for large datasets.
- **Derived table (subquery in FROM)**: Materialized as a temporary result set before the outer query runs. Cannot reference outer query columns directly (use LATERAL for that).
- **LATERAL join (PostgreSQL)**: Allows the subquery to reference columns from preceding FROM items. Executes the subquery for each row of the driving table, but can use indexes.
- **Semi-join / anti-join transformation**: The optimizer can rewrite `WHERE id IN (SELECT ...)` into a semi-join, avoiding full materialization of the subquery result.
- **Subquery flattening**: Optimizers convert simple subqueries into joins when safe. EXISTS, IN, = ANY patterns are most likely to be flattened.
- ```sql
- -- Correlated subquery (re-executed per row)
- SELECT * FROM users WHERE (SELECT COUNT(*) FROM orders WHERE orders.user_id = users.id) > 5;
- -- Same result with LATERAL (PostgreSQL)
- SELECT * FROM users JOIN LATERAL (SELECT COUNT(*) as cnt FROM orders WHERE orders.user_id = users.id) stats ON stats.cnt > 5;
- -- Semi-join transformation target
- SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 100);
- ```


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Eloquent subquery select with optimal indexing**: When using `addSelect` with a subquery, ensure the correlated column in the subquery is indexed.
- ```php
- // Eloquent: correlated subquery for most recent order
- User::addSelect(['last_order_date' => Order::select('created_at')
- ->whereColumn('user_id', 'users.id')
- ->latest()
- ->limit(1)
- ]);
- // Equivalent raw PostgreSQL with LATERAL (in DB::raw if needed)
- $users = User::from('users')
- ->select('users.*', 'last_orders.created_at as last_order_date')
- ->joinRaw('JOIN LATERAL (
- SELECT created_at FROM orders
- WHERE orders.user_id = users.id
- ORDER BY created_at DESC
- LIMIT 1
- ) last_orders ON true')
- ->get();
- ```
- **Subquery in EXISTS vs IN**: Prefer `whereHas` (generates EXISTS) over `whereIn` with a subquery for large lists. EXISTS can short-circuit on first match.
- ```php
- // EXISTS (good - can short-circuit)
- User::whereHas('orders', fn($q) => $q->where('total', '>', 1000))->get();
- // IN with subquery (materializes the subquery result first)
- User::whereIn('id', Order::where('total', '>', 1000)->pluck('user_id'))->get();
- ```
- **Semi-join in MySQL**: MySQL 5.6+ transforms IN (subquery) into semi-join internally for most cases. Use `EXPLAIN FORMAT=TREE` to verify the transformation happened.


## Architecture Guidelines

- | Decision | When | When Not |
- |----------|------|----------|
- | Use LATERAL join | PostgreSQL, need per-row correlated data with index access | MySQL (no LATERAL support) |
- | Use EXISTS subquery | Checking existence, subquery result is large | Subquery result is small (< 100 rows) |
- | Use derived table (FROM subquery) | Need to aggregate then filter on aggregate | Query can be written as a single-level join |
- | Use Eloquent subquery addSelect | Simple per-row computed columns | Complex multi-column subquery results |


## Performance Considerations

- - Always `EXPLAIN ANALYZE` subquery-heavy queries. Look for "DEPENDENT SUBQUERY" which indicates correlation.
- - A correlated subquery on a 100k-row table with no index on the correlated column = 100k full table scans.
- - PostgreSQL 17+ improves LATERAL join estimation and can use additional statistics for better plans.
- - MySQL 8.0.21+ adds hash join support which can benefit certain subquery patterns.
- ```sql
- -- Check for dependent subqueries in MySQL
- EXPLAIN FORMAT=JSON SELECT * FROM users WHERE (SELECT COUNT(*) FROM orders WHERE orders.user_id = users.id) > 5;
- -- Look for "dependent" in the query block
- ```


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Using subquery in WHERE IN with large result set**: `WHERE id IN (SELECT id FROM ...)` materializes the full subquery result. Use EXISTS or JOIN instead when the subquery returns thousands of rows. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Nested subquery in Eloquent without index**: Adding `Order::select('total')->whereColumn('user_id', 'users.id')->orderBy('created_at')->limit(1)` as an addSelect without indexing `orders.user_id` or `orders.created_at` causes a full scan per user. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | LATERAL without proper index**: LATERAL is only fast when the inner query can use an index for the parameter passed from the outer query. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | ```php | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 5 | // Missing index: orders (user_id, created_at) => full scan per row | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 6 | User::addSelect(['last_order' => Order::selectRaw('JSON_OBJECT("id", id, "total", total)') | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 7 | ->whereColumn('user_id', 'users.id') | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 8 | ->latest() | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 9 | ->limit(1) | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 10 | ]); | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 11 | ``` | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 12 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Subquery materialization blowup**: A derived table returning 1M rows that the outer query then filters to 10 rows. The database wasted effort building the full materialized result. Solution: push conditions down or use EXISTS.
- - **DEPENDENT SUBQUERY in MySQL EXPLAIN**: Indicates the subquery is correlated and may execute per row. If `rows` is high and `filtered` is low, the query will be slow.
- - **NOT IN with NULL values**: `WHERE id NOT IN (SELECT user_id ...)` returns zero rows if the subquery result contains any NULL. Always use `NOT EXISTS` instead.


## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Query Optimization Profiling
- **Closely Related**: Other KUs within Query Optimization Profiling
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

