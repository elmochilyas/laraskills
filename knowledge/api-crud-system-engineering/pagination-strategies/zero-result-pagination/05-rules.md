# Zero-Result Pagination — Phase 5 Rules

## Always Return HTTP 200 With data: [] for Empty Pages
---
## Category
Reliability | Design
---
## Rule
Always return HTTP 200 with data: [] for empty paginated responses; never return 404, 204, or null data.
---
## Reason
404 implies the resource endpoint does not exist. 204 implies no content in the body. Both break client pagination loops that expect a consistent response shape. A 200 with empty array is the universal signal that pagination is complete.
---
## Bad Example
```php
// 404 for empty page — client cannot distinguish missing endpoint from empty page
if ($page > $lastPage) {
    abort(404, 'Page not found');
}
```
---
## Good Example
```php
// 200 with empty array — consistent and parseable
return response()->json([
    'data' => [],
    'meta' => [
        'current_page' => 1,
        'per_page' => 15,
        'total' => 0,
        'last_page' => 1,
    ],
]);
```
---
## Exceptions
No common exceptions — always return 200 with data: [] for empty pages.
---
## Consequences Of Violation
Broken client pagination loops; attacker can distinguish empty datasets from non-existent endpoints.
---

## Return Empty Array for data, Never Null or Omitted
---
## Category
Reliability
---
## Rule
Always return data: [] (empty array) for empty paginated responses; never return data: null, data: {}, or omit the data key.
---
## Reason
Clients iterate over the data array using .map(), .forEach(), or for...of loops. null breaks these operations with TypeError. An empty array is the only value that is both semantically correct and safe for iteration.
---
## Bad Example
```php
// Null data — breaks client iteration
return response()->json([
    'data' => null,
    'meta' => [...],
]);
// Client crashes: data.map is not a function
```
---
## Good Example
```php
// Empty array — safe for iteration
return response()->json([
    'data' => [],
    'meta' => [...],
]);
// Client: data.length === 0, data.map() returns []
```
---
## Exceptions
No common exceptions — always return [] for data.
---
## Consequences Of Violation
Client runtime errors; TypeError exceptions; broken pagination UI.
---

## Include Accurate Metadata in Empty Responses
---
## Category
Design | Reliability
---
## Rule
Include accurate meta fields (total, last_page, per_page, current_page) even when the data array is empty.
---
## Reason
Clients use meta fields to determine the correct page range and display pagination controls. Missing or inaccurate meta in empty responses breaks page selectors and confuses users about the actual dataset size.
---
## Bad Example
```json
{
    "data": [],
    "meta": {
        "current_page": 99,
        "per_page": 15
    }
    // Missing total, last_page — client cannot determine dataset bounds
}
```
---
## Good Example
```json
{
    "data": [],
    "meta": {
        "current_page": 99,
        "per_page": 15,
        "from": null,
        "to": null,
        "total": 57,
        "last_page": 4
    }
    // Total and last_page tell client they are beyond the end
}
```
---
## Exceptions
Cursor pagination where total and last_page are inherently unavailable — include has_more: false instead.
---
## Consequences Of Violation
Confused pagination UI; broken page selectors; client logic errors.
---

## Check has_more in Addition to Empty Data Array
---
## Category
Reliability
---
## Rule
Implement client-side pagination termination logic that checks both data.length === 0 and has_more === false as defensive measures.
---
## Reason
Edge cases can produce empty data with has_more: true (e.g., all remaining records deleted between requests). Checking only data.length may cause infinite request loops. Dual-checking is defensive.
---
## Bad Example
```javascript
// Only checking data length — can infinite loop
async function loadMore() {
    const data = await fetchPosts(cursor);
    if (data.data.length > 0) {
        appendPosts(data.data);
        cursor = data.meta.next_cursor;
        await loadMore(); // May loop forever if has_more stays true
    }
}
```
---
## Good Example
```javascript
// Checking both — defensive termination
async function loadMore() {
    const data = await fetchPosts(cursor);
    if (data.data.length === 0 || !data.meta.has_more) {
        hasMore = false;
        return;
    }
    appendPosts(data.data);
    cursor = data.meta.next_cursor;
    if (hasMore) await loadMore();
}
```
---
## Exceptions
No common exceptions — always implement both checks for defensive pagination.
---
## Consequences Of Violation
Infinite request loops; server DoS; client memory exhaustion; excessive API billing.
---

## Document Empty-Page Behavior in API Reference
---
## Category
Maintainability
---
## Rule
Document that all paginated endpoints return HTTP 200 with data: [] for empty results, and explain how clients should detect end-of-content.
---
## Reason
Clients need to know: (a) they will never receive 404 for empty pages, (b) they can rely on data being an array (never null), and (c) they should check data.length and has_more for termination. Undocumented behavior leads to defensive client code that may break.
---
## Bad Example
```php
// No documentation — clients guess at empty-page behavior
// Some clients may implement 404 handling unnecessarily
```
---
## Good Example
```php
/**
 * Pagination Behavior:
 * - Empty pages return HTTP 200 with data: [] (never 404)
 * - data is always an array (never null)
 * - Check data.length === 0 or has_more === false for end-of-content
 * - For offset pagination: total and last_page are always accurate
 * - For cursor pagination: has_more: false indicates end
 */
```
---
## Exceptions
No common exceptions — always document empty-page behavior.
---
## Consequences Of Violation
Client defensive code; unnecessary 404 handling; integration errors.
---

## Log Excessive Out-of-Range Page Requests
---
## Category
Security | Maintainability
---
## Rule
Log and alert on repeated out-of-range page requests (page significantly exceeding last_page) for abuse detection.
---
## Reason
Repeated out-of-range requests may indicate client bugs, data scraping attempts, or stale total counts that need cache refresh. Monitoring provides early detection of these issues.
---
## Bad Example
```php
// No monitoring — out-of-range requests go undetected
$users = User::paginate(15);
// page=999999 triggers expensive deep-offset query — no alert
```
---
## Good Example
```php
$page = (int) $request->input('page', 1);
$users = User::paginate(15);

if ($users->lastPage() > 0 && $page > $users->lastPage() * 2) {
    Log::channel('abuse')->warning('Excessive page number', [
        'user_id' => auth()->id(),
        'page' => $page,
        'last_page' => $users->lastPage(),
        'endpoint' => $request->path(),
    ]);
}
```
---
## Exceptions
Legitimate automated scripts that intentionally probe page boundaries.
---
## Consequences Of Violation
Undetected scraping; undetected client bugs; stale count cache going unnoticed.
---

## Never Distinguish Empty Types With Different Status Codes
---
## Category
Design | Reliability
---
## Rule
Use the same HTTP 200 + data: [] structure for all empty page types; if distinguishing empty types matters, use meta.reason field, never different status codes.
---
## Reason
Status codes have specific meanings. Using 200 for one empty type and 404 for another forces clients to implement per-code logic. meta.reason provides semantic distinction without breaking standard HTTP semantics.
---
## Bad Example
```php
// Different status codes for different empty types — breaks client logic
if ($page > $totalPages) {
    return response()->json(['data' => []], 404); // Out of range
}
if ($totalResults === 0) {
    return response()->json(['data' => []], 204); // No content
}
```
---
## Good Example
```php
// Same 200 with meta.reason for distinction
return response()->json([
    'data' => [],
    'meta' => [
        'reason' => 'page_exceeds_total', // or 'no_results', 'cursor_depleted'
        'total' => 57,
        'last_page' => 4,
    ],
]);
```
---
## Exceptions
No common exceptions — always use meta.reason over different status codes.
---
## Consequences Of Violation
Client complexity; non-standard HTTP semantics; broken pagination logic.
---

## Ensure Empty Cursor Responses Include has_more: false
---
## Category
Reliability | Design
---
## Rule
When cursor pagination returns an empty data array, always include has_more: false and next_cursor: null in the response.
---
## Reason
Clients rely on has_more to terminate cursor pagination loops. Absence of these fields in empty responses can cause infinite loops (client assumes has_more defaults to true) or crashes from undefined access.
---
## Bad Example
```json
{
    "data": []
    // No has_more field — client may default to true and continue looping
}
```
---
## Good Example
```json
{
    "data": [],
    "meta": {
        "has_more": false,
        "next_cursor": null,
        "prev_cursor": "abc123"
    }
    // Explicit has_more: false terminates client pagination
}
```
---
## Exceptions
No common exceptions — always include has_more: false in empty cursor responses.
---
## Consequences Of Violation
Infinite client pagination loops; excessive server load; API billing waste.
---

## Consider Pre-emptive Existence Check for Expensive Queries
---
## Category
Performance
---
## Rule
For genuinely empty datasets where the full pagination query (including count) is expensive, add a pre-emptive Model::exists() check before running the full pagination.
---
## Reason
Running paginate() on a genuinely empty dataset still executes COUNT(*) and a data query with LIMIT/OFFSET. For expensive queries (complex WHERE, JOINs), this is wasted work when exists() can return false in microseconds.
---
## Bad Example
```php
// Expensive pagination query on guaranteed empty dataset
$posts = Post::where('status', 'archived')
    ->where('created_at', '<', '2020-01-01')
    ->paginate(15); // Runs count + data query even if zero results
```
---
## Good Example
```php
// Pre-emptive existence check avoids expensive pagination
$query = Post::where('status', 'archived')
    ->where('created_at', '<', '2020-01-01');

if (! $query->exists()) {
    return response()->json([
        'data' => [],
        'meta' => ['total' => 0, 'last_page' => 1],
    ]);
}

return $query->paginate(15);
```
---
## Exceptions
When the query is inexpensive (simple WHERE on indexed column) — exists() is unnecessary overhead.
---
## Consequences Of Violation
Wasted database resources on guaranteed-empty queries; unnecessary latency.
