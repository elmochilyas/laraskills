# Zero-Result Pagination

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Zero-Result Pagination
- **Last Updated:** 2026-06-02

---

## Executive Summary

Zero-result pagination occurs when a paginated request returns an empty `data` array. This happens in three scenarios: the dataset is truly empty (page 1, no results), the client requested a page beyond the last page (offset pagination), or all remaining records were deleted between requests (cursor pagination). Each scenario should be handled differently. Consistent empty-response semantics — returning an empty array rather than 404 or null — simplify client error handling and enable reliable infinite-scroll implementations.

---

## Core Concepts

### Three Types of Empty Pages
1. **Genuinely empty:** No records match the query at all
2. **Out-of-range page:** The requested page exceeds the last page (offset pagination only)
3. **Depleted cursor:** The cursor points past the last remaining record (cursor pagination)

### Expected Response
```json
{
    "data": [],
    "meta": {
        "current_page": 99,
        "per_page": 15,
        "from": null,
        "to": null,
        "total": 100,
        "last_page": 4
    },
    "links": {
        "first": "?page=1",
        "last": "?page=4",
        "prev": "?page=4",
        "next": null
    }
}
```

### Client Handling
```javascript
// Fetch next page
const response = await fetch(`/api/posts?page=${page}`);
const data = await response.json();

// Stop paginating when data is empty
if (data.data.length === 0) {
    hasMore = false;
    return;
}
```

---

## Mental Models

### The Empty Shelf Model
Zero-result pagination is like looking at an empty shelf in a warehouse. Either: (a) the warehouse has no products (genuinely empty), (b) you're looking at shelf #99 when the warehouse only has 4 shelves (out of range), or (c) the last product was just picked up by another customer (cursor depleted).

### The Queue Model
When you reach the front of an empty queue, it means either: the queue never had anyone (empty dataset), someone took the last person and you're past the end (invalid page), or the last person just left (cursor depletion).

### The Movie Theater Model
You walk into theater 99. It's empty. Three possibilities: the movie hasn't started (page 1 empty), the movie ended and everyone left (past last page), or the theater was never used (empty dataset).

---

## Internal Mechanics

### Laravel Behavior for Empty Pages
```php
// Empty dataset — page 1
$posts = Post::where('status', 'deleted')->paginate(15);
// data: [], total: 0, last_page: 1, current_page: 1

// Out of range — page 99 of 4
$posts = Post::paginate(15, ['*'], 'page', 99);
// data: [], total: 57, last_page: 4, current_page: 99
// Laravel returns empty data with correct metadata

// Cursor pagination depleted
$posts = Post::cursorPaginate(15);
// data: [], has_more: false, next_cursor: null
```

### 404 vs 200 for Empty Pages
- 200 with empty data — Correct for all paginated endpoints
- 404 — Wrong (the endpoint exists, the page just has no results)

```php
// INCORRECT
if ($posts->isEmpty()) {
    abort(404);
}

// CORRECT
if ($page > $paginator->lastPage()) {
    // Still return 200 with empty data, not 404
}
```

### Empty Page Response Construction
```php
if ($query->count() === 0) {
    return response()->json([
        'data' => [],
        'meta' => [
            'current_page' => 1,
            'per_page' => $perPage,
            'total' => 0,
            'last_page' => 1,
        ],
        'links' => [
            'first' => null,
            'last' => null,
            'prev' => null,
            'next' => null,
        ],
    ]);
}
```

---

## Patterns

### Consistent Empty Response Pattern
All paginated endpoints return the same structure for empty results:
```json
{
    "data": [],
    "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 0,
        "last_page": 1
    },
    "links": {
        "next": null,
        "prev": null
    }
}
```

### Cursor Empty Response Pattern
```json
{
    "data": [],
    "meta": {
        "has_more": false,
        "next_cursor": null
    }
}
```

### First Page with No Results
```javascript
// Initial load — no data yet
const initialLoad = await fetch('/api/posts');
// Should return 200 with empty data array
// Not 404, not null
```

### UI Empty State Handling
```vue
<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="posts.length === 0">No posts found</div>
  <div v-else>
    <Post v-for="post in posts" :key="post.id" :post="post" />
    <button v-if="hasMore" @click="loadMore">Load more</button>
  </div>
</template>
```

---

## Architectural Decisions

### Empty Data Should Always Be []
Return `data: []` (empty array), never `data: null` or `data: {}`. Clients iterate over `data` — an empty array is safe to iterate; null or object causes errors.

### Never Return 404 for Empty Pages
A paginated endpoint should never return 404 for an out-of-range page. The resource collection exists; the page within it is empty. 404 means the resource itself doesn't exist.

### Distinguishing Empty States in Meta
If clients need to distinguish "genuinely empty" from "past last page," include a `meta.reason` field:
```json
{
    "data": [],
    "meta": {
        "reason": "no_results",
        "total": 0
    }
}
```
```json
{
    "data": [],
    "meta": {
        "reason": "page_exceeds_total",
        "total": 57,
        "last_page": 4,
        "current_page": 99
    }
}
```

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Consistent empty array simplifies clients | Cannot distinguish empty vs out-of-range | Add meta.reason if distinction matters |
| 200 with empty data is REST-correct | Some APIs incorrectly return 404 | Educate team on correct status codes |
| Empty cursor results are deterministic | Clients must still handle empty array gracefully | Robust client pagination loops |

---

## Performance Considerations

### Empty Result Query Cost
An empty result still requires a database query. For offset pagination, this includes the `COUNT(*)` query. For cursor pagination, it includes the data query. Empty results are not free — the query executes but returns zero rows.

### First-Request Empty Optimization
If the first request (page 1) returns empty and the dataset is known to have no records, avoid subsequent pagination attempts. Clients should cache the "empty" state.

### Pre-Emptive Empty Check
For expensive queries, check existence first:
```php
if (! Post::exists()) {
    return $this->emptyResponse();
}
```

---

## Production Considerations

### Edge Case: Large Offset Empty Page
A client requesting page 999999 on an offset-paginated endpoint with 50 total records returns empty data but the `OFFSET` query still scans and discards rows. Mitigate by validating page numbers.

### Logging Excessive Empty Page Requests
Monitor clients that repeatedly request out-of-range pages. This may indicate:
- A client bug in pagination logic
- A scraper enumerating pages
- A stale total count

### Documentation of Empty Behavior
Document that all paginated endpoints return 200 with `data: []` on empty results. Clients should use `data.length === 0` to detect end of pagination.

---

## Common Mistakes

### Returning 404 for Empty Pages
Why it happens: Developers treat "no results" as "not found." Why it's harmful: Clients cannot distinguish between "endpoint doesn't exist" and "this page is empty." Infinite scroll loops stop at the wrong condition. Better approach: Always return 200 with empty data array.

### Returning null Instead of Empty Array for data
Why it happens: `null` semantically means "no data." Why it's harmful: Clients using `data.map()` or `data.forEach()` throw errors on null. Better approach: Always return `[]` for the data key when there are no results.

### Not Handling Empty Cursor Responses
Why it happens: Developers assume cursor pagination always returns at least some data while records exist. Why it's harmful: When all remaining records are deleted between requests, the cursor returns empty. If the client doesn't check `has_more === false`, it keeps requesting. Better approach: Always check `has_more` or detect empty `data` array to terminate pagination.

---

## Failure Modes

### Infinite Pagination Loop
A client that doesn't detect empty pages or `has_more = false` requests pages indefinitely, exhausting rate limits and wasting server resources.

### Stale Total Count Leads to Empty Pages
A cached total of 1000 records leads a client to request page 100, but the actual count is now 990. Page 100 is empty. The client sees an empty page 100 after navigating from page 99.

### Cursor Depletion Mid-Query
Between the cursor query and the response, the last matching record is deleted. The cursor becomes a dangling pointer. The next request with this cursor returns empty.

---

## Ecosystem Usage

### Laravel
Laravel's `paginate()`, `simplePaginate()`, and `cursorPaginate()` all return empty `data: []` when there are no results. The response status remains 200.

### Stripe API
Stripe returns `data: []` with `has_more: false` when pagination is exhausted. Never returns 404.

### GitHub API
GitHub returns an empty JSON array `[]` for the last page. Link headers omit the `next` rel. Status is 200.

---

## Related Knowledge Units

### Prerequisites
- Offset Pagination Design — Page-based empty handling
- Cursor Pagination Design — Cursor-based empty handling

### Related Topics
- API Error Handling — Distinguishing empty from error responses
- Per-Page Parameter Design — Page validation and empty page prevention

### Advanced Follow-up Topics
- Client-Side Pagination State Management — Handling empty states in frontend
- API Response Consistency — Unified response structure

---

## Research Notes

### Source Analysis
- JSON:API specification: Empty data arrays
- Laravel docs: Paginator response format
- Stripe API: Empty list responses

### Key Insight
The most important principle for zero-result pagination is consistency. Whether the dataset has 0 records or the client is past the last page, the response format should be identical. Clients should not need to parse error codes or status codes — they should simply check `data.length === 0`.

### Version-Specific Notes
- Laravel: Empty paginator behavior consistent across all versions
- `$paginator->isEmpty()` is available for checking empty state
