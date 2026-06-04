# Pagination with Complex Filters — Phase 5 Rules

## Apply All Filters Before Pagination in the Database
---
## Category
Performance | Reliability
---
## Rule
Always apply all filter conditions in the database query before the pagination LIMIT/OFFSET or cursor WHERE clause; never filter results in application code after fetching a page.
---
## Reason
Filtering after pagination produces incomplete pages — the query returns per_page records, then the application filter may remove some, leaving fewer than per_page visible results. This also wastes database resources fetching discarded records.
---
## Bad Example
```php
// Filtering after pagination — produces incomplete pages
$posts = Post::paginate(15);
$filtered = $posts->filter(fn($p) => $p->status === 'published');
// Page may show 5 results instead of 15
```
---
## Good Example
```php
// Filtering in the database before pagination
$posts = Post::where('status', 'published')
    ->orderBy('created_at', 'desc')
    ->paginate(15);
```
---
## Exceptions
Filters that cannot be expressed in SQL (e.g., ML model predictions, external service calls).
---
## Consequences Of Violation
Incomplete pages; confusing UX; wasted database resources.
---

## Index Equality-Filter Columns as Leading Index Columns
---
## Category
Performance
---
## Rule
Include frequently-filtered equality columns as the leading columns in the composite index, followed by sort columns.
---
## Reason
Equality filters narrow the scanned range first; sort columns then operate on a smaller row set. Putting sort columns first forces the database to scan all rows matching the sort before applying the filter.
---
## Bad Example
```sql
-- Sort column first — filter cannot narrow the scan
CREATE INDEX idx_posts_created_status ON posts(created_at DESC, status);
-- WHERE status = 'published' ORDER BY created_at DESC
```
---
## Good Example
```sql
-- Equality filter first, then sort columns
CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC);
-- WHERE status = 'published' ORDER BY created_at DESC
```
---
## Exceptions
When the filter column has very low selectivity (e.g., boolean flag) — the sort column should lead.
---
## Consequences Of Violation
Index cannot narrow the range scan; full table scans on filtered queries.
---

## Reset Pagination When Filters Change
---
## Category
Reliability | Design
---
## Rule
Invalidate the cursor/offset when filter parameters change; return an error or reset pagination when filters differ from the current pagination session.
---
## Reason
Cursor position is scoped to a specific filter combination. Changing filters while retaining a cursor from a different filter context produces incorrect results — the cursor position is meaningless under different WHERE conditions.
---
## Bad Example
```php
// Cursor from different filter context — wrong results
// Request 1: GET /api/posts?status=published&cursor=abc
// Request 2: GET /api/posts?status=draft&cursor=abc
```
---
## Good Example
```php
public function index(Request $request) {
    $filterHash = md5(json_encode($request->only(['status', 'category_id'])));
    if ($request->has('cursor') && $request->filter_hash !== $filterHash) {
        abort(400, 'Filters changed. Pagination has been reset.');
    }
    $posts = Post::where('status', $request->status)
        ->orderBy('created_at', 'desc')
        ->cursorPaginate(15);
    return response()->json([
        'data' => $posts->items(),
        'meta' => ['next_cursor' => $posts->nextCursor(), 'filter_hash' => $filterHash],
    ]);
}
```
---
## Exceptions
When filters affect only display (not query) — client-side filtering after pagination.
---
## Consequences Of Violation
Wrong page results; missing or duplicated records; data consistency errors.
---

## Validate Filter Values Before Query Execution
---
## Category
Security | Reliability
---
## Rule
Validate all filter parameter values using Laravel's validation before executing any pagination query.
---
## Reason
Invalid filter values can cause SQL errors, type confusion, or unexpected query behavior. Validating early ensures a clear 400 response before any database resources are consumed.
---
## Bad Example
```php
public function index(Request $request) {
    $posts = Post::where('status', $request->status)->paginate(15);
    // status=invalid_status -> no results, no error message
}
```
---
## Good Example
```php
public function index(Request $request) {
    $request->validate([
        'status' => 'in:draft,published,archived',
        'category_id' => 'integer|exists:categories,id',
        'created_after' => 'date_format:Y-m-d',
    ]);
    $query = Post::query();
    if ($request->filled('status')) {
        $query->where('status', $request->status);
    }
    return $query->orderBy('created_at', 'desc')->paginate(15);
}
```
---
## Exceptions
No common exceptions — always validate filter values before query execution.
---
## Consequences Of Violation
SQL errors; 500 responses from invalid input; wasted database resources.
---

## Limit the Number of Simultaneous Filters
---
## Category
Security | Performance
---
## Rule
Enforce a maximum of 5 simultaneous filter parameters to prevent abuse and unindexable query combinations.
---
## Reason
Each additional filter multiplies query complexity and index design requirements. Unlimited filters produce queries that cannot be indexed, resulting in full table scans and potential DoS vectors.
---
## Bad Example
```php
// Unlimited filters — impossible to index all combinations
// GET /api/posts?status=draft&category=tech&author=123&tag=laravel&date_from=...&date_to=...
```
---
## Good Example
```php
$request->validate([
    'status' => 'in:draft,published,archived',
    'category_id' => 'integer|exists:categories,id',
    'author_id' => 'integer|exists:users,id',
    'search' => 'string|max:100',
    'date_from' => 'date_format:Y-m-d',
]);
```
---
## Exceptions
Admin panels with controlled access where indexed filter combinations are explicitly designed.
---
## Consequences Of Violation
Unindexable query combinations; full table scans; DoS vulnerability.
---

## Avoid LIKE '%term%' in Paginated Queries
---
## Category
Performance
---
## Rule
Never use LIKE '%term%' in paginated queries; use full-text indexes (MATCH AGAINST, tsvector) or prefix search (LIKE 'term%') instead.
---
## Reason
Leading-wildcard LIKE cannot use indexes, forcing full table scans on every paginated page. This destroys pagination performance on large datasets with complex filters.
---
## Bad Example
```php
$posts = Post::where('title', 'LIKE', '%' . $searchTerm . '%')
    ->orderBy('created_at', 'desc')
    ->paginate(15);
```
---
## Good Example
```php
// Full-text index — fast indexed search
$posts = Post::whereFullText('title', $searchTerm)
    ->orderBy('created_at', 'desc')
    ->paginate(15);

// Or prefix search (indexable):
$posts = Post::where('title', 'LIKE', $searchTerm . '%')
    ->orderBy('created_at', 'desc')
    ->paginate(15);
```
---
## Exceptions
Small datasets (<10K records) where full table scan performance is acceptable.
---
## Consequences Of Violation
Full table scans on every paginated search request; database CPU saturation.
---

## Keep Filter Logic in Query Scopes, Separate From Pagination
---
## Category
Code Organization | Maintainability
---
## Rule
Encapsulate filter logic in Laravel query scopes or repository methods; keep pagination as a separate concern layered on top.
---
## Reason
Filtering and pagination are orthogonal concerns. Mixing them produces tangled, untestable code. Separating them enables independent testing of filter logic and pagination behavior.
---
## Bad Example
```php
public function index(Request $request) {
    $query = Post::query();
    if ($request->filled('status')) {
        $query->where('status', $request->status);
    }
    if ($request->filled('category_id')) {
        $query->where('category_id', $request->category_id);
    }
    return $query->orderBy('created_at', 'desc')->paginate(15);
}
```
---
## Good Example
```php
class Post extends Model {
    public function scopeFilter(Builder $query, array $filters): Builder {
        return $query
            ->when($filters['status'] ?? null, fn($q, $v) => $q->where('status', $v))
            ->when($filters['category_id'] ?? null, fn($q, $v) => $q->where('category_id', $v));
    }
}

public function index(Request $request, Post $post) {
    return $post->filter($request->only(['status', 'category_id']))
        ->orderBy('created_at', 'desc')
        ->paginate(15);
}
```
---
## Exceptions
Simple endpoints with a single filter where separation adds unnecessary abstraction.
---
## Consequences Of Violation
Tangled, untestable controller logic; difficult to add new filters; code duplication.
---

## Consider Dedicated Search Engine for Complex Search+Pagination
---
## Category
Scalability | Performance
---
## Rule
Use a dedicated search engine (Meilisearch, Algolia, Elasticsearch) when pagination is combined with full-text search, relevance sorting, or faceted aggregation.
---
## Reason
Database full-text search with pagination degrades under complex queries, relevance scoring, and large datasets. Search engines are purpose-built for these workloads and provide fast, scalable pagination.
---
## Bad Example
```php
// Database search + pagination on 1M records — slow and unscalable
$posts = Post::whereFullText('title', $searchTerm)
    ->orderBy('created_at', 'desc')
    ->paginate(15);
```
---
## Good Example
```php
// Search engine handles search + pagination efficiently
$results = Meilisearch::search($searchTerm)
    ->setSort(['created_at:desc'])
    ->paginate(15);

$ids = collect($results->hits)->pluck('id');
$posts = Post::whereIn('id', $ids)
    ->orderByRaw('FIELD(id,' . $ids->implode(',') . ')')
    ->get();
```
---
## Exceptions
Small datasets (<50K records) where database full-text search is sufficient.
---
## Consequences Of Violation
Slow search responses; poor relevance ranking; unscalable architecture.
