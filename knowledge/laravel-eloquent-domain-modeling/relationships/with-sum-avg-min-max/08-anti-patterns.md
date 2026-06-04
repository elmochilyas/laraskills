# Anti-Patterns: withSum / withAvg / withMin / withMax

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** with-sum-avg-min-max

## Anti-Patterns

### Loading Related Models Just to Aggregate
Using `$order->items->sum('price')` instead of `$order->withSum('items', 'price')`. Loading all related model instances just to compute a sum wastes memory and bandwidth.

**Problem:** Unnecessary model hydration; wasted memory and CPU for models immediately discarded.

**Solution:** Use `withSum('items', 'price')` — adds a `SUM` subquery with zero model hydration.

### Aggregate Five+ Relationships in One Query
Adding five or more aggregate subqueries (`withSum`, `withAvg`, etc.) on a single query. Each aggregate adds a correlated subquery to the SELECT clause, slowing execution.

**Problem:** Multiple correlated subqueries; significantly slower query execution.

**Solution:** Limit aggregates to 1–3 per query. Consider caching pre-computed values or using a raw combined query for dashboards with many aggregates.

### No Index on Aggregate Column
Using aggregate subqueries on an unindexed column. The correlated subquery performs a full scan per parent row.

**Problem:** Slow queries; full table scan per parent row in each aggregate subquery.

**Solution:** Index the aggregate column together with the foreign key for subquery performance.

### Unhandled NULL Aggregates
Assuming aggregate methods always return a number. Aggregates on empty relation sets return `NULL`, not `0` — accessing them without null handling causes type confusion.

**Problem:** Null pointer errors; unexpected `null` values in numeric contexts.

**Solution:** Handle null: `$order->items_sum_price ?? 0` or use `COALESCE` in a raw expression.

### Forgetting the Column Parameter
Calling `withSum('orders')` without the column parameter. The column parameter is required — omitting it throws an argument error.

**Problem:** Argument count error; broken query.

**Solution:** Always provide both the relationship name and the column: `withSum('orders', 'total')`.

### withAvg Without Cast Awareness
Using `withAvg()` on integer columns without considering that the result is a float. Downstream code may expect an integer and break on the float return.

**Problem:** Type mismatch; unexpected decimal values where integers are expected.

**Solution:** Cast the average value as needed or document that `AVG` always returns float.

### withMax for Latest Date Instead of withExists
Using `withMax('posts', 'created_at')` when only a boolean check for existence is needed. Max date retrieval is more expensive than a simple `EXISTS` check.

**Problem:** Unnecessary date retrieval and computation when a boolean check suffices.

**Solution:** Use `withExists()` for existence checks; reserve `withMax()` when the actual maximum value is needed.
