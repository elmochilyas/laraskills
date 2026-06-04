# conditional-aggregate-inclusion

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: conditional-aggregate-inclusion
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Conditional aggregate inclusion controls whether computed values (counts, sums, averages) appear in API responses based on whether the controller loaded them via `withCount()`, `withSum()`, `withAvg()`, `withMin()`, or `withMax()`. `whenAggregated()` and `whenCounted()` prevent unnecessary aggregate computation by deferring to the controller's loading decisions.

Aggregates are expensive to compute — each adds a correlated subquery to the SELECT clause. Making them conditional ensures they only appear when explicitly requested and loaded, preventing runaway query costs from resource serialization.

## Core Concepts
- **`whenAggregated($relation, $column, $function)`**: Includes aggregate value only when the model has the corresponding attribute loaded.
- **`whenCounted($relation)`**: Convenience wrapper for `whenAggregated($relation, '*', 'count')`.
- **Eloquent Aggregate Methods**: `withCount()`, `withSum()`, `withAvg()`, `withMin()`, `withMax()`, `withExists()`.
- **Aggregate Attribute Naming**: `{relation}_{function}_{column}` (e.g., `posts_avg_rating`).
- **Custom Aggregate Names**: `withCount(['posts as post_count'])` — `whenAggregated()` must match the custom alias.
- **Attribute Availability**: Aggregate attributes only exist after the query — accessing without loading triggers errors or returns null.

## When To Use
- Any computed aggregate field that represents optional summary data alongside a resource.
- Collection endpoints where aggregates provide per-item summary data.
- Admin/user-specific endpoints where aggregates are needed only for authorized consumers.
- Resources designed for multiple controller paths (some load aggregates, some don't).

## When NOT To Use
- For aggregates that are always needed by every consumer of the endpoint.
- In place of separate `/stats` endpoints for complex aggregate reporting.
- When aggregates can be computed from already-loaded relationships (use `whenCounted()` or manual count).
- For aggregates on tables with millions of rows — consider cached/materialized aggregate tables.

## Best Practices (WHY)
- **Use consistent custom aggregate aliases**: `withCount(['comments as comments_count'])` makes `whenAggregated()` calls explicit.
- **Load aggregates in controller, display in resource**: Controller calls `withCount()`, resource calls `whenAggregated()` — never the reverse.
- **Use `whenCounted()` for simple counts**: It's more readable than `whenAggregated('posts', '*', 'count')`.
- **Default to conditional**: Field should only appear when loaded — unconditional aggregate access causes N+1 subqueries.
- **Combine with `when()` for authorization**: `when(auth()->user()->isAdmin(), fn($q) => $q->withCount('internal_notes'))`.

## Architecture Guidelines
- Aggregate inclusion belongs in Resources, not controllers — controllers load, resources decide presentation.
- Decide whether per-resource aggregates belong in the main response or a separate `/stats` endpoint.
- For monetary values with `withSum()`, consider precision handling — format in the resource or return raw values.
- Caching aggregate-heavy responses requires careful cache invalidation when related data changes.

## Performance
- Each `withCount()`/`withSum()` adds a correlated subquery — multiple aggregates multiply query cost.
- Subqueries use `LEFT JOIN` — ensure appropriate indexes exist on the aggregate tables.
- Five `withCount()` calls add five subqueries — consider whether a single raw query with multiple aggregates is more efficient.
- Aggregate values themselves are small (integers, floats) — the cost is in subquery computation on the database server.

## Security
- Aggregate values may expose sensitive business metrics (total revenue, user counts) — gate by user role.
- `withExists()` reveals whether related records exist — can be used for user enumeration if not properly authorized.
- Custom aggregate aliases that leak internal naming conventions should be reviewed.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Using `whenAggregated()` without loading | Controller never calls `withCount()` — field silently omitted | Forgetting to add loading call | Aggregate never appears in response | Ensure controller loads what resource expects |
| Mismatched aggregate aliases | `whenAggregated('posts')` but controller used `withCount(['posts as total_posts'])` | Custom alias doesn't match default | Check fails — aggregate absent | Match alias in `whenAggregated()` or use defaults |
| Accessing aggregate directly | `$this->posts_count` without `whenAggregated()` | Direct attribute access habit | Missing attribute error when not loaded | Always use `whenAggregated()` or `whenCounted()` |
| Aggregate on non-existent relation | `withAggregate()` on undefined relationship | Typo or removed relation | Query crashes at database level | Verify relation names in loading calls |
| Assuming float for sum | `withSum()` returns null when no records exist | Not handling empty results | Client receives null unexpectedly | Wrap in `whenAggregated() ?? 0` for a default |

## Anti-Patterns
- **Unconditional Aggregate Access**: Accessing `posts_count` without `whenCounted()` — causes N+1 or crashes.
- **Controller Loading Without Resource Display**: Controller loads aggregates but resource never uses `whenAggregated()` — wasted queries.
- **Aggregate Overload**: Adding 10+ `withCount()` calls per endpoint — each subquery slows the query.
- **Aggregate for Non-Paginated Lists**: Per-item aggregates on list endpoints with thousands of rows.

## Examples
```php
// Controller
$posts = Post::withCount('comments')->withSum('votes', 'value')->get();

// Resource
public function toArray($request)
{
    return [
        'id' => $this->id,
        'title' => $this->title,
        'comments_count' => $this->whenCounted('comments'),
        'votes_sum' => $this->whenAggregated('votes', 'value', 'sum'),
        'rating_avg' => $this->whenAggregated('reviews', 'rating', 'avg'),
        'custom_aggregate' => $this->whenAggregated('custom_alias'),
    ];
}

// With custom alias
$posts = Post::withCount(['comments as approved_count' => fn($q) => $q->where('approved', true)]);
// Resource: $this->whenAggregated('approved_count')
```

## Related Topics
- **Prerequisites**: conditional-relationship-inclusion
- **Related**: conditional-field-inclusion
- **Advanced**: sparse-fieldset-design

## AI Agent Notes
- Always use `whenCounted()` for counts, `whenAggregated()` for other aggregates.
- When adding a new aggregate to a resource, ensure the controller also loads it.
- Use the same aggregate alias name in both loading and display.
- For monetary sums, consider adding a default of 0: `whenAggregated('orders', 'amount', 'sum') ?? 0`.
- Test that aggregate fields are absent when not loaded and present when loaded.

## Verification
- Every aggregate field uses `whenAggregated()` or `whenCounted()`.
- No `withCount()` or `withSum()` call in the resource layer — only in controllers.
- Aggregate fields are absent from responses when the controller doesn't load them.
- Integration tests verify aggregate presence and correct values when loaded.
- Aggregate subquery performance is monitored via query log in development.
