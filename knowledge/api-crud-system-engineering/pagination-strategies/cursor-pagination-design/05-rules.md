# Cursor Pagination Design — Phase 5 Rules

## Always Include a Tiebreaker Column
---
## Category
Reliability | Design
---
## Rule
Always include the primary key as the final ORDER BY column in every cursor-paginated query.
---
## Reason
Without a tiebreaker, multiple records sharing the same sort value create non-deterministic page boundaries, causing records to appear on multiple pages or be skipped entirely.
---
## Bad Example
```php
// Single-column sort — non-deterministic with duplicate created_at values
Post::orderBy('created_at', 'desc')->cursorPaginate(15);
```
---
## Good Example
```php
// Primary key tiebreaker guarantees deterministic ordering
Post::orderBy('created_at', 'desc')->orderBy('id', 'desc')->cursorPaginate(15);
```
---
## Exceptions
When the sort column is a UNIQUE column with no possible duplicates.
---
## Consequences Of Violation
Duplicate or missing records across pages; unreliable infinite scroll; inconsistent UX.
---

## Use cursorPaginate() Over Manual Cursor Construction
---
## Category
Framework Usage | Maintainability
---
## Rule
Use Laravel's `cursorPaginate()` for all cursor-paginated endpoints unless a specific requirement forces manual implementation.
---
## Reason
`cursorPaginate()` handles cursor encoding, WHERE clause construction, LIMIT+1 has_more detection, and response formatting automatically. Manual implementation duplicates this logic and introduces bug surface.
---
## Bad Example
```php
// Manual cursor pagination — error-prone and untestable
$decoded = json_decode(base64_decode($request->cursor));
$posts = Post::where(function ($q) use ($decoded) {
    $q->where('created_at', '<', $decoded->created_at)
      ->orWhere(function ($q) use ($decoded) {
          $q->where('created_at', $decoded->created_at)
            ->where('id', '<', $decoded->id);
      });
})->orderBy('created_at', 'desc')->orderBy('id', 'desc')->limit(16)->get();
```
---
## Good Example
```php
// Laravel handles everything — encoding, WHERE clause, has_more
$posts = Post::orderBy('created_at', 'desc')->orderBy('id', 'desc')->cursorPaginate(15);
```
---
## Exceptions
Manual implementation is justified for: (a) encryption requirements, (b) multi-column cursors needing row constructor syntax, (c) legacy format compatibility.
---
## Consequences Of Violation
Unnecessary code maintenance; subtle pagination bugs; inconsistent cursor format.
---

## Expose Only Cursor Parameters, Not Page Numbers
---
## Category
Design | Reliability
---
## Rule
Never expose both `page` and `cursor` parameters on the same endpoint.
---
## Reason
Mixing parameters lets clients bypass cursor pagination's consistency guarantees by using the offset-based `page` parameter, defeating the purpose of cursor pagination.
---
## Bad Example
```php
// Both cursor and page parameters — clients can choose the less-consistent option
public function index(Request $request) {
    if ($request->has('cursor')) {
        return Post::cursorPaginate(15);
    }
    return Post::paginate(15); // Offset fallback defeats cursor consistency
}
```
---
## Good Example
```php
// Only cursor parameters exposed
public function index(Request $request) {
    return Post::orderBy('created_at', 'desc')
        ->orderBy('id', 'desc')
        ->cursorPaginate(15);
}
```
---
## Exceptions
During offset-to-cursor migration, both methods may coexist with documented deprecation of the offset path.
---
## Consequences Of Violation
Phantom reads; duplicate records; inconsistent pagination behavior across clients.
---

## Return Both next_cursor and prev_cursor in Responses
---
## Category
Design
---
## Rule
Always include `next_cursor` and `prev_cursor` in paginated responses to enable bidirectional navigation without additional API calls.
---
## Reason
Clients need backward navigation (e.g., returning to a previous page) without storing cursor history themselves. Including both directions in the response enables this with zero additional server cost.
---
## Bad Example
```json
{
    "data": [...],
    "meta": { "next_cursor": "abc123" }
    // No prev_cursor — client cannot navigate backward
}
```
---
## Good Example
```json
{
    "data": [...],
    "meta": {
        "next_cursor": "abc123",
        "prev_cursor": "def456",
        "has_more": true
    }
}
```
---
## Exceptions
Unidirectional feeds (append-only activity streams) where backward navigation is meaningless.
---
## Consequences Of Violation
Extra client-side cursor history; inability to navigate backward; poor UX.
---

## Use has_more Boolean Instead of Total Count
---
## Category
Design | Performance
---
## Rule
Return a `has_more` boolean instead of `total` and `last_page` in cursor-paginated responses.
---
## Reason
Cursor pagination cannot efficiently compute total count — doing so requires a separate expensive COUNT(*) query that defeats the performance advantage of cursor pagination over offset pagination.
---
## Bad Example
```php
// Adding total count to cursor pagination — expensive and pointless
$total = Post::count(); // Extra query defeating cursor's purpose
$posts = Post::cursorPaginate(15);
```
---
## Good Example
```php
// has_more comes free from LIMIT+1 detection
$posts = Post::orderBy('created_at', 'desc')->orderBy('id', 'desc')->cursorPaginate(15);
// Response has has_more: true/false without any extra query
```
---
## Exceptions
When the product explicitly requires a count and the dataset is small (<5000 rows), a cached approximate count is acceptable.
---
## Consequences Of Violation
Defeated cursor performance advantage; doubled query time; misleading total due to concurrent writes.
---

## Validate Cursor Format on Every Request
---
## Category
Reliability | Security
---
## Rule
Validate cursor structure, format, and type on every decode attempt; return 400 for malformed cursors.
---
## Reason
Invalid cursors from client bugs, tampering, or version mismatches should produce a clear 400 error, not a 500 server error. This separates client errors from server failures and prevents information leakage.
---
## Bad Example
```php
// Assuming all cursors are valid — 500 on failure
$posts = Post::where('id', '>', json_decode(base64_decode($request->cursor))->id)->cursorPaginate();
```
---
## Good Example
```php
// Validate and return clear error
try {
    $cursor = $this->decodeCursor($request->cursor);
} catch (InvalidCursorException $e) {
    Log::warning('Invalid cursor', ['error' => $e->getMessage()]);
    abort(400, 'The provided cursor is invalid.');
}
$posts = Post::where('id', '>', $cursor->id)->cursorPaginate();
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
500 errors for malformed cursors; information leakage in error messages; client confusion.
---

## Design Index Before Implementing Cursor Pagination
---
## Category
Performance | Scalability
---
## Rule
Create the matching composite index before deploying cursor-paginated endpoints; verify with EXPLAIN ANALYZE.
---
## Reason
Without a supporting composite index, cursor queries fall back to full table scans with sequential sorts, performing worse than offset pagination. The index must match the ORDER BY columns and directions exactly.
---
## Bad Example
```php
// Cursor query without supporting index — full table scan
Schema::table('posts', function (Blueprint $table) {
    $table->index('created_at'); // Wrong — doesn't match ORDER BY
});
```
---
## Good Example
```php
// Composite index matching ORDER BY directions exactly
Schema::table('posts', function (Blueprint $table) {
    $table->index(['created_at', 'id']); // Matches ORDER BY created_at DESC, id DESC
});
// Verify: EXPLAIN ANALYZE SELECT ... WHERE (created_at, id) < (...) ORDER BY created_at DESC, id DESC LIMIT 16
```
---
## Exceptions
For datasets under 1000 records where full table scan performance is acceptable.
---
## Consequences Of Violation
Full table scans on every paginated request; degraded performance; worse than offset pagination.
---

## Handle Cursor Pointing to Deleted Records Gracefully
---
## Category
Reliability
---
## Rule
When a cursor points to a deleted record, return `data: [], has_more: false`, never 404 or an error.
---
## Reason
Records can be deleted between page requests. Returning an error or 404 for this case breaks client pagination loops and forces clients to handle pagination failures as errors rather than normal end-of-content.
---
## Bad Example
```php
// Cursor points to deleted record — 404 error breaks client flow
$lastRecord = Post::findOrFail($decodedCursor->id); // 404 if deleted
```
---
## Good Example
```php
$posts = Post::where('created_at', '<=', $cursor->created_at)
    ->where(function ($q) use ($cursor) {
        $q->where('created_at', '<', $cursor->created_at)
          ->orWhere('id', '<', $cursor->id);
    })
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->limit(16)
    ->get();

if ($posts->isEmpty()) {
    return response()->json(['data' => [], 'meta' => ['has_more' => false]]);
}
```
---
## Exceptions
When the specific record identified by the cursor must exist (e.g., paginating a user's own posts by ID).
---
## Consequences Of Violation
Broken infinite scroll; client errors; 404 entries in monitoring.
---

## Keep Cursor Content Minimal
---
## Category
Security | Performance
---
## Rule
Encode only the sort column values needed to construct the WHERE clause, never entire records.
---
## Reason
Minimal cursors reduce payload size, avoid exposing unnecessary data, and simplify the encode/decode process. Including full records in cursors exposes all record fields to anyone who decodes the cursor.
---
## Bad Example
```php
// Full record in cursor — exposes all fields
$cursor = base64_encode(json_encode($lastRecord->toArray()));
```
---
## Good Example
```php
// Only sort columns needed for WHERE clause
$cursor = base64_encode(json_encode([
    'created_at' => $lastRecord->created_at,
    'id' => $lastRecord->id,
]));
```
---
## Exceptions
Encrypted cursors carrying data for server-side preloading may include additional fields.
---
## Consequences Of Violation
Data leakage; bloated responses; increased URL length.
