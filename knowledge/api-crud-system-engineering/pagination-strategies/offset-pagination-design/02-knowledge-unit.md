# Offset Pagination Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Offset Pagination Design
- **Last Updated:** 2026-06-02

---

## Executive Summary

Offset pagination uses `offset` and `limit` query parameters to navigate a dataset. The client requests a specific page by calculating `offset = (page - 1) * limit`. It is the most widely recognized pagination strategy in REST APIs due to its simplicity and stateless request model. However, offset pagination suffers from well-known problems under concurrent writes and deep-offset performance degradation. Understanding its design surface — parameter naming, default values, maximum limits, and response structure — is essential before deciding whether to use it.

---

## Core Concepts

### Offset and Limit Parameters
- `limit` — Number of records to return (default: 10–20, max: 100–1000)
- `offset` — Number of records to skip (default: 0, no hard max but practical limits apply)
- Alternative: `page` + `per_page` — User-friendly shorthand where `offset = (page - 1) * per_page`

### Response Structure
```json
{
    "data": [ ... ],
    "meta": {
        "current_page": 1,
        "per_page": 15,
        "from": 1,
        "to": 15,
        "total": 100,
        "last_page": 7
    },
    "links": {
        "first": "?page=1",
        "last": "?page=7",
        "prev": null,
        "next": "?page=2"
    }
}
```

### SQL Mapping
```sql
SELECT * FROM users ORDER BY id ASC LIMIT 15 OFFSET 0;  -- page 1
SELECT * FROM users ORDER BY id ASC LIMIT 15 OFFSET 15; -- page 2
SELECT * FROM users ORDER BY id ASC LIMIT 15 OFFSET 30; -- page 3
```

---

## Mental Models

### The Book Analogy
`page` is the page number, `per_page` is the number of lines per page. Turning the page requests the next set of lines. You can jump directly to any page number, but page contents shift if the book's pages are renumbered (records inserted/deleted).

### The Elevator Model
Offset pagination is like an elevator that can go directly to any floor (page). But if people are constantly getting on and off (inserts/deletes), the floor numbers shift and you may end up in the wrong place.

### The Window-Slit Model
`LIMIT` and `OFFSET` define a fixed slit through which you view the dataset. As you slide the slit deeper, the database must count through and discard all previous rows, making deep pages progressively slower.

---

## Internal Mechanics

### Laravel `paginate()` Method
```php
// Controller
$users = User::paginate(15);
return UserResource::collection($users);

// Generated SQL
SELECT COUNT(*) AS aggregate FROM users;
SELECT * FROM users LIMIT 15 OFFSET 0;
```

`paginate()` executes two queries: a `COUNT(*)` for total records and the data query. The count query is the primary performance cost.

### Laravel `simplePaginate()` Method
```php
$users = User::simplePaginate(15);
```

Skips the `COUNT(*)` query, returns only `next`/`prev` links without `total` or `last_page`. Faster but loses navigation metadata.

### Request Parameters
```php
// /users?page=2&per_page=20
$users = User::paginate(request('per_page', 15));
// Laravel reads `page` from the query string automatically
```

### Manual Offset Implementation
```php
$limit = min(request('limit', 15), 100);
$offset = max(request('offset', 0), 0);

$users = User::orderBy('id')
    ->skip($offset)
    ->take($limit)
    ->get();

$total = User::count();
```

---

## Patterns

### Page-Based URL Pattern
```
GET /users?page=1&per_page=15
GET /users?page=2&per_page=15
GET /users?page=7&per_page=15
```

### Offset-Based URL Pattern
```
GET /users?offset=0&limit=15
GET /users?offset=15&limit=15
GET /users?offset=90&limit=15
```

### Consistent Parameter Naming
Adopt a single convention across all endpoints:
- `page`/`per_page` — User-friendly, matches Laravel defaults
- `offset`/`limit` — Database-idiomatic, preferred for internal APIs

### Default and Max Enforcement
```php
$perPage = min(
    max((int) request('per_page', 15), 1),
    100
);
```

### Response Wrapping with LengthAwarePaginator
```php
$paginator = new LengthAwarePaginator(
    $items, $total, $perPage, $page,
    ['path' => request()->url(), 'query' => request()->query()]
);
```

---

## Architectural Decisions

### `page`/`per_page` vs `offset`/`limit`
Use `page`/`per_page` for public-facing REST APIs where readability matters. Use `offset`/`limit` for internal/gRPC-like APIs where the caller directly controls the database offset. Laravel's `paginate()` uses `page`/`per_page` by default.

### Including Total Count vs Simple Pagination
Include `total` and `last_page` when clients need to render UI controls (total pages, page selectors). Use simple pagination for infinite scroll or "load more" patterns where only next/prev matter.

### Default Page Size
Default 15 is Laravel's convention. For list-heavy UIs, 20–25 is common. For mobile, 10–15 reduces payload. Consider making the default configurable per resource.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Simple to implement and understand | Deep offsets are slow (DB scans through skipped rows) | Use cursor/keyset pagination for large datasets |
| Supports random page access (jump to page N) | Concurrent inserts/deletes cause duplicate/skip records | Acceptable for stable, append-only datasets |
| Works with any SQL database | Requires `COUNT(*)` for total metadata | Avoid count on large tables; use simplePaginate |
| Built into Laravel, no extra libraries | Total count query can be expensive | Add approximate count or cache the total |

---

## Performance Considerations

### Deep Offset Problem
`LIMIT 15 OFFSET 10000` requires the database to scan 10015 rows and discard the first 10000. The query becomes slower as offset increases. Mitigations:
- Restrict maximum offset or page number
- Use keyset/cursor pagination beyond a threshold
- Ensure the `ORDER BY` column is indexed

### COUNT(*) Performance
`SELECT COUNT(*) FROM users` on large tables (millions of rows) can take seconds, especially with `WHERE` clauses. Mitigations:
- Use `simplePaginate()` to skip the count
- Use approximate counts (Pg `reltuples`, MySQL `EXPLAIN` estimate)
- Cache the total with TTL invalidation

### Index Utilization
Offset pagination queries use the `ORDER BY` index only for ordering, not for skipping. The index scan still reads and discards offset rows. Covering indexes help reduce row lookups for the data phase.

---

## Production Considerations

### Maximum Limit Enforcement
Always cap `per_page` to prevent abuse:
```php
$perPage = min((int) request('per_page', 15), 100);
```

Return 400 if the requested limit exceeds the maximum.

### Parameter Validation
```php
$request->validate([
    'page' => 'integer|min:1',
    'per_page' => 'integer|min:1|max:100',
]);
```

### Consistent Response Format
All paginated endpoints should return the same `meta`/`links` structure. Consider a pagination response trait or base class.

### Empty Pages
Return an empty `data` array (not `null` or 404) when the page exceeds `last_page`:
```json
{ "data": [], "meta": { "current_page": 99, "total": 50, "last_page": 4 } }
```

---

## Common Mistakes

### Allowing Unbounded `per_page`
Why it happens: No validation on the `per_page` parameter. Why it's harmful: A client requests 100000 records per page, causing out-of-memory errors or slow responses. Better approach: Enforce a hard upper limit (100 or 1000) and document it.

### Using Offset for Real-Time Feeds
Why it happens: Offset is the default pagination in Laravel. Why it's harmful: New records inserted before the current page cause clients to see duplicates. Better approach: Use cursor pagination for feeds and activity streams.

### Not Validating Page Number
Why it happens: Laravel's `paginate()` accepts any integer. Why it's harmful: Page 999999 triggers deep offset queries that degrade database performance. Better approach: Clamp page to `last_page` or return empty results for out-of-range pages.

---

## Failure Modes

### Phantom Reads (Duplicate/Skip Records)
When records are inserted or deleted between page requests, offset pagination produces inconsistent results. The same record may appear on two pages or be skipped entirely. This is inherent to offset-based navigation and cannot be fully prevented.

### Deep Offset Timeouts
Requests for page 100000 result in `OFFSET 1499985` with `LIMIT 15`. The query may time out, causing 500 errors. Mitigate with offset limits or automatic fallback to cursor pagination.

### Count Inconsistency
The `total` count reflects the state at the time of the `COUNT(*)` query. If records are inserted between the count and the data query, the metadata is stale. This is usually acceptable but can confuse clients.

---

## Ecosystem Usage

### Laravel
`Model::paginate()`, `Model::simplePaginate()`, `LengthAwarePaginator`, `Paginator` — all built in. Default `per_page` is 15, configurable via `paginate()` argument or `$perPage` property on the model.

### JSON:API Specification
Uses `page[number]` and `page[size]` for offset-based pagination. Recommends including `total` in `meta` and providing `first`, `last`, `prev`, `next` links.

### GitHub API
GitHub uses `page` and `per_page` parameters with Link headers for navigation. Default `per_page`: 30, max: 100.

---

## Related Knowledge Units

### Prerequisites
- REST API Design Fundamentals — Request parameters and response structure
- SQL Query Execution — `LIMIT`, `OFFSET`, and `COUNT(*)` mechanics

### Related Topics
- Cursor Pagination Design — Alternative strategy for real-time data
- Keyset Pagination Design — Alternative for deep offset scenarios
- Pagination Link Headers — `Link` header format for pagination

### Advanced Follow-up Topics
- Total Count Performance — Optimizing `COUNT(*)` on large tables
- Offset-to-Cursor Migration — Transitioning strategies without breaking clients

---

## Research Notes

### Source Analysis
- Laravel documentation: "Pagination" chapter covers all built-in methods
- JSON:API Pagination extension defines `page[number]`/`page[size]` convention
- PostgreSQL documentation: `LIMIT` and `OFFSET` behavior and performance characteristics

### Key Insight
Offset pagination's primary value is random page access (jump to page N). If your clients never need "jump to page 54 of 100," cursor pagination is almost always superior. The decision is UX-driven, not implementation-driven.

### Version-Specific Notes
- Laravel 11: `paginate()` behavior unchanged
- Laravel modifiers like `simplePaginate()` consistent across versions
- `cursorPaginate()` introduced in Laravel 9+ as a first-party alternative
