# Total Count Performance — Phase 5 Rules

## Benchmark COUNT(*) Separately From the Data Query
---
## Category
Performance | Testing
---
## Rule
Always benchmark the COUNT(*) query separately from the data query when using offset pagination with paginate().
---
## Reason
The COUNT(*) query can be 10x slower than the data query on large tables with complex WHERE clauses. Without separate benchmarking, developers incorrectly attribute response time to the data query and miss the count optimization opportunity.
---
## Bad Example
```php
// Total response time measured — hides count query cost
$start = microtime(true);
$users = User::where('status', 'active')->paginate(15);
$totalTime = microtime(true) - $start;
// 500ms — developer thinks data query is slow, but count is 450ms
```
---
## Good Example
```php
// Separate benchmarking for count
$countStart = microtime(true);
$total = User::where('status', 'active')->count();
$countTime = microtime(true) - $countStart;

$dataStart = microtime(true);
$users = User::where('status', 'active')->offset(0)->limit(15)->get();
$dataTime = microtime(true) - $dataStart;

Log::info('Pagination benchmark', [
    'count_time_ms' => $countTime * 1000,
    'data_time_ms' => $dataTime * 1000,
]);
```
---
## Exceptions
Small tables (<10K rows) where count performance is never a concern.
---
## Consequences Of Violation
Unoptimized count queries; misdiagnosed slow pagination; wasted optimization effort.
---

## Use simplePaginate() When Total Count Is Not Required
---
## Category
Performance
---
## Rule
Use simplePaginate() instead of paginate() when the UI does not display total count, last page number, or a page selector.
---
## Reason
simplePaginate() eliminates the COUNT(*) query entirely, cutting response time in half or more on large tables. If the client only needs next/prev navigation, total is unnecessary overhead.
---
## Bad Example
```php
// Count(*) executed even though total is never shown
// Infinite scroll UI — only uses next_cursor
$posts = Post::where('status', 'published')->paginate(15);
```
---
## Good Example
```php
// No COUNT(*) — sufficient for "load more" navigation
$posts = Post::where('status', 'published')->simplePaginate(15);
```
---
## Exceptions
Admin panels and dashboards that display "Page 3 of 247" or provide page number selectors.
---
## Consequences Of Violation
Unnecessary database load; doubled response time; wasted resources.
---

## Create Covering Indexes for Common Count Queries
---
## Category
Performance
---
## Rule
Create covering indexes (or narrow secondary indexes) that support index-only scans for the most common COUNT(*) WHERE clauses.
---
## Reason
Index-only count scans are dramatically faster than table scans. A narrow index on (status, id) enables MySQL InnoDB and PostgreSQL to count rows by scanning only the index, which is much smaller than the table.
---
## Bad Example
```sql
-- No count-specific index — uses full table scan
-- COUNT(*) WHERE status = 'active' — full table scan on 10M rows
```
---
## Good Example
```sql
-- Narrow index for count queries — index-only scan
CREATE INDEX idx_users_status_id ON users(status, id);
-- COUNT(*) WHERE status = 'active' — scans only the index
```
---
## Exceptions
Tables under 100K rows where count performance is adequate without covering indexes.
---
## Consequences Of Violation
Slow COUNT(*) queries; table scans on every paginated request; unnecessary I/O.
---

## Cache Total Count With Short TTL for Large Tables
---
## Category
Performance | Scalability
---
## Rule
Cache the total count with a short TTL (60-300 seconds) for tables over 100K rows instead of computing it on every paginated request.
---
## Reason
COUNT(*) on tables over 100K rows takes 100ms-500ms or more. Caching reduces frequency to once per TTL window. For most use cases, a 2-minute stale total is acceptable — users don't expect perfectly real-time totals.
---
## Bad Example
```php
// COUNT(*) on every request on 10M row table
$total = User::where('status', 'active')->count(); // 500ms every time
```
---
## Good Example
```php
// Cached total — computed once per 120 seconds
$total = Cache::remember('users_active_total', 120, function () {
    return User::where('status', 'active')->count();
});
```
---
## Exceptions
Admin panels requiring exact real-time totals; financial reporting endpoints.
---
## Consequences Of Violation
Unnecessary COUNT(*) execution on every request; higher response times; database load spikes.
---

## Use cursorPaginate() to Eliminate the Count Requirement Entirely
---
## Category
Performance | Design
---
## Rule
Use cursorPaginate() for new public-facing endpoints to eliminate the COUNT(*) query and its associated cost.
---
## Reason
Cursor pagination has no concept of total count — it returns has_more instead. This eliminates the COUNT(*) query entirely, reducing response time and database load. Most public endpoints don't need total count; infinite scroll feeds, activity streams, and API-first apps only need sequential navigation.
---
## Bad Example
```php
// Offset pagination with COUNT(*) on every request
$posts = Post::where('status', 'published')->paginate(15);
// Expensive count query even though most clients only use next/prev
```
---
## Good Example
```php
// Cursor pagination — no COUNT(*) at all
$posts = Post::where('status', 'published')
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15);
// No count query, only has_more detection
```
---
## Exceptions
Endpoints that require random page access or exact total counts for UX (admin panels, dashboards).
---
## Consequences Of Violation
Unnecessary COUNT(*) overhead; higher latency; limited scalability.
---

## Monitor COUNT(*) Duration and Alert on Threshold Exceeded
---
## Category
Maintainability | Performance
---
## Rule
Monitor COUNT(*) query duration in production and alert when it exceeds 500ms for paginated endpoints.
---
## Reason
Slow COUNT(*) queries degrade all paginated endpoint users. Early detection allows proactive optimization (covering index, caching, strategy switch) before the endpoint becomes unusable for deep pages.
---
## Bad Example
```php
// No monitoring — count query degrades silently
$users = User::paginate(15);
// Count goes from 50ms to 2 seconds over 6 months — undetected
```
---
## Good Example
```php
DB::listen(function ($query) {
    if (str_contains($query->sql, 'count(*)') && $query->time > 500) {
        Log::warning('Slow COUNT(*) query', [
            'sql' => $query->sql,
            'time' => $query->time,
            'endpoint' => request()->path(),
        ]);
        // Alert: Send to Slack/PagerDuty if sustained
    }
});
```
---
## Exceptions
Low-traffic internal endpoints where monitoring overhead exceeds the value.
---
## Consequences Of Violation
Silent performance degradation; late detection; reactive (not proactive) optimization.
---

## Document the Count Strategy Per Endpoint
---
## Category
Maintainability
---
## Rule
Document whether the total count is exact, approximate, or cached in the API reference for each paginated endpoint.
---
## Reason
Clients relying on total for business logic (progress bars, reporting) need to know if the value is exact or approximate. Undocumented count strategies lead to wrong assumptions and data integrity issues.
---
## Bad Example
```php
// No documentation — client assumes exact total
// Actual: cached total, up to 5 minutes stale
$total = Cache::remember('users_total', 300, fn() => User::count());
```
---
## Good Example
```php
/**
 * @response {
 *   "meta": {
 *     "total": 15432,
 *     "total_note": "Approximate — cached, up to 2 minutes stale"
 *   }
 * }
 */
```
---
## Exceptions
Internal endpoints where all consumers understand the infrastructure.
---
## Consequences Of Violation
Client data integrity issues; wrong business decisions based on stale totals; support escalations.
---

## Use Approximate Counts for Large Tables
---
## Category
Performance | Scalability
---
## Rule
For tables over 1M rows, use database statistics (pg_class.reltuples, information_schema.tables.table_rows) for approximate counts instead of exact COUNT(*).
---
## Reason
Exact COUNT(*) on tables over 1M rows can take multiple seconds. Database statistics provide an approximate count in microseconds, which is sufficient for most user-facing pagination displays.
---
## Bad Example
```php
// Exact COUNT(*) on 10M row table — takes 2-5 seconds
$total = User::count();
```
---
## Good Example
```php
// Approximate count from database statistics
if (DB::connection()->getDriverName() === 'pgsql') {
    $total = DB::select("SELECT reltuples AS approximate_count FROM pg_class WHERE relname = 'users'")[0]->approximate_count;
} elseif (DB::connection()->getDriverName() === 'mysql') {
    $total = DB::select("SELECT table_rows AS approximate_count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'")[0]->approximate_count;
}
```
---
## Exceptions
Financial reporting, auditing, or any endpoint requiring exact counts for compliance.
---
## Consequences Of Violation
Slow responses; database load; timeouts on paginated endpoints with exact count requirements.
---

## Ensure Count Queries Respect Authorization Scope
---
## Category
Security
---
## Rule
Apply the same authorization filters (user_id, team_id, role) to COUNT(*) queries as to the data query.
---
## Reason
A count query without authorization filters returns the total for the entire dataset, not just the user's scope. This leaks information about total records the user should not see and produces incorrect pagination metadata.
---
## Bad Example
```php
// Count without authorization — shows total records, not user's records
$total = Post::count(); // All posts in the system
$posts = Post::where('user_id', auth()->id())->paginate(15);
// Shows total=10000 but user only has 50 posts — misleading
```
---
## Good Example
```php
// Count WITH authorization — matches data query scope
$query = Post::where('user_id', auth()->id());
$total = $query->count();
$posts = $query->paginate(15);
// total correctly reflects user's 50 records
```
---
## Exceptions
Public endpoints with no authorization requirements.
---
## Consequences Of Violation
Information leakage; incorrect pagination metadata; client confusion.
