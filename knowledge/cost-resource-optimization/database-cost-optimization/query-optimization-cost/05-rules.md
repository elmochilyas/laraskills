---
## Rule Name
Eager Load All Relationships in Loops

## Category
Performance

## Rule
Always use `with()` to eager load Eloquent relationships when accessing related models in Blade loops or API resource collections. Never access relationships inside a loop without eager loading them first.

## Reason
N+1 queries burn database CPU and memory for every loop iteration, directly increasing database instance cost. Each unnecessary query adds I/O and connection overhead.

## Bad Example
```php
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name;
}
```
51 queries for 50 posts + 1 parent.

## Good Example
```php
$posts = Post::with('author')->get();
foreach ($posts as $post) {
    echo $post->author->name;
}
```
2 queries regardless of post count.

## Exceptions
No common exceptions. Always eager load relationships accessed in loops.

## Consequences Of Violation
10-50x more database queries than necessary, causing CPU saturation on the database instance and forcing upgrades to larger, more expensive instance tiers.

---
## Rule Name
Set Slow Query Log Threshold to 500ms

## Category
Performance

## Rule
Enable the slow query log on all production databases with a threshold of 500ms or lower. Monitor and fix queries exceeding this threshold before considering database instance upgrades.

## Reason
Slow queries are the root cause of 90% of database CPU problems. Fixing slow queries often delays or eliminates the need for a larger database instance.

## Bad Example
Not enabling slow query log, or setting `long_query_time = 10`. Slow queries remain invisible, CPU climbs, team blames "not enough capacity" and upgrades instance.

## Good Example
Setting `long_query_time = 0.5` (MySQL) or `log_min_duration = 500` (PostgreSQL). Review logs weekly, fix the top 5 slowest queries, measure CPU reduction.

## Exceptions
Temporary debugging scenarios where you need full visibility for a short duration.

## Consequences Of Violation
Undiagnosed slow queries force premature database vertical scaling. A fixable query costing $0 can lead to a $500/month instance upgrade.

---
## Rule Name
Select Only Required Columns

## Category
Performance

## Rule
Use `->select(['id', 'name', 'email'])` instead of `->get()` or `->all()` when you only need a subset of columns. Never fetch all columns unless every column is used.

## Reason
`SELECT *` transfers all columns over the network and fills memory with unused data. Wasted I/O and memory directly increase instance load and cost.

## Bad Example
```php
$users = User::where('active', true)->get();
// only uses $user->id and $user->name
```

## Good Example
```php
$users = User::where('active', true)->select(['id', 'name'])->get();
```

## Exceptions
When the result set is small (<100 rows) and the overhead is negligible, or when all columns are genuinely consumed.

## Consequences Of Violation
5-10x I/O overhead per query, wasted buffer pool memory, reduced effective cache capacity, and earlier need for instance scaling.

---
## Rule Name
Use Chunking for Large Dataset Processing

## Category
Performance

## Rule
Use `chunk()`, `lazy()`, or `cursor()` when processing more than 1000 Eloquent models. Never load large datasets into memory in a single query.

## Reason
Loading 100K+ records in one query consumes hundreds of MB of PHP memory and ties up database connections, risking OOM crashes and blocking other queries.

## Bad Example
```php
User::where('created_at', '<', now()->subYear())->get()->each(function ($user) {
    // process 100K users in memory
});
```

## Good Example
```php
User::where('created_at', '<', now()->subYear())->chunk(100, function ($users) {
    foreach ($users as $user) {
        // process 100 users at a time
    }
});
```

## Exceptions
When the dataset is guaranteed <1000 records.

## Consequences Of Violation
PHP memory exhaustion, database connection timeouts, increased instance memory requirements, and higher hosting costs.

---
## Rule Name
Use whereHas Instead of whereIn with Subqueries

## Category
Performance

## Rule
Use `whereHas` or `join` instead of `WHERE IN (SELECT ...)` subqueries. MySQL optimizes EXISTS-based queries better than IN-subqueries.

## Reason
`WHERE IN (SELECT ...)` in MySQL often creates an expensive temporary table. Using EXISTS or JOIN leverages indexes more effectively.

## Bad Example
```php
User::whereIn('id', DB::table('orders')->where('total', '>', 100)->pluck('user_id'))->get();
```

## Good Example
```php
User::whereHas('orders', function ($query) {
    $query->where('total', '>', 100);
})->get();
```

## Exceptions
PostgreSQL handles IN-subqueries well; this rule is primarily for MySQL/MariaDB.

## Consequences Of Violation
Inefficient subquery execution increases database CPU and I/O, reducing the effective capacity of the current instance.

---
## Rule Name
Set a Database Query Count Budget

## Category
Architecture

## Rule
Target fewer than 10 database queries per page load for typical web requests. Use Laravel Debugbar during development and Telescope in production to monitor query count. Flag routes exceeding 20 queries.

## Reason
Excessive query count is the most common cause of unnecessary database load. A query budget creates visibility and accountability.

## Bad Example
A dashboard page making 80+ queries from eager-loaded relationships and unoptimized loops. No one notices because there is no monitoring.

## Good Example
Each page load stays under 10 queries. Debugbar shows query count in development. Telescope alerts when a route exceeds 20 queries.

## Exceptions
Reporting/export pages that legitimately aggregate large datasets may exceed this budget by design.

## Consequences Of Violation
Hidden query bloat forces database scaling. Each unnecessary query adds CPU cycles that reduce the traffic capacity of the current instance.

---
## Rule Name
Avoid Lazy Loading in Production API Responses

## Category
Performance

## Rule
Always specify eager loads on API Resource classes and serialization paths. Never rely on lazy loading for any endpoint serving more than 10 requests per minute.

## Reason
API endpoints scale to thousands of requests per minute. A single N+1 bug in an API endpoint amplifies 1000x, overwhelming the database.

## Bad Example
```php
class PostResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'title' => $this->title,
            'author' => $this->author->name, // lazy load
        ];
    }
}
```

## Good Example
```php
Post::with('author')->get();
// Then pass to PostResource collection
```

## Exceptions
Internal admin endpoints with <10 req/min and known low query impact.

## Consequences Of Violation
A single N+1 bug in a high-traffic API endpoint can spike database CPU to 100%, causing cascading timeouts and forcing an emergency instance upgrade.
