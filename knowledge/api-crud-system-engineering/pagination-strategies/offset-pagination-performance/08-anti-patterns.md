# Anti-Patterns — Offset Pagination Performance

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Offset Pagination Performance |
| Difficulty | Intermediate |
| Category | Performance Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| No Maximum Offset Guard | Critical | Medium | Code review: no limit on page or offset value |
| Using paginate on Every Request for Large Tables | High | High | Code review: `paginate()` (with COUNT) on every request |
| Not Monitoring Offset Depth | Medium | High | Code review: no logging or monitoring of page depth |
| Assuming Small Datasets Stay Small | High | Medium | Code review: no growth projection for paginated data |
| Using Offset as the Only Strategy | High | High | Code review: no alternative pagination for deep pages |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Assuming Indexes Solve Deep Offset | Indexes don't reduce skipped row traversal | OFFSET remains O(N) even with indexes |
| Skipping COUNT(*) Cost Analysis | Only benchmarking the data query | Count doubles response time on large tables |
| Not Using Covering Indexes | Indexing only ORDER BY columns | Table lookups add overhead to each scanned row |

---

## Anti-Pattern Details

### AP-OPP-01: No Maximum Offset Guard

**Description**: The pagination endpoint accepts any `page` or `offset` value without an upper bound. A client can request `?page=9999999`, causing the database to scan and discard millions of rows. This is a trivial denial-of-service vector: a single request with a large offset can saturate database I/O for seconds or minutes.

**Root Cause**: Not considering abuse scenarios. The developer validates that `page` is an integer but doesn't cap its maximum value.

**Impact**:
- DoS via single request: `page=999999999` causes catastrophic database load
- Database CPU and I/O spike from scanning millions of discarded rows
- Other API requests experience latency due to resource contention
- Query timeouts for deep offsets on large tables

**Detection**:
- Code review: `'page' => ['integer', 'min:1']` without `'max:N'`
- Code review: `offset` or `page` used directly without capping
- Security testing: sending large offset values and observing database impact

**Solution**:
- Enforce a maximum page number or maximum offset value
- Return a clear error suggesting cursor pagination for deep access
- Clamp the page value instead of rejecting it (graceful degradation)

**Example**:
```php
// BEFORE: No max guard
'page' => ['integer', 'min:1'], // ❌ page=999999999 is accepted

// AFTER: With max guard
'page' => ['integer', 'min:1', 'max:10000'], // ✅ maximum enforced

// Or with clamping:
$page = min((int) $request->input('page', 1), 10000);
$offset = ($page - 1) * $perPage;

// Or clear error:
if ($page > 10000) {
    return response()->json([
        'error' => 'Page number exceeds maximum. Use cursor pagination for deep pages.',
    ], 400);
}
```

---

### AP-OPP-02: Using paginate on Every Request for Large Tables

**Description**: Every request to a paginated endpoint uses Laravel's `paginate()`, which executes both a `COUNT(*)` query and the data query. For tables with millions of rows, the `COUNT(*)` query can take 500ms-5s, dominating the response time. The count data may not even be displayed by the client, but it's computed on every request regardless.

**Root Cause**: Default behavior. The developer calls `paginate()` for every index endpoint without considering whether `simplePaginate()` or `cursorPaginate()` would suffice.

**Impact**:
- Response time doubled or more by unnecessary COUNT queries
- Database load from repetitive counts on large tables
- Client pays the COUNT cost even when not displaying total/page info
- COUNT query may time out on very large tables

**Detection**:
- Code review: `paginate()` used on tables with >100K rows
- Performance monitoring: COUNT query duration exceeds data query duration
- Client review: paginated response has `total` and `last_page` that the UI doesn't display

**Solution**:
- Use `simplePaginate()` when total count is not required by the UI
- Use `cursorPaginate()` when total count is not needed at all
- Cache the total count for infrequently-changing datasets

**Example**:
```php
// BEFORE: paginate() on every request
$posts = Post::where('status', 'published')
    ->paginate(15); // ❌ COUNT(*) for 1M rows on every request — slow

// AFTER: simplePaginate() when total not needed
$posts = Post::where('status', 'published')
    ->simplePaginate(15); // ✅ no COUNT(*) — fast

// OR: cursorPaginate() for real-time feeds
$posts = Post::where('status', 'published')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15); // ✅ no COUNT(*) — consistent O(1) performance
```

---

### AP-OPP-03: Not Monitoring Offset Depth

**Description**: The application has no monitoring or logging for pagination offset depth. As the dataset grows, users naturally paginate deeper into results (page 50, page 100, page 500). Without monitoring, the team doesn't know that average offset depth is increasing until the database starts timing out on deep-page queries. The performance degradation is gradual and unnoticed until it becomes critical.

**Root Cause**: No observability. The team monitors response times and error rates but doesn't track pagination usage patterns.

**Impact**:
- Silent performance degradation: response times creep up over months
- No early warning before deep-offset problems become critical
- Emergency response when users report slow pages at deep positions
- Cannot plan capacity or migration timeline

**Detection**:
- Code review: no logging of page number or offset in paginated requests
- Operations review: no dashboard showing average pagination depth
- Performance review: no trend analysis for pagination response times

**Solution**:
- Log `page` or `offset` parameters on paginated requests
- Create a dashboard showing average and P99 pagination depth over time
- Set an alert when average page depth exceeds a threshold (e.g., page > 100)

**Example**:
```php
// BEFORE: No offset monitoring
public function index(IndexPostsRequest $request): JsonResponse
{
    $posts = Post::paginate($request->validated('per_page', 15));
    return PostResource::collection($posts);
}

// AFTER: With depth monitoring
public function index(IndexPostsRequest $request): JsonResponse
{
    $page = $request->validated('page', 1);
    $perPage = $request->validated('per_page', 15);

    Log::debug('Pagination request', [
        'endpoint' => 'posts.index',
        'page' => $page,
        'offset' => ($page - 1) * $perPage,
    ]);

    $start = microtime(true);
    $posts = Post::paginate($perPage);
    $duration = (microtime(true) - $start) * 1000;

    if ($duration > 1000) {
        Log::warning('Slow pagination', [
            'endpoint' => 'posts.index',
            'page' => $page,
            'duration_ms' => $duration,
        ]);
    }

    return PostResource::collection($posts);
}
```

---

### AP-OPP-04: Assuming Small Datasets Stay Small

**Description**: The API uses offset pagination because the dataset currently has only 1,000 records and offset performs fine at that size. No growth projections, no maximum dataset size planning, and no migration path to cursor pagination are considered. Two years later, the dataset has 10M records, and the pagination endpoint is unusable for deep pages.

**Root Cause**: Short-sighted architecture. The developer optimizes for the present without considering future growth.

**Impact**:
- Architectural debt: pagination strategy must be changed under pressure
- Emergency migration: converting to cursor pagination with existing clients
- Performance cliff: the endpoint that worked for 2 years suddenly becomes unusable
- Client frustration: forced migration to new pagination parameters

**Detection**:
- Code review: no documentation or discussion of dataset growth projections
- Code review: offset pagination used without any growth-based reasoning
- Database review: table growing >10% month-over-month with offset pagination

**Solution**:
- Consider dataset growth trajectory when choosing pagination strategy
- Default to cursor pagination for any dataset expected to exceed 50K records
- Document the maximum dataset size for which offset pagination is acceptable
- Plan and schedule migration before the performance cliff is reached

**Example**:
```php
// BEFORE: No growth planning
// Using offset because "it's only 1000 records right now"
$posts = Post::paginate(15); // ❌ no consideration of future growth

// AFTER: Growth-aware strategy selection
public function paginatePosts(): CursorPaginator|LengthAwarePaginator
{
    $estimatedMax = match (config('pagination.posts.strategy')) {
        'cursor' => Post::orderBy('id', 'desc')->cursorPaginate(15),
        default => Post::paginate(15),
    };
}

// Config: config/pagination.php
return [
    'posts' => [
        // Strategy chosen based on growth projection:
        // Current: 10K, Projected 12mo: 500K → use cursor
        'strategy' => 'cursor',
    ],
];
```

---

### AP-OPP-05: Using Offset as the Only Strategy

**Description**: The entire API uses offset pagination exclusively, even for endpoints that would benefit from cursor pagination: real-time feeds, activity streams, infinite scroll pages, and large report exports. The one-size-fits-all approach means every endpoint suffers from offset's limitations (phantom reads, deep-offset degradation) without the benefits of cursor pagination where it would help.

**Root Cause**: Defaulting to `paginate()` without considering alternatives. The developer always uses the same pattern.

**Impact**:
- Real-time feeds have duplicate records (phantom reads)
- Infinite scroll UI causes deep-offset queries that degrade over time
- Report exports must use inefficient pagination instead of cursor-based iteration
- No endpoint benefits from cursor pagination's O(1) performance

**Detection**:
- Code review: every index endpoint uses `paginate()` or `simplePaginate()`
- Code review: no `cursorPaginate()` usage anywhere in the codebase
- Performance review: all paginated endpoints have similar degradation patterns

**Solution**:
- Evaluate each endpoint's pagination needs independently
- Use cursor pagination for feeds, streams, and large datasets
- Use offset pagination for admin panels that need random page access
- Document the strategy per endpoint

**Example**:
```php
// BEFORE: Only offset strategy
// PostsController: Post::paginate(15)
// ActivityLogController: ActivityLog::paginate(15)
// UsersController: User::paginate(15)
// All using offset — including the real-time feed and activity log

// AFTER: Per-endpoint strategy
// PostsController (content feed → cursor):
Post::orderBy('created_at', 'desc')->cursorPaginate(15);

// ActivityLogController (large unbounded dataset → cursor):
ActivityLog::orderBy('id', 'desc')->cursorPaginate(15);

// UsersController (admin panel, random access → offset):
User::paginate(15);

// ExportsController (large dataset → cursor iteration):
$cursor = null;
do {
    $chunk = Post::orderBy('id')->cursorPaginate(100, ['*'], 'cursor', $cursor);
    // process chunk
    $cursor = $chunk->nextCursor();
} while ($cursor);
```
