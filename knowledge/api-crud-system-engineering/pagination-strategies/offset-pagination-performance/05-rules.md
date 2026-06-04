# Offset Pagination Performance — Phase 5 Rules

## Enforce a Maximum Offset Limit
---
## Category
Performance | Security
---
## Rule
Always enforce a maximum offset (e.g., 10,000 rows) on offset-paginated endpoints, returning a clear error or suggesting cursor pagination beyond the limit.
---
## Reason
Deep offsets cause O(N) database traversal — `OFFSET 100000` scans and discards 100,000 rows. Without a limit, clients can trigger catastrophic database load that degrades all endpoints.
---
## Bad Example
```php
// No limit — client can request offset=999999
$users = User::offset($request->offset)->limit(15)->get();
```
---
## Good Example
```php
// Maximum offset guard
$offset = (int) $request->input('offset', 0);
if ($offset > 10000) {
    abort(400, 'Offset exceeds maximum. Use cursor pagination for deep navigation.');
}
$users = User::offset($offset)->limit(15)->get();
```
---
## Exceptions
Dedicated export endpoints with batch processing and extended timeouts.
---
## Consequences Of Violation
Database resource exhaustion; cascading performance degradation; DoS vector.
---

## Benchmark COUNT(*) Separately From Data Query
---
## Category
Performance | Testing
---
## Rule
Always benchmark the COUNT(*) query separately from the data query when using offset pagination with `paginate()`.
---
## Reason
The COUNT(*) query can be 10x slower than the data query on large tables with complex WHERE clauses. Without separate benchmarking, developers may incorrectly attribute the entire response time to the data query.
---
## Bad Example
```php
// Benchmarking total response time — hiding the count query cost
$start = microtime(true);
$users = User::where('status', 'active')->paginate(15);
$totalTime = microtime(true) - $start;
// 500ms total — developer assumes data query is slow, but count is 450ms
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
Misdiagnosed performance problems; unoptimized count queries; slow pagination endpoints.
---

## Use simplePaginate() When Total Count Is Not Required
---
## Category
Performance
---
## Rule
Use `simplePaginate()` instead of `paginate()` for any endpoint where the client does not need the total count or last page number.
---
## Reason
`paginate()` always executes COUNT(*) which can dominate response time on large tables. `simplePaginate()` eliminates the count entirely, cutting response time in half or more.
---
## Bad Example
```php
// COUNT(*) executed on every request — unnecessary overhead
// Infinite scroll endpoint never displays "Page X of Y"
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
Admin panels dashboards that display "Page 3 of 247" or provide page number selectors.
---
## Consequences Of Violation
Unnecessary database load; doubled response time; wasted resources.
---

## Use Covering Indexes for Data Queries
---
## Category
Performance
---
## Rule
Create covering indexes that include all selected columns for frequently accessed offset-paginated queries.
---
## Reason
Covering indexes eliminate table lookups after the index scan. For offset pagination, each scanned row (including the discarded offset rows) that requires a table lookup adds random I/O. Covering indexes convert this to sequential index page reads.
---
## Bad Example
```sql
-- No covering index — table lookup for every scanned row
CREATE INDEX idx_users_created ON users(created_at);
-- Query: SELECT id, name, email FROM users ORDER BY created_at LIMIT 15 OFFSET 10000
-- Each row lookup requires random I/O
```
---
## Good Example
```sql
-- Covering index includes selected columns
CREATE INDEX idx_users_created_covering ON users(created_at) INCLUDE (name, email);
-- Query: SELECT id, name, email FROM users ORDER BY created_at LIMIT 15 OFFSET 10000
-- Index-only scan — no table lookups
```
---
## Exceptions
SELECT * queries where the cost of covering all columns in the index exceeds the benefit.
---
## Consequences Of Violation
Unnecessary random I/O; higher latency; buffer pool pressure from table lookups.
---

## Set Statement Timeouts on Pagination Queries
---
## Category
Reliability | Security
---
## Rule
Configure database statement timeouts (e.g., 5000ms) on offset-paginated endpoints to prevent deep-offset queries from consuming database resources indefinitely.
---
## Reason
Deep-offset queries at extreme positions can run for seconds or minutes, exhausting database connection pools and blocking other queries. A statement timeout ensures runaway queries are killed gracefully.
---
## Bad Example
```php
// No timeout — deep offset query blocks connection for 30+ seconds
DB::connection()->setStatementTimeout(null);
$users = User::offset(999999)->limit(15)->get(); // Runs forever
```
---
## Good Example
```php
// Statement timeout prevents resource exhaustion
DB::connection()->setStatementTimeout(5000);
try {
    $users = User::offset($offset)->limit(15)->get();
} catch (QueryException $e) {
    Log::warning('Pagination query timed out', ['offset' => $offset]);
    abort(500, 'Query timed out. Use cursor pagination for deep pages.');
}
```
---
## Exceptions
Batch processing scripts with appropriate monitoring and longer timeouts.
---
## Consequences Of Violation
Connection pool exhaustion; cascading failures across all endpoints; application unavailability.
---

## Monitor Average Offset Depth Per Endpoint
---
## Category
Maintainability | Performance
---
## Rule
Log and monitor the average offset/page depth requested per endpoint to detect trending performance degradation early.
---
## Reason
As datasets grow, users naturally paginate deeper. Monitoring average offset depth provides early warning that endpoints need migration to cursor pagination before performance becomes unacceptable.
---
## Bad Example
```php
// No monitoring — discover deep offset problems from user complaints
$users = User::paginate(15);
```
---
## Good Example
```php
// Log offset depth for monitoring
$page = (int) $request->input('page', 1);
Log::info('Pagination request', [
    'endpoint' => $request->path(),
    'page' => $page,
    'offset' => ($page - 1) * $perPage,
]);
// Alert when average offset exceeds threshold (e.g., page > 50)
```
---
## Exceptions
Low-traffic internal endpoints where monitoring overhead is excessive.
---
## Consequences Of Violation
Reactive (not proactive) performance management; user complaints before action is taken.
---

## Cache Total Count With Short TTL for Large Tables
---
## Category
Performance
---
## Rule
Cache the total count with a short TTL (60-300 seconds) instead of computing it on every paginated request for tables over 100K rows.
---
## Reason
COUNT(*) on tables over 100K rows can take 100ms-500ms. Caching reduces this to once per TTL window instead of every request, with minimal staleness impact.
---
## Bad Example
```php
// COUNT(*) on every request — 500ms per request
$users = User::where('status', 'active')->paginate(15);
```
---
## Good Example
```php
// Cached total — count computed once per 120 seconds
$total = Cache::remember('users_active_total', 120, function () {
    return User::where('status', 'active')->count();
});
// Use manual pagination with cached total, or document as approximate
```
---
## Exceptions
Admin panels requiring exact real-time counts; write-heavy tables where cache is stale on every request.
---
## Consequences Of Violation
Unnecessary COUNT(*) execution; higher response times; database load spikes.
---

## Implement Hybrid Strategy When Datasets Grow Beyond Offset Threshold
---
## Category
Scalability | Performance
---
## Rule
Implement an automatic strategy switch when datasets exceed offset performance thresholds — offset for shallow pages, cursor pagination for deep pages.
---
## Reason
Hybrid strategy maintains backward compatibility for shallow-page clients while preventing deep-offset performance degradation. This allows a graceful migration without breaking existing clients.
---
## Bad Example
```php
// All-or-nothing — deep pages cause performance problems
$users = User::paginate(15); // Fails at deep pages
```
---
## Good Example
```php
// Automatic strategy switch
$page = (int) $request->input('page', 1);
if ($page > 100) {
    return User::orderBy('id')->cursorPaginate(15);
}
return User::paginate(15);
```
---
## Exceptions
When the API version explicitly guarantees offset pagination for all page depths.
---
## Consequences Of Violation
Performance degradation at scale; forced breaking changes for migrating clients.
---

## Use Read Replicas for COUNT(*) Queries
---
## Category
Performance | Scalability
---
## Rule
Route COUNT(*) queries to read replicas when available and when the endpoint is read-heavy.
---
## Reason
COUNT(*) on large tables consumes significant database CPU and I/O. Offloading this to read replicas prevents the primary database from being saturated by count queries, preserving write throughput.
---
## Bad Example
```php
// Default connection — COUNT(*) competes with writes
$users = User::on('mysql')->paginate(15);
```
---
## Good Example
```php
// Read replica for count query
$total = DB::connection('mysql_read')->table('users')->count();
// Primary for data query (needs fresh data)
$users = User::on('mysql')->offset($offset)->limit(15)->get();
```
---
## Exceptions
Single-database setups with no read replicas; applications with very low read traffic.
---
## Consequences Of Violation
Primary database CPU saturation; write throughput degradation; replication lag amplification.
