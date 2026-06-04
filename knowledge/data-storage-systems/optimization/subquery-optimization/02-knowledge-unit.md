# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.25 Subquery optimization (lateral joins in PostgreSQL, derived table optimization)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

## Executive Summary

Subqueries are powerful but easy to misuse. Eloquent's relationship subqueries (addSelect, orderBy with subquery) can generate inefficient correlated subqueries. PostgreSQL lateral joins convert row-by-row subquery execution into an optimized loop. Understanding when the database flattens a subquery into a join, when it materializes a derived table, and when it re-executes per row is critical for Laravel applications with complex reporting or nested relationship queries.

---

## Core Concepts

- **Correlated subquery**: References columns from the outer query and executes once per outer row. This is the most dangerous subquery pattern for large datasets.
- **Derived table (subquery in FROM)**: Materialized as a temporary result set before the outer query runs. Cannot reference outer query columns directly (use LATERAL for that).
- **LATERAL join (PostgreSQL)**: Allows the subquery to reference columns from preceding FROM items. Executes the subquery for each row of the driving table, but can use indexes.
- **Semi-join / anti-join transformation**: The optimizer can rewrite `WHERE id IN (SELECT ...)` into a semi-join, avoiding full materialization of the subquery result.
- **Subquery flattening**: Optimizers convert simple subqueries into joins when safe. EXISTS, IN, = ANY patterns are most likely to be flattened.

```sql
-- Correlated subquery (re-executed per row)
SELECT * FROM users WHERE (SELECT COUNT(*) FROM orders WHERE orders.user_id = users.id) > 5;

-- Same result with LATERAL (PostgreSQL)
SELECT * FROM users JOIN LATERAL (SELECT COUNT(*) as cnt FROM orders WHERE orders.user_id = users.id) stats ON stats.cnt > 5;

-- Semi-join transformation target
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 100);
```

---

## Mental Models

A correlated subquery is like an API call inside a loop — it makes N requests to the database, one per row. A LATERAL join is like Promise.all — it still runs per row but uses efficient index lookups. A derived table is like computing all intermediate results first, then filtering — good when the inner result set is small relative to the outer.

---

## Internal Mechanics

MySQL creates derived tables (subqueries in FROM) as materialized temporary tables without indexes unless the optimizer pushes conditions down (MySQL 8.0.14+ derived condition pushdown). PostgreSQL can leave derived tables as references to the underlying tables, enabling index usage from the outer query. PostgreSQL's LATERAL join is evaluated by passing each row from the left side as a parameter to the right side subquery — the right side can use indexes based on the passed parameter.

```sql
-- MySQL 8.0.14+ can push WHERE conditions into derived tables
SELECT * FROM (SELECT * FROM orders WHERE status = 'active') AS active_orders WHERE created_at > '2024-01-01';
-- Previously: materialize all active orders first, then filter by date
-- Now: push WHERE created_at > '2024-01-01' into the subquery when safe
```

---

## Patterns

**Eloquent subquery select with optimal indexing**: When using `addSelect` with a subquery, ensure the correlated column in the subquery is indexed.

```php
// Eloquent: correlated subquery for most recent order
User::addSelect(['last_order_date' => Order::select('created_at')
    ->whereColumn('user_id', 'users.id')
    ->latest()
    ->limit(1)
]);

// Equivalent raw PostgreSQL with LATERAL (in DB::raw if needed)
$users = User::from('users')
    ->select('users.*', 'last_orders.created_at as last_order_date')
    ->joinRaw('JOIN LATERAL (
        SELECT created_at FROM orders
        WHERE orders.user_id = users.id
        ORDER BY created_at DESC
        LIMIT 1
    ) last_orders ON true')
    ->get();
```

**Subquery in EXISTS vs IN**: Prefer `whereHas` (generates EXISTS) over `whereIn` with a subquery for large lists. EXISTS can short-circuit on first match.

```php
// EXISTS (good - can short-circuit)
User::whereHas('orders', fn($q) => $q->where('total', '>', 1000))->get();

// IN with subquery (materializes the subquery result first)
User::whereIn('id', Order::where('total', '>', 1000)->pluck('user_id'))->get();
```

**Semi-join in MySQL**: MySQL 5.6+ transforms IN (subquery) into semi-join internally for most cases. Use `EXPLAIN FORMAT=TREE` to verify the transformation happened.

---

## Architectural Decisions

| Decision | When | When Not |
|----------|------|----------|
| Use LATERAL join | PostgreSQL, need per-row correlated data with index access | MySQL (no LATERAL support) |
| Use EXISTS subquery | Checking existence, subquery result is large | Subquery result is small (< 100 rows) |
| Use derived table (FROM subquery) | Need to aggregate then filter on aggregate | Query can be written as a single-level join |
| Use Eloquent subquery addSelect | Simple per-row computed columns | Complex multi-column subquery results |

---

## Tradeoffs

| Benefit | Cost |
|---------|------|
| Subquery addSelect is expressive | Generates correlated subquery that runs per row |
| LATERAL join is efficient per-row | Not available in MySQL, less familiar syntax |
| Derived tables isolate complexity | Can materialize large intermediate results without indexes |
| Subquery flattening is automatic | Not guaranteed — depends on optimizer version and statistics |

---

## Performance Considerations

- Always `EXPLAIN ANALYZE` subquery-heavy queries. Look for "DEPENDENT SUBQUERY" which indicates correlation.
- A correlated subquery on a 100k-row table with no index on the correlated column = 100k full table scans.
- PostgreSQL 17+ improves LATERAL join estimation and can use additional statistics for better plans.
- MySQL 8.0.21+ adds hash join support which can benefit certain subquery patterns.

```sql
-- Check for dependent subqueries in MySQL
EXPLAIN FORMAT=JSON SELECT * FROM users WHERE (SELECT COUNT(*) FROM orders WHERE orders.user_id = users.id) > 5;
-- Look for "dependent" in the query block
```

---

## Production Considerations

- **Never ship a correlated subquery without EXPLAIN verification** in code review. Add query profiling to CI pipeline.
- Set up monitoring for queries with "DEPENDENT SUBQUERY" or "MATERIALIZED" in execution plans.
- For reporting endpoints, benchmark the subquery version against the JOIN version. Simpler SQL often outperforms clever subquery tricks at scale.
- PostgreSQL: Use `auto_explain` module with `log_min_duration` to capture slow queries with their plans.

---

## Common Mistakes

**Using subquery in WHERE IN with large result set**: `WHERE id IN (SELECT id FROM ...)` materializes the full subquery result. Use EXISTS or JOIN instead when the subquery returns thousands of rows.

**Nested subquery in Eloquent without index**: Adding `Order::select('total')->whereColumn('user_id', 'users.id')->orderBy('created_at')->limit(1)` as an addSelect without indexing `orders.user_id` or `orders.created_at` causes a full scan per user.

**LATERAL without proper index**: LATERAL is only fast when the inner query can use an index for the parameter passed from the outer query.

```php
// Missing index: orders (user_id, created_at) => full scan per row
User::addSelect(['last_order' => Order::selectRaw('JSON_OBJECT("id", id, "total", total)')
    ->whereColumn('user_id', 'users.id')
    ->latest()
    ->limit(1)
]);
```

---

## Failure Modes

- **Subquery materialization blowup**: A derived table returning 1M rows that the outer query then filters to 10 rows. The database wasted effort building the full materialized result. Solution: push conditions down or use EXISTS.
- **DEPENDENT SUBQUERY in MySQL EXPLAIN**: Indicates the subquery is correlated and may execute per row. If `rows` is high and `filtered` is low, the query will be slow.
- **NOT IN with NULL values**: `WHERE id NOT IN (SELECT user_id ...)` returns zero rows if the subquery result contains any NULL. Always use `NOT EXISTS` instead.

---

## Ecosystem Usage

Laravel's query builder does not expose LATERAL join syntax natively. Use `joinSub` with raw SQL or the `DB::raw()` approach for PostgreSQL LATERAL patterns. Third-party packages for reporting (like `laravel-data` or custom query object patterns) can encapsulate subquery complexity.

---

## Related Knowledge Units

4.8 whereDate sargability breakage | 4.10 Function wraps in WHERE clause | 4.18 Keyset pagination | 12.18 Lateral joins in PostgreSQL

---

## Research Notes

MySQL 9.0+ is expected to add more subquery optimization features. PostgreSQL's LATERAL implementation is mature but optimizer statistics for LATERAL estimates were significantly improved in PostgreSQL 15/16. The trend in both databases is toward automatic flattening of more subquery patterns, reducing the need for manual rewriting.
