# conditional-aggregate-inclusion
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** conditional-aggregate-inclusion  
**Difficulty Level:** Intermediate  
**Last Updated:** 2026-06-02

## Executive Summary
Conditional aggregate inclusion controls whether computed values (counts, sums, averages, mins, maxs) appear in API responses based on whether the corresponding aggregate was loaded on the model via `withCount()`, `withSum()`, `withAvg()`, `withMin()`, or `withMax()`. The `whenAggregated()` method prevents unnecessary aggregate computation by deferring to the controller's loading decisions, while `whenCounted()` handles the specific case of relationship counts.

## Core Concepts
- **`whenAggregated($relation, $column, $function)`: Includes an aggregate value only when the model has the corresponding `{relation}_{function}_{column}` attribute loaded via an Eloquent aggregate method.
- **`whenCounted($relation)`: A convenience wrapper for `whenAggregated($relation, '*', 'count')`. Checks if the `{relation}_count` attribute exists.
- **Eloquent Aggregate Methods**: `withCount()`, `withSum()`, `withAvg()`, `withMin()`, `withMax()`, `withExists()` dynamically append computed columns to the model.
- **Aggregate Attribute Naming**: The appended attribute follows the pattern `{relation}_{function}_{column}` (e.g., `posts_avg_rating`, `orders_sum_amount`, `comments_max_created_at`).
- **Custom Aggregate Names**: Using `$model->withCount(['posts as post_count'])` creates a custom attribute name `post_count` which `whenAggregated()` must match explicitly.
- **Condition vs. Always Include**: Aggregates are expensive to compute. Making them conditional (via `whenAggregated()`) ensures they are only present when explicitly requested and loaded.

## Mental Models
- **Cash Register**: Aggregates are the cash register total — you only want to compute it when the customer asks. `whenAggregated()` is the "only total if scanned" guard.
- **Optional Dashboard**: Aggregates are like optional dashboard widgets. They provide valuable summary data but come at a computational cost. Include them only when the dashboard (controller) decides to turn them on.
- **Cost Meter**: Every aggregate is a cost meter. `withCount()` costs a subquery. `withSum()` costs a subquery with a function. `whenAggregated()` ensures you only pay when you need the reading.

## Internal Mechanics
- **`whenAggregated()` Check**: Checks if the model has a magic attribute matching the pattern `{relation}_{function}_{column}` or a custom name. Uses `array_key_exists()` to verify the attribute is loaded.
- **`withAggregate()`**: Underlying Eloquent method that all `with*()` aggregate methods call. It adds a subquery to the SELECT clause via `addSelect()`.
- **Attribute Availability**: Aggregate attributes are only available after the query executes. Loading a model without `withCount()` means `->posts_count` returns null or triggers a missing attribute error.
- **Multiple Aggregates**: A model can have multiple aggregates loaded simultaneously (e.g., `withCount('posts')` and `withSum('orders', 'amount')`). Each is checked independently by `whenAggregated()`.
- **Custom Aggregate Detection**: When using custom aliases like `withCount(['posts as total_posts'])`, `whenAggregated()` must be called with the custom alias name.

## Patterns
- **Load-Driven Aggregate Inclusion**: Design resources so that every aggregate field is wrapped in `whenAggregated()`. The controller decides which aggregates to load; the resource automatically includes them.
- **Aggregate Field Naming Convention**: Use consistent custom aggregate aliases across the application: `withCount(['comments as comments_count'])`. This makes `whenAggregated()` calls explicit and readable.
- **Bulk Aggregate Loading**: Load multiple aggregates in a single controller call: `Post::withCount('comments')->withSum('votes', 'value')->get()`. The resource includes all aggregates that were loaded.
- **Aggregate Exposure in Collections**: For collection endpoints, aggregate data is typically per-model. Consider whether exposing per-model aggregates on list endpoints is necessary or if a summary endpoint is more appropriate.
- **Conditional Aggregate for Authorization**: Use aggregates only for authorized users: `when(auth()->user()->isAdmin(), fn($q) => $q->withCount('internal_notes'))`. The resource then uses `whenAggregated('internal notes')`.

## Architectural Decisions
- **Aggregate Location**: Decide whether aggregates belong in the main resource response or in a separate `/stats` endpoint. Per-resource aggregates are convenient but make responses larger. Separate endpoints are more RESTful but require additional requests.
- **Custom Alias vs. Default Name**: Default aggregate names (`posts_count`, `orders_sum_amount`) are predictable but verbose. Short custom aliases (`post_count`, `order_revenue`) are cleaner but require the resource to know the custom name.
- **Aggregate Caching**: Aggregate values change when related data changes. Decide whether to cache aggregate-heavy responses or recompute on each request.
- **Aggregate Precision**: `withSum()` for monetary values may need precision handling. Decide whether to round/format in the resource or return raw values.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Zero-cost aggregate omission | Aggregate field is silently absent when not loaded | Client may not realize aggregate data is available |
| Controller controls computation cost | Coupling between controller loading and resource output | Adding aggregate requires controller and resource changes |
| Aggregate naming flexibility | Custom names require resource to know alias | Inconsistent naming between resources is possible |
| Multiple aggregate support | Each aggregate adds a subquery to the SELECT | Too many aggregates slow the query |
| Aggregate + relationship combination | Relationship must be loaded for aggregate to make sense | Confusing when aggregate exists but relation data doesn't |

## Performance Considerations
- **Subquery Cost**: Each `withCount()`/`withSum()` adds a correlated subquery to the SELECT clause. For large tables, these subqueries can be expensive even with indexes.
- **Subquery Optimization**: Eloquent aggregates generate `LEFT JOIN` subqueries. Ensure the subquery can use indexes by keeping the aggregate conditions simple.
- **Multiple Aggregate Overhead**: Five `withCount()` calls add five subqueries to the SELECT. Consider whether a single raw query with multiple aggregates is more efficient.
- **Memory Usage**: Aggregate values themselves are small (integers, floats). The memory cost is in the subquery computation on the database server.

## Production Considerations
- **Monitoring Aggregate Query Performance**: Log query execution times for endpoints that use aggregates. Subquery performance degrades differently than main query performance.
- **Aggregate Loading Documentation**: Document which aggregates are available per resource. Clients cannot request aggregates that the API doesn't support loading.
- **Testing Aggregate Presence and Absence**: Test that aggregate fields appear when the corresponding `with*()` is called AND that they are absent when not loaded.
- **Aggregate Value Type Consistency**: `withCount()` returns an integer. `withSum()` returns a float or integer depending on the column type. Ensure clients receive consistent types.

## Common Mistakes
- **Using `whenAggregated()` Without Loading First**: Calling `whenAggregated('posts', '*', 'count')` but the controller never calls `withCount('posts')`. The field is silently omitted.
- **Mismatched Aggregate Aliases**: `whenAggregated('posts')` checks default naming but controller used custom alias `withCount(['posts as total_posts'])`. The check fails because the attribute name doesn't match.
- **Forgetting `whenAggregated()` on Computed Fields**: Accessing `$this->posts_count` directly triggers a missing attribute error if `withCount()` wasn't called.
- **Aggregate on Non-Relationship**: Calling `withAggregate()` on a non-existent relationship crashes the query. The error surfaces at the query level, not the resource level.
- **Assuming Float Type for Sum**: `withSum()` can return null if no records exist. Wrap in `whenAggregated()` and consider providing a default: `whenAggregated(...) ?? 0`.

## Failure Modes
- **Missing Attribute Error**: Accessing `->posts_count` without loading it throws a `MissingAttributeException` or returns null. The error often surfaces in production because development environment may have different code paths.
- **Aggregate Subquery Performance Degradation**: A `withCount()` subquery on a table with millions of rows and no appropriate index can cause the endpoint to time out.
- **Aggregate Name Collision**: Default aggregate naming `posts_count` collides with a model accessor named `getPostsCountAttribute()`. The accessor takes precedence.
- **Aggregate on Soft-Deleted Relations**: `withCount('comments')` includes soft-deleted comments by default. Use `withCount(['comments' => fn($q) => $q->withoutTrashed()])` to exclude them.

## Ecosystem Usage
- **Laravel Framework**: `Illuminate\Database\Eloquent\Concerns\HasRelationships::withCount()`, `withSum()`, `withAvg()`, `withMin()`, `withMax()`, `withExists()`. The `ConditionallyLoadsAttributes` trait provides `whenAggregated()`.
- **Laravel Nova**: Nova uses aggregates conditionally in its resource table columns and detail views. The user can request counts for related resources.
- **Spatie/laravel-query-builder**: Can be combined with aggregates by allowing clients to request aggregate data via query parameters, which the controller maps to `withCount()` calls.
- **Laravel Stats Packages**: Packages like `laravel-stats` or custom dashboard solutions use Eloquent aggregates extensively for computation.

## Related Knowledge Units
### Prerequisites
- conditional-relationship-inclusion

### Related Topics
- conditional-field-inclusion

### Advanced Follow-up Topics
- sparse-fieldset-design

---

## Research Notes

### Source Analysis
- `Illuminate\Database\Eloquent\Concerns\HasRelationships` (`withCount()`, `withSum()`, `withAvg()`, `withMin()`, `withMax()`, `withExists()`)
- `Illuminate\Http\Resources\ConditionallyLoadsAttributes` (`whenAggregated()`, `whenCounted()`)
- `Illuminate\Database\Eloquent\Model` (magic attribute access for aggregate keys)

### Key Insight
`whenAggregated()` prevents the N+1 aggregate problem by making aggregate fields appear only when the controller explicitly loaded them via `withCount()`/`withSum()` — the resource acts as a passive reflector of the controller's loading decisions, not an active data fetcher.

### Version-Specific Notes
- Laravel 8+: `whenAggregated()` introduced alongside `whenCounted()`
- Laravel 10/11/12/13: Method signatures unchanged; aggregate subquery optimization improved across versions
- Custom aggregate alias detection (`withCount(['posts as total'])`) works identically across all supported versions
