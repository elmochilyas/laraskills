# withSum / withAvg / withMin / withMax Skills

## Skill: Compute relationship aggregates using withSum/withAvg/withMin/withMax

### Purpose
Use aggregate subqueries (`withSum`, `withAvg`, `withMin`, `withMax`) to compute scalar values from related records without loading the related model instances.

### When To Use
- Displaying order totals: `Order::withSum('items', 'price')`
- Average ratings: `Product::withAvg('reviews', 'rating')`
- Latest dates: `Thread::withMax('posts', 'created_at')`
- Minimum prices: `Category::withMin('products', 'price')`
- Dashboard metrics and reporting

### When NOT To Use
- When you only need a count (use `withCount()`)
- When you need the actual related models (use `with()`)
- On unindexed columns (correlated subquery becomes expensive)
- 5+ aggregates on the same query (each adds a subquery)

### Prerequisites
- Defined relationship on the parent model
- Indexed foreign key and aggregate column on child table

### Inputs
- Relationship name
- Column name to aggregate
- Optional constraint callback for filtered aggregates

### Workflow
1. Add `->withSum('items', 'price')` (or `withAvg`/`withMin`/`withMax`) to the parent query
2. Access the aggregate via `$parent->items_sum_price`
3. Handle NULL results: `$order->items_sum_price ?? 0`
4. For filtered aggregates: `->withSum(['orders' => fn($q) => $q->where('status', 'completed')], 'total')`
5. Limit to 3 or fewer aggregates per query
6. Validate column name when it comes from external sources (whitelist allowed columns)

### Validation Checklist
- [ ] Aggregate is obtained via subquery, not by loading + PHP aggregation
- [ ] NULL results are handled with `??` default or `COALESCE`
- [ ] Composite index on `(fk, aggregate_column)` exists
- [ ] 3 or fewer aggregates per query
- [ ] Column name is not from user input (or validated against whitelist)
- [ ] `withAvg()` returns float — code handles decimal precision

### Common Failures
- Loading related models just to sum/average them — memory waste
- Not handling NULL — aggregate of empty set returns NULL, not 0
- No composite index on (fk, aggregate_column) — slow subqueries
- Passing user input as column name — SQL injection risk

### Decision Points
- **Aggregate subquery or PHP aggregation?** — Always prefer subquery when models aren't needed; use PHP only when models are already loaded
- **withSum or withAvg?** — Use `withSum` for totals; use `withAvg` for averages

### Performance Considerations
- Each aggregate adds one correlated subquery to SELECT
- 3+ aggregates multiply cost — limit per query
- Composite index on `(fk, aggregate_column)` is essential
- NULL results from empty sets — no performance concern

### Security Considerations
- Never pass user input as column name — SQL injection via column name
- Validate column names against a whitelist when dynamic
- Aggregate subqueries only expose computed scalars, not individual records

### Related Rules
- [Aggregate-Over-Loading-Collection](../with-sum-avg-min-max/05-rules.md)
- [Aggregate-Handle-NULL-Results](../with-sum-avg-min-max/05-rules.md)
- [Aggregate-Index-Columns](../with-sum-avg-min-max/05-rules.md)
- [Aggregate-Limit-Per-Query](../with-sum-avg-min-max/05-rules.md)
- [Aggregate-AVG-Float-Awareness](../with-sum-avg-min-max/05-rules.md)
- [Aggregate-Column-Name-Validation](../with-sum-avg-min-max/05-rules.md)

### Related Skills
- Count related records using withCount
- Check relationship existence using withExists

### Success Criteria
- `withSum('relation', 'column')` adds correct `{relation}_sum_{column}` attribute
- NULL is returned for empty relation sets
- Composite index enables efficient aggregation
- Column name is validated against whitelist when dynamic
- No unnecessary model hydration for aggregation
