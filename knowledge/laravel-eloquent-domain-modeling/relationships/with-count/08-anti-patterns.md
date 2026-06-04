# Anti-Patterns: withCount / loadCount

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** with-count

## Anti-Patterns

### Loading the Whole Collection to Count
Using `$user->posts->count()` (loading all child models) instead of `withCount('posts')`. Loading full model instances just to count them wastes memory and bandwidth.

**Problem:** Unnecessary model hydration; wasted memory and CPU for models immediately discarded.

**Solution:** Use `withCount('posts')` — adds a `COUNT(*)` subquery with zero model hydration.

### withCount When withExists Suffices
Using `withCount()` when only a yes/no existence answer is needed. `withCount()` performs a full count even when a simple boolean check would suffice.

**Problem:** Wasteful `COUNT(*)` aggregation when `EXISTS` short-circuit is faster.

**Solution:** Use `withExists()` for boolean checks — `EXISTS` short-circuits on the first match.

### Redundant withCount on Already Eager-Loaded Relation
Using `withCount('relation')` on a relationship that is already being eager-loaded with `with('relation')`. The relationship data is available — counting via PHP is free after hydration.

**Problem:** Unnecessary additional subquery when the relation data is already in memory.

**Solution:** If the related models are already loaded, use `$model->relation->count()` in PHP instead of adding a second subquery.

### Unindexed FK with withCount
Using `withCount()` on a relationship whose foreign key column is not indexed. The correlated subquery performs a full table scan per parent row.

**Problem:** Slow queries; full table scan per parent row in the correlated subquery.

**Solution:** Index the foreign key column on the child table for subquery performance.

### Multiple Redundant withCount Calls
Calling `withCount()` on the same relationship multiple times with slightly different constraints when one suffices. Each `withCount()` adds a separate subquery.

**Problem:** Multiple redundant subqueries; unnecessary database overhead.

**Solution:** Combine constraints into a single `withCount()` call where possible.

### Expecting Relationship Loaded from withCount
Using `withCount('comments')` and then accessing `$post->comments`, expecting the related models to be loaded. `withCount()` only loads the count integer — it does not eager-load the relationship.

**Problem:** Lazy loading triggers because the relationship was not actually loaded.

**Solution:** Use `with('comments')` when you need the actual related models, or combine both: `withCount('comments')->with('comments')`.
