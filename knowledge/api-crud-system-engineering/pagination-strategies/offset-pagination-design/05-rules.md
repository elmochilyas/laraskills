# Offset Pagination Design — Phase 5 Rules

## Enforce a Maximum per_page Limit
---
## Category
Security | Performance
---
## Rule
Always enforce a documented maximum `per_page` value (default 100) on every paginated endpoint.
---
## Reason
Unbounded `per_page` allows clients to request tens of thousands of records in a single response, causing out-of-memory errors, slow queries, and resource exhaustion attacks.
---
## Bad Example
```php
// No maximum — client can request 100K records
$perPage = $request->input('per_page', 15);
$users = User::paginate($perPage);
```
---
## Good Example
```php
// Clamp to safe range
$perPage = min(max((int) $request->input('per_page', 15), 1), 100);
$users = User::paginate($perPage);
```
---
## Exceptions
Dedicated export endpoints designed for batch processing, with their own safeguards.
---
## Consequences Of Violation
OOM errors; slow responses; DoS vector; excessive database load.
---

## Validate Page Number as Integer >= 1
---
## Category
Reliability | Security
---
## Rule
Validate that the page parameter is a positive integer (>= 1) before passing it to paginate().
---
## Reason
Negative, zero, or non-integer page values can crash pagination logic, produce undefined behavior in SQL LIMIT/OFFSET clauses, or be used for DoS by specifying extreme offsets.
---
## Bad Example
```php
// No validation — page=0 or page=-1 or page=abc
$users = User::paginate(perPage: 15, page: $request->input('page'));
// Laravel casts to int, but page=0 returns empty, page=-1 may behave unexpectedly
```
---
## Good Example
```php
// Validate before pagination
$request->validate(['page' => 'integer|min:1']);
$users = User::paginate(perPage: 15, page: (int) $request->input('page', 1));
```
---
## Exceptions
Internal APIs where the caller is trusted and validates inputs upstream.
---
## Consequences Of Violation
Erratic pagination behavior; empty responses; potential for abuse via extreme page values.
---

## Return 200 With Empty Data for Out-of-Range Pages
---
## Category
Reliability | Design
---
## Rule
Always return HTTP 200 with `data: []` for pages beyond the last page; never return 404.
---
## Reason
404 signals that the resource endpoint does not exist, not that the page is empty. Returning 404 for out-of-range pages prevents clients from distinguishing a pagination boundary from a missing endpoint, and attackers can use it to probe for data existence.
---
## Bad Example
```php
// Returning 404 for empty page — breaks client pagination
if ($page > $lastPage) {
    abort(404, 'Page not found');
}
```
---
## Good Example
```php
// Laravel's paginate() already handles this correctly — returns 200 with data: []
$users = User::paginate(15);
// Page beyond last_page → { data: [], meta: { current_page: 99, total: 57, last_page: 4 } }
```
---
## Exceptions
No common exceptions — always return 200 for empty pages.
---
## Consequences Of Violation
Broken client pagination loops; attacker can distinguish empty datasets from non-existent endpoints.
---

## Use page/per_page Naming for Public APIs
---
## Category
Design | Maintainability
---
## Rule
Use `page` and `per_page` parameter names for public REST APIs; reserve `offset` and `limit` for internal APIs.
---
## Reason
`page` and `per_page` are more user-friendly, match Laravel and JSON:API conventions, and are familiar to most API consumers. `offset`/`limit` is database-idiomatic and better suited for internal tooling.
---
## Bad Example
```php
// Database terminology in public API
// GET /api/users?offset=15&limit=15
$users = User::offset($request->offset)->limit($request->limit)->get();
```
---
## Good Example
```php
// User-friendly naming matching Laravel conventions
// GET /api/users?page=2&per_page=15
$users = User::paginate(perPage: $request->per_page, page: $request->page);
```
---
## Exceptions
Internal APIs where the callers are developers familiar with database terminology.
---
## Consequences Of Violation
Client confusion; non-standard API design; integration friction.
---

## Use simplePaginate() When Total Count Is Not Required
---
## Category
Performance
---
## Rule
Use `simplePaginate()` instead of `paginate()` when the client does not need `total`, `last_page`, or a page selector.
---
## Reason
`paginate()` always executes an expensive `COUNT(*)` query in addition to the data query. `simplePaginate()` eliminates the count, reducing response time by 30-80% on large tables.
---
## Bad Example
```php
// COUNT(*) executed even though total is not displayed in UI
$posts = Post::where('status', 'published')->paginate(15);
// Client only uses prev/next links — total is wasted overhead
```
---
## Good Example
```php
// No COUNT(*) — sufficient for prev/next navigation
$posts = Post::where('status', 'published')->simplePaginate(15);
```
---
## Exceptions
Admin panels and dashboards where exact total count is required for pagination UI.
---
## Consequences Of Violation
Unnecessary database load; doubled response time; wasted resources.
---

## Document Default and Maximum per_page Per Endpoint
---
## Category
Maintainability | Design
---
## Rule
Document the default and maximum `per_page` values for every paginated endpoint in the API reference.
---
## Reason
Clients cannot make informed design decisions about page sizes without knowing defaults and limits. Undocumented limits lead to integration errors and support requests.
---
## Bad Example
```php
// No documentation — clients guess at acceptable values
// GET /api/users?per_page=50 — client doesn't know if 50 is accepted
```
---
## Good Example
```php
/**
 * @queryParam per_page int Records per page (default: 15, max: 100)
 * @queryParam page int Page number (default: 1)
 */
public function index(Request $request) {
    $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
    return User::paginate($perPage);
}
```
---
## Exceptions
No common exceptions — always document defaults and limits.
---
## Consequences Of Violation
Client confusion; integration errors; support burden; unexpected 400 errors.
---

## Never Use Offset Pagination for Real-Time Feeds
---
## Category
Reliability | Design
---
## Rule
Use cursor pagination instead of offset for any endpoint serving real-time feeds or frequently updated content.
---
## Reason
Offset pagination suffers from phantom reads — concurrent inserts shift page boundaries, causing the same record to appear on multiple pages or records to be skipped entirely.
---
## Bad Example
```php
// Offset pagination for activity feed — duplicates on new posts
$activities = Activity::orderBy('created_at', 'desc')->paginate(15);
```
---
## Good Example
```php
// Cursor pagination for real-time feeds — immune to phantom reads
$activities = Activity::orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15);
```
---
## Exceptions
Append-only datasets with zero concurrent writes (archived logs).
---
## Consequences Of Violation
Duplicate records; skipped records; confusing user experience in feeds.
---

## Keep Response Structure Consistent Across All Paginated Endpoints
---
## Category
Maintainability | Design
---
## Rule
Return a consistent `meta` and `links` structure from every paginated endpoint, regardless of the pagination strategy used.
---
## Reason
Clients should handle pagination uniformly across all endpoints. Inconsistent response structures force clients to implement endpoint-specific parsing logic, increasing integration complexity and bug surface.
---
## Bad Example
```php
// Endpoint A: different structure than Endpoint B
// /api/posts → { "data": [...], "total": 100, "page": 2 }
// /api/users → { "items": [...], "meta": { "total_count": 100, "current": 2 } }
```
---
## Good Example
```php
// Consistent paginated response structure across all endpoints
// { "data": [...], "meta": { "current_page": 2, "per_page": 15, "total": 100, "last_page": 7 }, "links": { "first": "...", "last": "...", "prev": "...", "next": "..." } }
```
---
## Exceptions
Legacy endpoints during migration where breaking structural consistency would break existing clients.
---
## Consequences Of Violation
Client confusion; per-endpoint parsing logic; increased maintenance and bug surface.
---

## Never Rely on total Being Perfectly Accurate
---
## Category
Reliability | Design
---
## Rule
Document that `total` is a point-in-time estimate, not a guaranteed-accurate count, especially on datasets with concurrent writes.
---
## Reason
Concurrent INSERT/DELETE operations between the COUNT(*) query and the data query can make `total` stale within milliseconds. Clients should not use `total` for critical business logic.
---
## Bad Example
```php
// Assuming total is exact
$total = User::count(); // May change before data query completes
$users = User::paginate(15);
// total = 100, but data may have 98 or 102 records due to concurrent mutations
```
---
## Good Example
```php
// Documenting total as approximate
// In API docs: "total is a point-in-time estimate and may not reflect concurrent mutations"
$users = User::paginate(15);
```
---
## Exceptions
Append-only datasets with no concurrent writes (archived logs).
---
## Consequences Of Violation
Misleading totals; client logic errors; data inconsistency complaints.
