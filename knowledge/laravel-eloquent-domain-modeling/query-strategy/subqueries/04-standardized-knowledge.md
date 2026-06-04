# Subqueries — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Subqueries
- **ECC Version:** 1.0

## Overview
Subqueries embed SELECT statements within other query clauses — as column expressions in SELECT, as filtering conditions in WHERE, or as data sources in FROM. Eloquent provides first-class support through closure-based builders, `whereExists`, `whereIn` with subquery closures, `selectSub`, and `addSelect` with subquery patterns. Subqueries unlock single-query optimizations like "latest post per user" or "count of related records as a column" that would otherwise require N+1 queries or complex joins.

## Core Concepts
- Subquery Select: embedding a SELECT as a column via `addSelect(['alias' => $subQuery])` or `selectSub(closure, alias)`
- Subquery Where: using subqueries in WHERE via `where(closure)`, `whereExists`, `whereIn`
- Correlated Subquery: references outer query columns via `whereColumn`
- `whereExists` / `whereNotExists`: existence checks with subqueries
- Subquery as FROM: `from(closure, alias)` for derived tables
- Binding management: subquery bindings merge into parent's binding arrays

## When To Use
- "Latest X per Y" queries (latest post per user, last login per account)
- Aggregation columns from related tables without joins (count, sum, latest date)
- Existence checks where `has()` / `whereHas()` produce suboptimal SQL
- ORDER BY based on related data: `orderByDesc(Login::select('created_at')->whereColumn(...))`
- Filtering by aggregated conditions: users with more than 5 orders

## When NOT To Use
- Do NOT use correlated subqueries for large result sets where joins would be more efficient
- Do NOT use subqueries in SELECT when the subquery may return multiple rows (throws database error)
- Do NOT use subqueries when a simple `withCount()` or `withExists()` suffices
- Do NOT deeply nest subqueries beyond 2-3 levels — readability and optimizer performance suffer

## Best Practices (WHY)
- Prefer closure-based subqueries over raw SQL strings for automatic binding management
- Always alias subquery selects: `addSelect(['alias' => $subQuery])` — missing alias causes SQL error
- Use `SELECT 1` inside `whereExists` for optimal performance (database ignores the select list)
- Verify subquery SQL with `toSql()` before deploying — complex closures can generate surprising SQL
- Prefer Eloquent's `withCount()`, `withExists()` for simple relationship aggregates before writing manual subqueries

## Architecture Guidelines
- Encapsulate common subquery patterns (e.g., `latestPost()`, `orderCount()`) as scopes or builder methods
- Document correlated subqueries with comments explaining the correlation column
- Extract subquery closures to named variables or methods when they exceed 5 lines
- Keep subquery-heavy queries in dedicated query objects or repository methods

## Performance
- Correlated subqueries execute per outer row — can be expensive on large tables
- `whereExists` with `SELECT 1` is the most efficient existence check
- Subqueries in ORDER BY may prevent index usage — test with `EXPLAIN`
- Deep nesting may hit database binding limits (e.g., SQLite limit of 999)
- Database optimizers may materialize or flatten subqueries; test with actual data volumes

## Security
- Closure-based subqueries use parameterized bindings automatically — safe from SQL injection
- Raw subqueries (`DB::raw('(SELECT ...)')`) must use `?` placeholders for user input
- Validate any user-provided values used inside subquery closures (e.g., date ranges, thresholds)
- Be cautious with subqueries in `orderBy` that accept user-controlled direction

## Common Mistakes
- Missing `whereColumn` correlation — subquery returns the same scalar for all rows
- Subquery in SELECT without alias causes SQL syntax error
- Binding order mismatch when mixing `whereRaw` with subqueries
- Over-nesting — subqueries 4+ levels deep are nearly impossible to debug
- Scalar subquery returns multiple rows — always ensure aggregate subqueries return one row

## Anti-Patterns
- **Correlated Subquery in Loop**: a correlated subquery inside a PHP loop is effectively N+1 at the database level
- **Raw String Subqueries**: using `DB::raw("(SELECT ...)")` with string interpolation instead of closures
- **Subquery for Simple Joins**: using a subquery when a simple `LEFT JOIN` would be faster and clearer
- **Hidden Subqueries**: subqueries inside accessors or computed attributes that fire on every row access
- **Unbounded Subqueries**: subqueries without `LIMIT 1` that could return multiple rows in scalar context

## Examples
```php
// Latest post per user (subquery select)
$users = User::addSelect(['last_post_at' => Post::select('created_at')
    ->whereColumn('user_id', 'users.id')
    ->latest()
    ->take(1)
])->get();

// Count as column
$users = User::addSelect(['order_count' => Order::selectRaw('COUNT(*)')
    ->whereColumn('user_id', 'users.id')
])->get();

// Where exists
$users = User::whereExists(fn($q) => $q->select(DB::raw(1))
    ->from('orders')
    ->whereColumn('user_id', 'users.id')
    ->where('total', '>', 100)
)->get();

// Order by subquery
$users = User::orderByDesc(Order::select('created_at')
    ->whereColumn('user_id', 'users.id')
    ->latest()
    ->take(1)
)->get();

// Subquery from (derived table)
$avgScores = DB::table(fn($q) => $q->select('team_id', DB::raw('AVG(score) as avg_score'))
    ->from('scores')
    ->groupBy('team_id'), 'team_avgs')
    ->where('avg_score', '>', 80)
    ->get();
```

## Related Topics
- Builder Fundamentals — constraint methods and binding management
- Conditional Clauses — `when()` for conditionally applying subquery constraints
- Performance Tradeoffs — subquery vs join performance comparison
- Hybrid Strategies — combining subqueries with `toBase()` for optimal performance

## AI Agent Notes
- Use closure syntax for subqueries to ensure automatic binding management
- Always add `->take(1)` to scalar subqueries to prevent multi-row errors
- Prefer `withCount()` / `withExists()` before writing manual subquery selects
- Verify correlated subqueries have proper `whereColumn` to link to outer query
- Check `toSql()` output to ensure subquery SQL is well-formed

## Verification
- [ ] Subquery closures use automatic binding management (no raw strings)
- [ ] All subquery selects have aliases
- [ ] Scalar subqueries include `->take(1)` to prevent multi-row errors
- [ ] Correlated subqueries include `whereColumn` linking to outer query
- [ ] SQL verified with `toSql()` and `explain()`
- [ ] Subquery performance tested against actual data volumes (not just development data)
