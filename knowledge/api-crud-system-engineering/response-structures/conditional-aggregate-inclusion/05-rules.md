# conditional-aggregate-inclusion Rules

## Rule 1: Always Gate Aggregate Fields with `whenAggregated()` or `whenCounted()`
---
## Category
Performance
---
## Rule
Always use `whenAggregated()` or `whenCounted()` for every computed aggregate field returned in a resource, never access aggregate attributes directly.
---
## Reason
Direct access like `$this->posts_count` triggers a missing-attribute error or a lazy subquery when the aggregate was not loaded, causing N+1 queries or crashes.
---
## Bad Example
```php
public function toArray($request)
{
    return [
        'comments_count' => $this->comments_count, // crash if not loaded
    ];
}
```
---
## Good Example
```php
public function toArray($request)
{
    return [
        'comments_count' => $this->whenCounted('comments'),
        'votes_avg' => $this->whenAggregated('votes', 'rating', 'avg'),
    ];
}
```
---
## Exceptions
Aggregates that are always loaded for every consumer of the endpoint (must be documented and enforced).
---
## Consequences Of Violation
N+1 aggregate queries during serialization, or `BadMethodCallException` for unloaded attributes. Response times degrade proportionally to the number of unloaded aggregates.

## Rule 2: Load Aggregates in Controllers Only
---
## Category
Code Organization
---
## Rule
Always call `withCount()`, `withSum()`, and other aggregate-loading methods in controllers or query scopes, never in the resource layer.
---
## Reason
Resources should decide presentation, not loading. Loading aggregates inside resources bypasses the controller's query optimization and makes loading decisions non-deterministic.
---
## Bad Example
```php
class UserResource extends JsonResource
{
    public function toArray($request)
    {
        // Loading inside resource — wrong layer
        $this->loadCount('posts');
        return [
            'posts_count' => $this->whenCounted('posts'),
        ];
    }
}
```
---
## Good Example
```php
// Controller
$users = User::withCount('posts')->get();

// Resource
public function toArray($request)
{
    return [
        'posts_count' => $this->whenCounted('posts'),
    ];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
N+1 query patterns, unpredictable query execution, mixing of loading and presentation concerns. Query optimization becomes impossible.

## Rule 3: Match Aggregate Aliases Exactly Between Loading and Display
---
## Category
Reliability
---
## Rule
Always use the exact same alias string in `withCount(['relation as alias'])` and `whenAggregated('alias')`.
---
## Reason
`whenAggregated()` checks for the attribute name as it appears on the model. A mismatch between the custom alias and the check string silently omits the field, with no error or warning.
---
## Bad Example
```php
// Controller
$posts = Post::withCount(['comments as total_comments'])->get();

// Resource
'count' => $this->whenAggregated('comments'), // doesn't match 'total_comments'
```
---
## Good Example
```php
// Controller
$posts = Post::withCount(['comments as comments_count'])->get();

// Resource
'comments_count' => $this->whenCounted('comments'), // matches default

// Or with custom alias — mirror exactly
$posts = Post::withCount(['comments as total_comments'])->get();
'count' => $this->whenAggregated('total_comments'),
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Aggregate field silently absent from every response. Debugging requires comparing controller and resource code line by line.

## Rule 4: Provide Default Values for Nullable Aggregates
---
## Category
Reliability
---
## Rule
Always use the null coalescing operator (`??`) to provide a safe default for aggregate values that may be null when no records exist.
---
## Reason
`withSum()` and `withAvg()` return `null` when no related records match the query. Clients receiving `null` for a numeric field must handle the null case or crash.
---
## Bad Example
```php
'orders_total' => $this->whenAggregated('orders', 'amount', 'sum'),
// Returns null when user has no orders — client expects a number
```
---
## Good Example
```php
'orders_total' => $this->whenAggregated('orders', 'amount', 'sum') ?? 0,
// Returns 0 when user has no orders
```
---
## Exceptions
When the API explicitly documents that the field may be null and clients handle null.
---
## Consequences Of Violation
Client-side type errors when null is passed to number formatters, aggregation functions, or display components. Increased client-side null-checking boilerplate.

## Rule 5: Restrict Aggregate Count to at Most Five per Resource
---
## Category
Performance
---
## Rule
Never include more than five `withCount()` or aggregate calls per endpoint query.
---
## Reason
Each aggregate adds a correlated subquery to the SELECT clause. Beyond five subqueries, query planning time and execution overhead degrade response times significantly.
---
## Bad Example
```php
$posts = Post::withCount([
    'comments', 'likes', 'shares', 'bookmarks', 'reports',
    'views', 'clicks', 'conversions', 'reactions', 'flags',
])->get(); // 10 subqueries
```
---
## Good Example
```php
$posts = Post::withCount([
    'comments',
    'likes',
    'shares',
])->get(); // 3 subqueries — controlled
```
---
## Exceptions
Admin-only endpoints with explicit performance monitoring and database optimization for the extra subqueries.
---
## Consequences Of Violation
Slow page loads, database CPU saturation, and increased query execution time. Query planner may switch to suboptimal execution plans with many correlated subqueries.

## Rule 6: Combine Aggregate Inclusion with Authorization Conditions
---
## Category
Security
---
## Rule
Gate aggregate loading behind authorization checks when the aggregate reveals sensitive business metrics (revenue, user counts, financial data).
---
## Reason
Aggregates like `withSum('orders', 'amount')` expose financial data. Loading them unconditionally and relying on `whenAggregated()` to hide them still executes the expensive subquery and risks exposure through logging or caching.
---
## Bad Example
```php
// Loaded for every user — just hidden from non-admins
$users = User::withSum('orders', 'amount')->get();
```
---
## Good Example
```php
// Only loaded for authorized users
$users = User::query()
    ->when($request->user()->isAdmin(), fn($q) => $q->withSum('orders', 'amount'))
    ->get();
```
---
## Exceptions
Aggregates computed from non-sensitive data where the subquery cost is negligible regardless of authorization.
---
## Consequences Of Violation
Sensitive business metrics exposed via database logs, query monitoring tools, or caching layers. Unauthorized users incur the performance cost of aggregated queries they cannot see.
