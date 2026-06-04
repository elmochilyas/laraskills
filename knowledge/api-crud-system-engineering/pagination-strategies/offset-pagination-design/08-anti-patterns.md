# Anti-Patterns — Offset Pagination Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Offset Pagination Design |
| Difficulty | Foundation |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Using Offset for Unbounded Datasets | Critical | High | Code review: offset pagination on table that grows unboundedly |
| Not Capping per_page | Critical | High | Code review: pagination without maximum limit |
| Mixing page/per_page and offset/limit | Medium | Medium | Code review: different parameter styles across endpoints |
| Running paginate on Views Without Checking Need | Medium | High | Code review: `paginate()` on all queries including non-paginated |
| Relying on total Being Perfectly Accurate | Medium | High | API review: `total` presented as exact to clients |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Maximum per_page / offset | Unlimited page size or offset | Resource exhaustion, OOM, slow queries |
| Not Validating page Number | Negative or zero pages | Database errors from invalid OFFSET |
| Returning 404 for Empty Pages | "No results" treated as 404 | Client can't distinguish missing endpoint from empty page |

---

## Anti-Pattern Details

### AP-OPD-01: Using Offset for Unbounded Datasets

**Description**: Offset pagination is used on datasets that grow without bound — user activity logs, notifications, event streams, or audit trails. As the dataset grows from 1K to 1M records, offset pagination performance degrades from 5ms to 5s. The API that worked fine at launch becomes unusable after six months, requiring an emergency migration to cursor pagination.

**Root Cause**: Short-term thinking. The developer implements offset pagination because it's the easiest option in Laravel, without considering the dataset's growth trajectory.

**Impact**:
- Performance degrades proportionally with dataset size
- Deep-page queries time out as data accumulates
- Emergency migration required under pressure when performance becomes unacceptable
- Clients must adapt to a new pagination strategy mid-lifecycle

**Detection**:
- Code review: `paginate()` on tables with no clear growth limit (logs, events, notifications)
- Code review: no maximum page depth guard
- Database review: tables growing 10%+ month-over-month with offset pagination

**Solution**:
- Use cursor pagination for unbounded datasets from day one
- If offset must be used, implement a maximum page depth (e.g., page <= 500)
- Monitor offset depth and plan migration when average page > 100

**Example**:
```php
// BEFORE: Offset on unbounded dataset
public function index(Request $request): JsonResponse
{
    $logs = ActivityLog::paginate(15); // ❌ will degrade as logs accumulate
    return ActivityLogResource::collection($logs);
}

// AFTER: Cursor for unbounded dataset
public function index(Request $request): JsonResponse
{
    $logs = ActivityLog::orderBy('id', 'desc')
        ->cursorPaginate(15); // ✅ O(1) at any depth
    return ActivityLogResource::collection($logs);
}
```

---

### AP-OPD-02: Not Capping per_page

**Description**: The pagination endpoint accepts `per_page` with no maximum limit. A client can request `?per_page=100000`, and the server attempts to return 100,000 records in a single response. This causes memory exhaustion on the server, slow database queries, large network transfers, and client-side parsing failures.

**Root Cause**: Trusting clients. The developer doesn't validate query parameters, assuming clients will request reasonable page sizes.

**Impact**:
- PHP memory exhaustion from large result sets
- Database query timeouts from fetching 100K+ rows
- Outbound bandwidth spikes from huge responses
- CDN/proxy rejects oversized responses

**Detection**:
- Code review: `'per_page' => ['integer']` without `'max:N'`
- Code review: `paginate($request->input('per_page', 15))` without `min()` or `max()` clamping
- Monitoring: response size outliers correlate with large per_page values

**Solution**:
- Always enforce a hard maximum on `per_page` (100 is typical)
- Use `min()` and `max()` clamping for graceful handling
- Validate or clamp the value in the FormRequest

**Example**:
```php
// BEFORE: No cap
$perPage = $request->input('per_page', 15); // ❌ no max — risk of OOM

// AFTER: Hard cap
$perPage = min(max((int) $request->input('per_page', 15), 1), 100); // ✅ clamped to 1-100

// Or via validation:
public function rules(): array
{
    return [
        'per_page' => ['integer', 'min:1', 'max:100'],
    ];
}
```

---

### AP-OPD-03: Mixing page/per_page and offset/limit

**Description**: Some endpoints use `page`/`per_page` naming while others use `offset`/`limit`. Clients must adapt to different parameter sets per endpoint. Internal developers must remember which naming convention each endpoint uses. API documentation becomes more complex.

**Root Cause**: No team convention. Different developers implement pagination differently on different endpoints.

**Impact**:
- Client code must handle two different parameter schemas
- New endpoints may choose a third convention
- API contract is inconsistent across resources
- Automation tools can't assume a single pagination format

**Detection**:
- API review: some endpoints document `page`/`per_page`, others `offset`/`limit`
- Code review: `paginate()` on some endpoints, manual `offset`/`limit` on others
- Client feedback: "why does this endpoint use different parameter names?"

**Solution**:
- Standardize on one naming convention across the entire API
- Use `page`/`per_page` (Laravel/JSON:API convention) for public APIs
- Use `offset`/`limit` for internal/gRPC APIs if preferred, but be consistent

**Example**:
```php
// BEFORE: Mixed conventions
// GET /api/posts?page=1&per_page=15
// GET /api/users?offset=0&limit=15
// GET /api/comments?start=0&count=15

// AFTER: Consistent convention (page/per_page)
// GET /api/posts?page=1&per_page=15
// GET /api/users?page=1&per_page=15
// GET /api/comments?page=1&per_page=15

// All endpoints use:
$posts = Post::paginate($request->validated('per_page', 15));
```

---

### AP-OPD-04: Running paginate on Views Without Checking Need

**Description**: The controller always calls `paginate()` on every index endpoint response, even when the dataset is trivially small (5-10 records). The `paginate()` method executes a `COUNT(*)` query unnecessarily. For small tables, this doubles the query count for no benefit — the UI that displays the data doesn't paginate at all.

**Root Cause**: Default pattern. `php artisan make:controller --resource` generates `paginate()`, and the developer never considers whether pagination is actually needed.

**Impact**:
- Unnecessary `COUNT(*)` query on every request to small endpoints
- Database query count doubled for endpoints returning < 1 page of data
- Response time increased by the COUNT query duration
- Misleading "total" count shown when all data fits on one page

**Detection**:
- Code review: `paginate()` used on endpoints returning configuration, settings, or small reference data
- Code review: no count of records to determine if pagination is needed
- Database monitoring: frequent COUNT queries on small lookup tables

**Solution**:
- Use `paginate()` only when the dataset may exceed one page
- For small datasets, use `get()` without pagination
- Consider `simplePaginate()` when COUNT is not needed

**Example**:
```php
// BEFORE: Always paginate
public function index(Request $request): JsonResponse
{
    $categories = Category::paginate(15); // ❌ probably < 50 categories — no need for pagination
    return CategoryResource::collection($categories);
}

// AFTER: Conditional pagination
public function index(Request $request): JsonResponse
{
    $categories = Category::all(); // ✅ small dataset — no pagination needed

    if ($categories->count() > 100) {
        // Only paginate if there's enough data to warrant it
        $categories = Category::paginate(15);
    }

    return CategoryResource::collection($categories);
}
```

---

### AP-OPD-05: Relying on total Being Perfectly Accurate

**Description**: The API presents the `total` field in pagination metadata as an exact, authoritative count. Clients use `total` for financial calculations, inventory management, or critical reporting. However, under concurrent writes, the `total` is a point-in-time estimate that can be stale immediately after the response is sent. New records inserted after the `COUNT(*)` but before the client's next request are not reflected.

**Root Cause**: Over-promising accuracy. The developer returns the count without documenting that it's a point-in-time snapshot.

**Impact**:
- Clients make business decisions based on stale counts
- Inventory counts, financial totals, or user counts are inaccurate under concurrent writes
- Audit discrepancies between API counts and actual database state
- Support tickets: "the total keeps changing"

**Detection**:
- API review: `total` documented as exact without concurrency caveat
- Client review: `total` used in financial calculations or UI counters
- Bug reports: "total before and after creating a record don't match"

**Solution**:
- Document that `total` is a point-in-time estimate, not a transactional count
- For critical counts, use database transactions to ensure consistency
- Consider caching the count with a TTL for less frequent updates
- For cursor pagination, omit `total` entirely

**Example**:
```php
// BEFORE: Presenting total as exact
return response()->json([
    'data' => $posts,
    'meta' => [
        'total' => Post::count(), // ❌ presented as exact but can be stale
    ],
]);

// AFTER: Documenting the estimate
return response()->json([
    'data' => $posts,
    'meta' => [
        'total' => Post::count(), // ✅ document total as approximate
        'total_note' => 'Point-in-time count; may not reflect concurrent mutations',
    ],
]);
```
