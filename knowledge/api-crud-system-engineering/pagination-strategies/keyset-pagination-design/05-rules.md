# Keyset Pagination Design — Phase 5 Rules

## Always Include a Tiebreaker Column in Keyset Queries
---
## Category
Reliability | Design
---
## Rule
Always include the primary key as the final sort column in every keyset-paginated query.
---
## Reason
Non-unique sort columns produce non-deterministic page boundaries. Records with duplicate sort values can appear on multiple pages or be skipped entirely when a tiebreaker is missing.
---
## Bad Example
```php
// Single-column sort — non-deterministic with duplicate created_at values
$posts = Post::where('created_at', '<', $cursor)
    ->orderBy('created_at', 'desc')
    ->limit(15)
    ->get();
```
---
## Good Example
```php
// Primary key tiebreaker guarantees deterministic ordering
$posts = Post::where('created_at', '<', $cursor->created_at)
    ->orWhere(function ($q) use ($cursor) {
        $q->where('created_at', $cursor->created_at)
          ->where('id', '<', $cursor->id);
    })
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->limit(15)
    ->get();
```
---
## Exceptions
When the sort column has a UNIQUE constraint and semantically requires no tiebreaker (e.g., sorting by email).
---
## Consequences Of Violation
Non-deterministic ordering; duplicate records across pages; skipped records.
---

## Use Parameterized Queries, Never Raw Interpolation
---
## Category
Security
---
## Rule
Always use Eloquent or bound parameters for keyset column values in WHERE clauses; never interpolate values directly into SQL strings.
---
## Reason
Keyset parameters are used directly in SQL WHERE clauses. String interpolation of user-supplied values opens SQL injection vectors, even in internal APIs.
---
## Bad Example
```php
// Raw interpolation — SQL injection risk
$posts = DB::select("SELECT * FROM posts WHERE created_at < '{$request->after_created_at}' ORDER BY created_at DESC LIMIT 15");
```
---
## Good Example
```php
// Parameterized query — safe from SQL injection
$posts = Post::where('created_at', '<', $request->after_created_at)
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->limit(15)
    ->get();
```
---
## Exceptions
No common exceptions — parameterized queries are always required.
---
## Consequences Of Violation
SQL injection vulnerability; data breach; database compromise.
---

## Use Consistent after_ / before_ Parameter Naming
---
## Category
Maintainability | Design
---
## Rule
Use `after_` prefix for forward keyset parameters and `before_` for backward parameters, with consistent naming across all endpoints.
---
## Reason
Consistent parameter naming reduces client confusion and makes keyset documentation self-documenting. Mixed naming conventions force clients to learn different patterns per endpoint.
---
## Bad Example
```php
// Inconsistent naming across endpoints
// /api/posts?after_id=100
// /api/users?last_seen_id=50
// /api/comments?starting_from=200
```
---
## Good Example
```php
// Consistent after_ / before_ naming everywhere
// /api/posts?after_id=100&after_created_at=2026-01-01
// /api/users?after_id=50
// /api/comments?after_id=200&direction=prev
```
---
## Exceptions
When matching an established legacy naming convention that cannot be changed.
---
## Consequences Of Violation
Client confusion; increased integration effort; documentation complexity.
---

## Require Direction Parameter for Bidirectional Navigation
---
## Category
Design | Reliability
---
## Rule
Require a `direction=next` or `direction=prev` parameter to prevent clients from sending conflicting `after_` and `before_` parameters simultaneously.
---
## Reason
Simultaneous `after_` and `before_` parameters produce contradictory WHERE clauses, resulting in incorrect or empty results. A single direction parameter makes the intent explicit.
---
## Bad Example
```php
// Both after and before specified — contradictory WHERE clause
// GET /api/posts?after_id=100&before_id=50
// WHERE id > 100 AND id < 50 → empty results
```
---
## Good Example
```php
// Direction makes intent clear
// GET /api/posts?after_id=100&direction=next → WHERE id > 100
// GET /api/posts?before_id=100&direction=prev → WHERE id < 100

$query = Post::query();
if ($request->direction === 'next') {
    $query->where('id', '>', $request->after_id);
} elseif ($request->direction === 'prev') {
    $query->where('id', '<', $request->before_id);
}
```
---
## Exceptions
Single-direction-only endpoints (append-only feeds with no backward navigation).
---
## Consequences Of Violation
Empty results from contradictory WHERE clauses; client bugs due to ambiguous intent.
---

## Validate Keyset Parameter Types Server-Side
---
## Category
Reliability | Security
---
## Rule
Validate that all keyset parameters match their expected database column types before executing the query.
---
## Reason
Type mismatch between the parameter and the column (e.g., string vs integer for `id`, wrong date format for `created_at`) causes incorrect database comparisons, producing wrong results or SQL errors.
---
## Bad Example
```php
// No type validation — string vs integer comparison
$posts = Post::where('id', '>', $request->after_id)->limit(15)->get();
// If after_id is "abc" or 1.5, comparison is non-deterministic
```
---
## Good Example
```php
// Validate before query
$request->validate([
    'after_id' => 'integer|min:1',
    'after_created_at' => 'date_format:Y-m-d\TH:i:s\Z',
    'direction' => 'in:next,prev',
]);

$posts = Post::where('id', '>', (int) $request->after_id)->limit(15)->get();
```
---
## Exceptions
No common exceptions — always validate parameter types.
---
## Consequences Of Violation
Incorrect query results; SQL errors; data exposure from unexpected type coercion.
---

## Generate Fresh Keyset Values From Current Query Results
---
## Category
Reliability
---
## Rule
Always generate keyset values from the current query's filtered results; never reuse keyset values across different filter contexts.
---
## Reason
Keyset position is scoped to a specific filter and sort combination. Reusing a keyset value from a different filter set (e.g., different status, category) produces incorrect results because the position is meaningless in the new context.
---
## Bad Example
```php
// Replaying keyset from a different filter context
// User changes status filter but sends same after_id
// Result: wrong page because id 100 in status=published ≠ id 100 in status=draft
```
---
## Good Example
```php
// Fresh keyset values from current query results
$posts = Post::where('status', $request->status)
    ->where('id', '>', $request->after_id)
    ->orderBy('id')
    ->limit(15)
    ->get();

$nextId = $posts->last()->id; // Fresh keyset from current results
```
---
## Exceptions
When the filter set is guaranteed identical (Cached responses for identical requests).
---
## Consequences Of Violation
Wrong page results; missing or duplicated records; data consistency errors.
---

## Prefer cursorPaginate() Over Manual Keyset for Multi-Column Sorts
---
## Category
Framework Usage | Maintainability
---
## Rule
For multi-column keyset pagination, use Laravel's `cursorPaginate()` before considering manual WHERE clause construction.
---
## Reason
Multi-column keyset queries require complex nested OR WHERE chains or row constructor syntax. `cursorPaginate()` handles this automatically, including encoding sort values into the cursor and decoding them on the next request.
---
## Bad Example
```php
// Manual multi-column keyset — error-prone WHERE chain
$posts = Post::where('status', '>', $request->after_status)
    ->orWhere(function ($q) use ($request) {
        $q->where('status', $request->after_status)
          ->where('created_at', '<', $request->after_created_at);
    })
    ->orWhere(function ($q) use ($request) {
        $q->where('status', $request->after_status)
          ->where('created_at', $request->after_created_at)
          ->where('id', '<', $request->after_id);
    })
    ->orderBy('status', 'asc')
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->limit(15)
    ->get();
```
---
## Good Example
```php
// cursorPaginate handles everything automatically
$posts = Post::orderBy('status', 'asc')
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15);
```
---
## Exceptions
Internal endpoints where transparent keyset parameters are preferred over opaque cursors for debugging.
---
## Consequences Of Violation
Complex, error-prone WHERE chains; difficult maintenance; higher bug surface.
---

## Define a Default Sort for Requests Without Keyset Parameters
---
## Category
Design | Reliability
---
## Rule
Always define a default sort order for requests that arrive without keyset parameters (initial page request).
---
## Reason
Without a default sort, the first request with no keyset parameters returns results in an undefined order. Subsequent keyset-based requests then produce inconsistent pagination because the initial order was arbitrary.
---
## Bad Example
```php
// No default sort — undefined ordering
public function index(Request $request) {
    $query = Post::query();
    if ($request->has('after_id')) {
        $query->where('id', '>', $request->after_id);
    }
    // No ORDER BY — database default order is undefined
    return $query->limit(15)->get();
}
```
---
## Good Example
```php
// Explicit default sort
public function index(Request $request) {
    $query = Post::query();
    if ($request->has('after_id')) {
        $query->where('id', '>', $request->after_id);
    }
    return $query->orderBy('id', 'asc')->limit(15)->get();
}
```
---
## Exceptions
When the database default order matches the intended keyset order (rarely guaranteed).
---
## Consequences Of Violation
Inconsistent initial ordering; invalid keyset positions; pagination errors.
---

## Validate Authorization Independently of Keyset Parameters
---
## Category
Security
---
## Rule
Apply authorization checks (user_id, team_id, scope) as query filters before applying keyset WHERE clauses; never rely on keyset values for authorization.
---
## Reason
Clients can manipulate keyset parameters to attempt access outside their authorization scope. Authorization must be enforced through separate query filters, not through values embedded in the keyset.
---
## Bad Example
```php
// Authorization relies on keyset value — user can change user_id
$posts = Post::where('id', '>', $request->after_id)
    ->where('user_id', $request->after_user_id) // Client can set any user_id
    ->limit(15)->get();
```
---
## Good Example
```php
// Authorization is enforced separately from pagination
$posts = Post::where('user_id', auth()->id()) // Server-enforced auth
    ->where('id', '>', $request->after_id) // Keyset only controls position
    ->orderBy('id')
    ->limit(15)
    ->get();
```
---
## Exceptions
No common exceptions — always enforce authorization server-side.
---
## Consequences Of Violation
Authorization bypass; data leakage across user boundaries; security breach.
---

## Sanitize Keyset Values in Logs
---
## Category
Security
---
## Rule
Sanitize or obfuscate keyset parameter values in application logs to prevent leakage of internal ordering data.
---
## Reason
Keyset values may expose sequential IDs, temporal patterns, or internal ordering information. Logs are often shared with third parties or stored in log-aggregation tools with broad access.
---
## Bad Example
```php
Log::info('Keyset pagination request', [
    'after_id' => $request->after_id, // Exposes sequential ID patterns
]);
```
---
## Good Example
```php
Log::info('Keyset pagination request', [
    'after_id' => substr($request->after_id, 0, 3) . '***', // Partially obfuscated
]);
```
---
## Exceptions
Internal debugging logs that never leave the secure environment.
---
## Consequences Of Violation
Leakage of business intelligence (record counts, growth rates, ordering); data exposure in logs.
