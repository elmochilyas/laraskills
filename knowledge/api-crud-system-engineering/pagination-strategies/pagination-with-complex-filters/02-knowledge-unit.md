# Pagination with Complex Filters

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Pagination with Complex Filters
- **Last Updated:** 2026-06-02

---

## Executive Summary

Combining pagination with complex filters (multiple WHERE conditions, search queries, JOINs, and aggregations) creates unique challenges. Filter conditions affect both the pagination cursor/offset and the total count query. Performance degrades when filters are applied to unindexed columns. Cursor pagination becomes more complex because the filter columns must be considered in the cursor's WHERE clause construction. The key insight: filters that change between requests invalidate cursor positions and may produce inconsistent pagination results.

---

## Core Concepts

### Filter+Cursor Interaction
When filters are applied, the cursor must point to a position within the filtered result set, not the unfiltered set:
```sql
-- Same filter applied to both cursor and data queries
SELECT * FROM posts
WHERE status = 'published'
  AND (created_at, id) < ('2026-06-01', 100)
ORDER BY created_at DESC, id DESC
LIMIT 16;

-- Without status filter, cursor would be wrong
```

### Dynamic Filter Parameters
```json
// Request with filters
GET /api/posts?status=published&category_id=5&created_after=2026-01-01&page=1

// Filters affect both the query and the count
$query = Post::where('status', $request->status)
    ->where('category_id', $request->category_id)
    ->where('created_at', '>', $request->created_after);
$total = $query->count();
$posts = $query->paginate(15);
```

### Cursor Stability with Filters
When a client paginates with active filters, changing the filters mid-pagination produces inconsistent results. The cursor from the previous filter set is meaningless under the new filter set.

---

## Mental Models

### The Funnel Model
Filters narrow the dataset like a funnel. The pagination navigates within the filtered subset. If the funnel opening changes (different filters), the position within the funnel is reset. You cannot carry a cursor from one funnel shape to another.

### The Search Results Model
Each filter combination creates a unique "search session." The cursor is valid only within that session. Changing filters starts a new session with a fresh result set and new cursor.

### The Venn Diagram Model
Filters define overlapping sets (status=active ∩ category=5 ∩ date>Jan). Pagination navigates within the intersection. If the definition of the intersection changes (new filter), the cursor's reference point may not exist in the new intersection.

---

## Internal Mechanics

### Filtered Cursor Query Construction
```php
public function index(Request $request)
{
    $query = Post::query()
        ->when($request->status, fn($q, $v) => $q->where('status', $v))
        ->when($request->category_id, fn($q, $v) => $q->where('category_id', $v))
        ->when($request->search, fn($q, $v) => $q->where('title', 'like', "%{$v}%"))
        ->orderBy('created_at', 'desc')
        ->orderBy('id', 'desc');

    if ($request->has('cursor')) {
        $posts = $query->cursorPaginate($perPage);
    } else {
        $posts = $query->paginate($perPage);
    }

    return PostResource::collection($posts);
}
```

### COUNT(*) with Filters
Complex filters make the count query slower:
```sql
-- Simple count
SELECT COUNT(*) FROM posts WHERE status = 'published';
-- Fast if status is indexed

-- Complex count
SELECT COUNT(*) FROM posts
WHERE status = 'published'
  AND category_id = 5
  AND created_at > '2026-01-01'
  AND title LIKE '%search%';
-- May require multiple index scans or full table scan
```

### Composite Index for Filter+Sort
```sql
-- If filters are always applied, include them in the pagination index
CREATE INDEX idx_posts_status_category_created
ON posts(status, category_id, created_at DESC, id DESC);

-- The cursor query then uses a filtered range scan:
SELECT * FROM posts
WHERE status = 'published'
  AND category_id = 5
  AND (created_at, id) < ('2026-06-01', 100)
ORDER BY status, category_id, created_at DESC, id DESC
LIMIT 16;
```

---

## Patterns

### Immutable Filter Session
Treat each filter combination as a unique session. The cursor is scoped to the session's filter set. If filters change, reset pagination:
```php
// Generate a hash of the current filters
$filterHash = md5(json_encode($request->only(['status', 'category_id', 'search'])));

// Include the hash in the response for client to echo back
"meta": {
    "next_cursor": "...",
    "filter_hash": "abc123def456"
}
```

### Filter-Aware Cursor Builder
```php
public function cursorWithFilters(Builder $query, array $filters, array $orderColumns, $perPage)
{
    foreach ($filters as $column => $value) {
        $query->where($column, $value);
    }

    foreach ($orderColumns as [$col, $dir]) {
        $query->orderBy($col, $dir);
    }

    return $query->cursorPaginate($perPage);
}
```

### Deferred Filter Validation
Validate filters before executing pagination. Invalid filter values should return 400 before any query runs:
```php
$validated = $request->validate([
    'status' => 'in:draft,published,archived',
    'category_id' => 'exists:categories,id',
    'search' => 'string|max:100',
    'page' => 'integer|min:1',
]);
```

### Fixed Filter + Dynamic Sort
Support sort options but restrict to a fixed set:
```php
$allowedSorts = ['created_at', 'title', 'updated_at'];
$sort = in_array($request->sort, $allowedSorts) ? $request->sort : 'created_at';
$direction = $request->direction === 'asc' ? 'asc' : 'desc';

$posts = Post::where($filters)
    ->orderBy($sort, $direction)
    ->orderBy('id', 'desc') // tiebreaker
    ->cursorPaginate($perPage);
```

---

## Architectural Decisions

### Pre-Filter Index Strategy
Create composite indexes that match the most common filter+sort combinations. Analyze query patterns to determine which filter columns are most frequently used together.

### Separate Filter from Pagination Concerns
Keep filter logic in query scopes or repository methods. The pagination layer should not need to understand individual filter semantics:
```php
$query = Post::query()
    ->applyFilters($request->filters())
    ->applySort($request->sort());
// Pagination is a separate concern
$posts = $query->cursorPaginate($perPage);
```

### Search (LIKE) + Pagination
Full-text search with `LIKE '%term%'` is incompatible with index usage. Use dedicated search engines (Meilisearch, Algolia, Elasticsearch) for search + pagination. For simple cases, use `WHERE title LIKE 'term%'` (prefix match) which can use an index.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Filters narrow dataset for smaller pages | Filter + pagination = complex index design | Index maintenance overhead |
| Pagination within filtered set is intuitive | Changing filters invalidates cursors | Clients must understand filter-session model |
| Composite indexes optimize filter+sort | Index column order is inflexible | Cannot support all filter combinations |
| Dedicated search engine handles complex search | Additional infrastructure complexity | Overhead for simple LIKE queries |

---

## Performance Considerations

### Composite Index Strategy for Filters
The optimal index for filtered pagination depends on filter selectivity:
- High-selectivity filter first: `WHERE user_id = ?` → index on (user_id, created_at, id)
- Low-selectivity filter last: `WHERE status = 'active'` → index on (created_at, id, status)

### Search Filter (LIKE) Performance
Avoid `LIKE '%term%'` in paginated queries. It forces a full table scan. Alternatives:
- Full-text index (`MATCH AGAINST` in MySQL, `to_tsvector` in PostgreSQL)
- Prefix search (`LIKE 'term%'` — uses index)
- External search engine (Meilisearch, Elasticsearch)

### Boolean Column Filters
Filtering by boolean columns (`WHERE is_published = true`) has low selectivity and rarely justifies inclusion in a composite index. They may be better left out of the pagination index.

---

## Production Considerations

### Filter Spam Protection
Prevent clients from applying many filters simultaneously. Limit the number of active filters per request (e.g., max 5).

### Monitoring Filter Cardinality
Track which filter combinations are most common. Use this data to guide composite index creation. Uncommon filter combinations with bad performance should be identified and optimized.

### Filter + Pagination Timeouts
Complex filter combinations may time out. Implement query timeouts per endpoint:
```php
DB::statement('SET statement_timeout = 10000'); // 10 seconds
```

---

## Common Mistakes

### Not Indexing Filter Columns
Why it happens: Developers index the sort columns but forget the filter columns. Why it's harmful: Filtering on unindexed columns forces a full table scan before pagination can begin. Better approach: Include equality-filter columns as the leading columns in your pagination composite index.

### Changing Filters Mid-Pagination
Why it happens: Clients apply new filters while holding a cursor from a previous filter set. Why it's harmful: The cursor position is meaningless in the new filter context — results are incorrect or empty. Better approach: Reset pagination when filters change; include a filter session identifier.

### Applying Filters After Pagination
Why it happens: Developers fetch paginated results then filter them in application code. Why it's harmful: The page is incomplete (fewer results than the limit requested). Better approach: Apply all filters in the database query before pagination.

---

## Failure Modes

### Inconsistent Filter+Cursor State
A client applies filter A, gets cursor X, then applies filter B with cursor X. The cursor query returns results that don't match filter B, or an empty set. Mitigate by resetting cursor on filter changes.

### Slow COUNT(*) with Complex Filters
Multiple equality/range filters on unindexed columns make the count query extremely slow. Use `simplePaginate()` or approximate counts.

### Search + Cursor Incompatibility
Full-text search results are scored, and the sort order is by relevance score. Cursor pagination on scored results is unreliable because scores change as new data is indexed. Use offset pagination for search results.

---

## Ecosystem Usage

### GitHub API
GitHub supports combined filters and pagination. Filter parameters are specified alongside pagination parameters. Changing filters resets the page to 1.

### Stripe API
Stripe supports `created` (date filter) and cursor pagination simultaneously. The cursor is scoped to the filter combination.

### Laravel
No special handling for filter+cursor interaction. Developers must manually ensure filter parameters are preserved in pagination links and that cursor+filter combinations are consistent.

---

## Related Knowledge Units

### Prerequisites
- Offset Pagination Design — Basic pagination mechanics
- Cursor Pagination Design — Cursor mechanics
- Query Filtering and Searching — Filter parameter design

### Related Topics
- Multi-Column Cursor Pagination — Composite indexes for filter+sort
- Total Count Performance — Count with complex WHERE clauses
- SQL Indexing for Filtering — Index strategies for filtered queries

### Advanced Follow-up Topics
- Full-Text Search Integration — Search + pagination patterns
- GraphQL Pagination — HasNext/after patterns with filters

---

## Research Notes

### Source Analysis
- GitHub API docs: Filtering and pagination examples
- Stripe API: Pagination with list filters
- Laravel docs: Query scopes for filter organization

### Key Insight
The most common production pagination problem is not cursor vs offset — it's filter + pagination performance. A cursor that works perfectly for unfiltered queries becomes a full table scan when combined with a filter on an unindexed column. Always test pagination performance with the worst-case filter combination.

### Version-Specific Notes
- Laravel: No built-in filter+cursor integration
- Cursor scoping to filter session must be implemented manually
