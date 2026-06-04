# withSum / withAvg / withMin / withMax — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** with-sum-avg-min-max
- **ECC Version:** 1.0

## Overview
`withSum()`, `withAvg()`, `withMin()`, `withMax()`, and their `load*()` counterparts extend the `withCount()` subquery pattern to other SQL aggregate functions. They append `SUM(column)`, `AVG(column)`, `MIN(column)`, or `MAX(column)` subqueries to the parent SELECT, enabling computed values (order totals, average ratings, latest dates) without loading related collections.

## Core Concepts
- Each method requires the relationship name and the column to aggregate
- Alias pattern: `{relation}_{function}_{column}` (e.g., `items_sum_price`, `reviews_avg_rating`)
- Multiple aggregates on the same relationship supported by calling the method multiple times
- Constraint callables filter which related rows are included in the aggregate
- Returns the SQL standard result — `SUM`/`AVG`/`MIN`/`MAX` with null handling
- `AVG` returns float regardless of input column type

## When To Use
- Displaying order totals: `Order::withSum('items', 'price')`
- Average ratings: `Product::withAvg('reviews', 'rating')`
- Latest dates: `Thread::withMax('posts', 'created_at')`
- Minimum prices: `Category::withMin('products', 'price')`
- Dashboard metrics and reporting aggregates

## When NOT To Use
- Do NOT use when you only need a count (use `withCount()`)
- Do NOT use when you need the actual related models (use `with()`)
- Do NOT use on unindexed columns — the correlated subquery becomes expensive
- Do NOT use `withAvg()` on integer columns expecting decimal precision without checking cast behavior
- Do NOT use five+ aggregates on the same query — each adds a subquery, slowing the query substantially

## Best Practices (WHY)
- Index the aggregate column together with the foreign key for subquery performance
- Handle `NULL` results — aggregate of empty set returns `NULL`, not `0`
- Use `COALESCE` in a raw expression if a default value is needed
- Prefer `withSum()` over loading all items and summing in PHP (memory + performance)
- Combine with `withCount()` only when both count and aggregate are needed

## Architecture Guidelines
- Cache frequently-accessed aggregate values for high-traffic endpoints
- For dashboards displaying multiple aggregates, consider a single raw subquery or pre-computed summary table
- Use `$casts` on the model to control aggregate value types
- Monitor EXPLAIN plans when combining multiple aggregates in one query

## Performance
- Each aggregate method adds one correlated subquery to the SELECT clause
- Multiple aggregates multiply the cost — `withSum()` + `withAvg()` = two subqueries
- Aggregate subqueries are sensitive to index coverage — index both the FK and the aggregate column
- For empty sets, aggregate returns `NULL` — not a performance concern but a null-handling consideration
- `AVG` always returns float — database performs the conversion

## Security
- Aggregate subqueries only expose computed scalar values, not individual related records
- Constraint callbacks follow standard authorization patterns
- Column names in aggregate calls must be validated if dynamic (SQL injection risk via column name)

## Common Mistakes
- Forgetting the column parameter: `withSum('orders')` throws an argument error
- Expecting `withSum` to return a collection — it returns a scalar attribute
- Not handling `NULL` results for relations with no matching rows
- Using multiple aggregates when one combined query would suffice

## Anti-Patterns
- **Loading related models just to sum them**: `$order->items->sum('price')` instead of `$order->withSum('items', 'price')`
- **Aggregate five+ relationships in one query**: each adds a subquery, slowing execution
- **No index on aggregate column**: correlated subquery does full scan per parent row
- **Unhandled NULL aggregates**: assuming aggregate always returns a number

## Examples
```php
// Total from one-to-many
$orders = Order::withSum('items', 'price')->get();
foreach ($orders as $order) {
    echo $order->items_sum_price; // 199.99
}

// Average rating
$products = Product::withAvg('reviews', 'rating')->get();
echo $products->first()->reviews_avg_rating; // 4.5

// Latest date
$threads = Thread::withMax('posts', 'created_at')->get();
echo $threads->first()->posts_max_created_at; // 2026-06-02

// Conditional aggregate
$users = User::withSum(['orders' => fn($q) => $q->where('status', 'completed')], 'total')->get();

// Multiple aggregates
$products = Product::withSum('orderItems', 'revenue')
    ->withAvg('reviews', 'rating')
    ->withMin('variants', 'price')
    ->withMax('variants', 'price')
    ->get();

// Deferred loading
$orders = Order::all();
$orders->loadSum('items', 'price');
```

## Related Topics
- withCount — COUNT aggregate (foundation for this pattern)
- withExists — boolean existence check
- Model Attribute Casting — controlling aggregate value types
- Constrained Eager Loading — applying constraints in aggregate subqueries

## AI Agent Notes
- Each aggregate method adds a separate correlated subquery — use sparingly
- Handle `NULL` results: `$order->items_sum_price ?? 0`
- Index both the foreign key and the aggregate column for performance
- `AVG` always returns float; `SUM`/`MIN`/`MAX` return the column's native type
- Constraint callbacks work identically to `withCount()` constraints

## Verification
- [ ] `withSum('relation', 'column')` adds correct `{relation}_sum_{column}` attribute
- [ ] `withAvg('relation', 'column')` returns float
- [ ] `withMin`/`withMax` work with date and numeric columns
- [ ] Constraint callbacks correctly filter aggregated rows
- [ ] NULL is returned for empty relation sets (not 0)
- [ ] Aggregate subquery uses appropriate indexes
- [ ] Multiple aggregates in one query execute correctly
