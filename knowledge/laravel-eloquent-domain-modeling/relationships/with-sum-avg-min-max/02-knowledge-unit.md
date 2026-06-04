# withSum / withAvg / withMin / withMax / loadSum — Subquery Aggregate Loading

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** with-sum-avg-min-max
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
`withSum()`, `withAvg()`, `withMin()`, `withMax()`, and their `load*()` counterparts extend the `withCount()` subquery pattern to other SQL aggregate functions. They append a `SUM(column)`, `AVG(column)`, `MIN(column)`, or `MAX(column)` subquery to the parent SELECT, aliased as `{relation}_{function}_{column}`. These enable displaying computed values (order totals, average ratings, latest dates) without loading related collections.

---

## Core Concepts
Each method requires the relationship name and the column to aggregate: `Post::withSum('comments', 'votes')` produces a `comments_sum_votes` column. The subquery syntax mirrors `withCount()` but replaces `COUNT(*)` with `SUM(comments.votes)`, `AVG(comments.votes)`, etc. Multiple aggregates on the same relationship are supported by calling the method multiple times or using the array syntax. The alias pattern follows `{relation}_{function}_{column}` to avoid collisions.

---

## Mental Models
Think of these as **computed properties hydrated at query time** — like adding a formula column to a spreadsheet that pulls from a related table. The model never stores the aggregate; it is always computed fresh from the database. This is equivalent to a SQL window function over a related set, but expressed as a correlated subquery.

---

## Internal Mechanics
Under the hood, each method (e.g. `withSum()`) calls `Relation::getRelationExistenceSumQuery()` (or `Avg`, `Min`, `Max`). These methods clone the relationship's base query, apply the relationship constraints, wrap the target column in the aggregate function, and return a `Builder` instance. The parent query appends this as a subquery in `addSelect()`. The result attribute is cast to the appropriate numeric type — float for AVG, integer/float for SUM/MIN/MAX depending on column type.

---

## Patterns
- **Total from one-to-many**: `Order::withSum('items', 'price')` yields `items_sum_price`
- **Average rating**: `Product::withAvg('reviews', 'rating')` yields `reviews_avg_rating`
- **Latest date**: `Thread::withMax('posts', 'created_at')` yields `posts_max_created_at`
- **Combined aggregates**: `Product::withSum('orderItems', 'revenue')->withAvg('reviews', 'rating')`
- **Conditional aggregates**: `User::withSum(['orders' => fn($q) => $q->where('status', 'completed')], 'total')`

---

## Architectural Decisions
The same architectural choice as `withCount()` — subquery over join — is applied here. Join-based aggregates would require grouping, which multiplies parent rows. Subqueries avoid row duplication at the cost of correlated execution. The alias scheme `{relation}_{function}_{column}` is designed to be deterministic and collision-resistant, but it can produce verbose column names for long relationship or column names.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| No collection loading required | Cannot combine multiple aggregates into one subquery | Each aggregate adds a separate subquery |
| Accurate per-row computation | AVG returns float regardless of input type | May need explicit casting in code |
| Works with relationship constraints | Column name must exist on the related table | Mistyped column names fail at query time |
| Zero PHP-side computation | Correlated subquery cost per row | Monitor EXPLAIN plans for large result sets |

---

## Performance Considerations
Each aggregate method adds one correlated subquery to the SELECT clause. `withSum()` + `withAvg()` = two subqueries, doubling the cost. For dashboards displaying multiple aggregates, consider using a single raw subquery with multiple aggregates or a pre-computed summary table. The `NULL` handling follows SQL standard — `SUM()` of empty set returns `NULL`, not `0`. Use `COALESCE` in a raw expression if a default is needed.

---

## Production Considerations
Aggregate subqueries are sensitive to index coverage — ensure the aggregation column is within a covering index for the relationship's foreign key. For high-traffic endpoints, cache the aggregate values. Avoid `withAvg()` on integer columns expecting decimal precision — the result is already a float, but Laravel's casting may truncate it. Use `$casts` on the model or raw DB raw in the constraint to control precision.

---

## Common Mistakes
- Forgetting the column parameter: `withSum('orders')` throws an argument error.
- Expecting `withSum` to return a collection — it returns a scalar attribute.
- Using `withSum` and `withCount` together on the same relation when only one is needed.
- Not handling `NULL` results for relations with no matching rows (the attribute will be `null`, not `0`).

---

## Failure Modes
- **Column not found on related table**: SQL error `Unknown column` — the aggregate references a column that doesn't exist on the child table.
- **Aggregate type mismatch**: `AVG` on a string column produces unexpected results or a database error.
- **Subquery explosion**: Five aggregates on five different relations = five correlated subqueries, substantially slowing the query.
- **Alias truncation**: Very long relationship or column names may produce truncated aliases in some MySQL configurations.

---

## Ecosystem Usage
Spending dashboards use `withSum('transactions', 'amount')` for running totals. Review systems use `withAvg('ratings', 'score')` for average display. E-commerce platforms use `withMin`/`withMax` for price range filters. Laravel Spark uses aggregate subqueries for team usage metrics.

---

## Related Knowledge Units
### Prerequisites
- with-count (foundations of subquery aggregate pattern)
- Basic relationship definitions

### Related Topics
- with-exists (existence-check variant)
- Query Builder subquery joins (alternative approach)
- Model attribute casting (controlling aggregate types)

### Advanced Follow-up Topics
- Pre-computed aggregate tables for write-heavy workloads
- Materialized view alternatives in PostgreSQL
- Database sharding and cross-shard aggregation

---

## Research Notes
### Source Analysis
`Illuminate\Database\Eloquent\Concerns\QueriesRelationships` contains `withSum()`, `withAvg()`, `withMin()`, `withMax()` and their `load*()` counterparts. Each calls `getRelationExistenceSumQuery()` etc. on the Relation subclass.
### Key Insight
The aggregate methods reuse the same subquery infrastructure as `withCount()`. The only difference is the SQL function and column reference. This means constraint callbacks, nested relations, and dot-syntax all work identically.
### Version-Specific Notes
- Laravel 8+: `withSum()` introduced.
- Laravel 9+: `withAvg()`, `withMin()`, `withMax()` added.
- Laravel 10+: Array syntax for multiple aggregates on the same relation.
- Laravel 11+: Performance optimization for correlated subquery elimination on single-row results.
