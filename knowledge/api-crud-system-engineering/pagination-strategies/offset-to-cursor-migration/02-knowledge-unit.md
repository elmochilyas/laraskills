# Offset-to-Cursor Migration

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Offset-to-Cursor Migration
- **Last Updated:** 2026-06-02

---

## Executive Summary

Migrating an API from offset pagination to cursor pagination is a breaking change that requires careful planning. Clients relying on `total`, `last_page`, and random page access will break. The migration strategy involves: (1) supporting both pagination methods simultaneously during a transition period, (2) adding cursor parameters while deprecating offset parameters, (3) communicating the change through documentation and sunset headers, and (4) eventually removing offset support after the deprecation window.

---

## Core Concepts

### Breaking Changes
Offset-to-cursor migration breaks:
- `total` and `last_page` — No longer available
- Random page access — Cannot jump to page N
- `page` parameter — Replaced by `cursor` parameter
- Client pagination logic — Must be rewritten

### Coexistence Period
Both pagination methods are supported simultaneously:
```
GET /api/posts?page=2&per_page=15   # Offset (legacy)
GET /api/posts?cursor=abc&limit=15  # Cursor (new)
```

### Deprecation Headers
```http
GET /api/posts?page=2
---
200 OK
Deprecation: true
Sunset: Sat, 01 Jun 2027 00:00:00 GMT
Link: <https://docs.example.com/pagination-migration>; rel="deprecation"
```

---

## Mental Models

### The Bridge Construction Model
Offset-to-cursor migration is like building a new bridge next to the old one. Traffic (clients) can use either bridge during construction. When the new bridge is complete, the old bridge is closed and demolished.

### The Currency Changeover Model
Like a country switching currencies. Both old and new currencies are accepted during a transition period. After the deadline, only the new currency is valid. ATMs (API responses) clearly indicate which currency they dispense.

### The Dual-Language Dictionary Model
Each endpoint "speaks" both offset and cursor. Clients choose which language to use. The response is in the same language as the request. Old clients continue using offset; new clients adopt cursor.

---

## Internal Mechanics

### Dual-Pagination Controller
```php
public function index(Request $request)
{
    $useCursor = $request->has('cursor') || !$request->has('page');
    $perPage = min((int) $request->input('per_page', 15), 100);

    if ($useCursor) {
        return $this->cursorResponse($request, $perPage);
    }

    return $this->legacyOffsetResponse($request, $perPage);
}

private function cursorResponse(Request $request, int $perPage)
{
    $posts = Post::orderBy('created_at', 'desc')
        ->orderBy('id', 'desc')
        ->cursorPaginate($perPage);

    return response()->json([
        'data' => PostResource::collection($posts->items()),
        'meta' => [
            'next_cursor' => $posts->nextCursor()?->encoded,
            'has_more' => $posts->hasMorePages(),
        ],
    ]);
}

private function legacyOffsetResponse(Request $request, int $perPage)
{
    $posts = Post::paginate($perPage);

    return PostResource::collection($posts)
        ->additional([
            'deprecation' => 'Offset pagination is deprecated. Use cursor pagination instead.',
            'sunset' => '2027-06-01',
        ]);
}
```

### Response Versioning via Content-Type
```php
// v1: offset pagination
return PostResource::collection($posts)
    ->withHeaders(['Content-Type' => 'application/vnd.api+json; version=1']);

// v2: cursor pagination
return response()->json([...])
    ->withHeaders(['Content-Type' => 'application/vnd.api+json; version=2']);
```

### Feature Flag for Migration
```php
// .env
PAGINATION_MIGRATION_PERCENTAGE=10

// Controller
if ($this->shouldUseCursorForRequest($request)) {
    return $this->cursorResponse($request, $perPage);
}

private function shouldUseCursorForRequest(Request $request): bool
{
    // Gradual rollout: % of requests use cursor
    $rolloutPercent = config('pagination.migration_percent', 0);
    if ($rolloutPercent >= 100) return true;
    if ($rolloutPercent <= 0) return false;

    return (crc32($request->user()?->id ?? $request->ip()) % 100) < $rolloutPercent;
}
```

---

## Patterns

### Dual Parameter Acceptance
Accept both `page` and `cursor` parameters. If both are provided, `cursor` takes priority:
```php
$useCursor = $request->has('cursor') || !$request->has('page');
```

### Consistent Response Normalization
Normalize both responses to the same structure where possible:
```php
// Offset response
"meta": { "current_page": 1, "per_page": 15, "total": 100, "last_page": 7 }

// Cursor response (normalized)
"meta": { "per_page": 15, "next_cursor": "...", "has_more": true }
// "total" and "last_page" are absent — clients must handle
```

### Sunset Header Strategy
```php
return response($data)
    ->header('Deprecation', 'true')
    ->header('Sunset', 'Sat, 01 Jun 2027 00:00:00 GMT')
    ->header('Link', '<https://docs.example.com/pagination-migration>; rel="deprecation"');
```

### Migration Documentation Endpoint
```php
Route::get('/api/pagination-migration-guide', function () {
    return response()->json([
        'old' => ['page', 'per_page', 'total', 'last_page'],
        'new' => ['cursor', 'limit', 'next_cursor', 'has_more'],
        'migration_guide' => 'https://docs.example.com/pagination-migration',
        'sunset_date' => '2027-06-01',
    ]);
});
```

---

## Architectural Decisions

### Migration Strategy: Big Bang vs Gradual
**Big Bang:** Switch all clients at once on a specific date. Simple backend code but risky — any client not updated breaks.
**Gradual:** Support both during a deprecation window. More backend work but safer — clients migrate at their own pace.
**Recommendation:** Gradual migration with 6–12 month deprecation window.

### Backward-Compatible Total Estimation
If clients absolutely need a `total`-like value, consider providing an estimated count:
```php
// During migration, provide estimated total for cursor responses
"meta": {
    "next_cursor": "...",
    "has_more": true,
    "total_estimated": 15000  // Not exact, but helps clients
}
```

### Client Onboarding Material
Provide migration guides, code examples, and changelogs. Offer a sandbox endpoint where clients can test cursor pagination without affecting production.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Better performance and consistency | Breaking change for all clients | Must support both during migration |
| No phantom reads | No total count or random page access | Update all client-facing documentation |
| O(1) deep page performance | Clients must rewrite pagination logic | Provide migration guides and code samples |
| Future-proof for large datasets | Increased backend complexity | Dual-controller maintenance overhead |

---

## Performance Considerations

### Dual-Query Overhead During Migration
During the coexistence period, both query types run. There's no additional query cost — only one strategy executes per request. No significant performance impact.

### Monitoring Migration Progress
Track the ratio of `page` vs `cursor` requests:
```php
DB::listen(function ($query) {
    if ($query->time > 500) {
        Log::warning('Slow pagination query', [
            'type' => request()->has('cursor') ? 'cursor' : 'offset',
            'time' => $query->time,
        ]);
    }
});
```

### Index Readiness
Before enabling cursor pagination, ensure the required composite indexes exist. Cursor pagination without indexes is slower than offset pagination.

---

## Production Considerations

### Deprecation Communication Timeline
1. **Announce** deprecation 6 months before sunset
2. **Add** `Deprecation` header immediately
3. **Set** `Sunset` header to 6–12 months out
4. **Monitor** client migration progress
5. **Remove** offset support after sunset date

### Client Notification
Contact known API consumers directly. Send emails with migration guides. Publish changelogs and blog posts.

### Rollback Plan
Keep offset pagination code available but disabled. In case of critical cursor bugs, re-enable offset pagination with a configuration toggle.

---

## Common Mistakes

### Removing Offset Pagination Too Quickly
Why it happens: Developers want to clean up code. Why it's harmful: Clients that weren't updated break, causing production incidents. Better approach: Maintain a minimum 6-month deprecation window with clear sunset headers.

### Not Testing Cursor Pagination at Scale
Why it happens: Tests use small datasets. Why it's harmful: Cursor pagination performs poorly without proper indexes, and production datasets reveal this immediately. Better approach: Load-test cursor pagination with production-scale data before migration.

### Assuming All Clients Can Switch
Why it happens: All clients seem capable of handling cursors. Why it's harmful: Some clients (legacy integrations, partner APIs) may not be actively maintained and cannot be updated. Better approach: Offer a long-term support (LTS) endpoint with offset pagination for legacy clients.

---

## Failure Modes

### Missing Index Causes Production Degradation
Cursor pagination is deployed without the required composite index. Every cursor query does a full table scan. Response times increase from 50ms to 5s. Mitigate: Verify indexes exist before enabling cursor pagination.

### Client Ignores Deprecation Headers
A client ignores `Deprecation` and `Sunset` headers and continues using offset pagination. When offset support is removed, the client breaks. Mitigate: Monitor deprecated endpoint usage and proactively contact heavy users.

### Partial Migration of Shared Libraries
A company's shared API client library is updated for cursor pagination, but some services use an older version of the library. Those services break when offset support is removed. Mitigate: Library version pinning and coordinated upgrades.

---

## Ecosystem Usage

### GitHub API
GitHub maintains backward compatibility for extended periods. Pagination changes are announced via the developer blog and changelog. Sunset headers are used for breaking changes.

### Stripe API
Stripe introduces new API versions with pagination changes. Older versions remain available for years. Stripe communicates changes through versioned API documentation and migration guides.

### Laravel
No built-in offset-to-cursor migration path. The transition must be implemented manually. Laravel's support for both `paginate()` and `cursorPaginate()` makes the dual-controller pattern straightforward.

---

## Related Knowledge Units

### Prerequisites
- Offset Pagination Design — The strategy being migrated from
- Cursor Pagination Design — The strategy being migrated to
- Pagination Strategy Selection — Why the migration is needed

### Related Topics
- API Versioning Strategies — Versioning approaches for breaking changes
- Deprecation and Sunset Policies — Communication and timeline management

### Advanced Follow-up Topics
- Multi-Version API Maintenance — Maintaining multiple API versions
- Client SDK and Changelog Management — Supporting client migration

---

## Research Notes

### Source Analysis
- GitHub API changelog: Pagination migration examples
- Stripe API versioning: Versioned pagination changes
- Heroku API: Sunset header pattern for API deprecation

### Key Insight
Offset-to-cursor migration is primarily a client communication problem, not a technical problem. The technical implementation (dual-controller pattern) is straightforward. The hard part is identifying all clients, communicating the timeline, and ensuring they migrate before the sunset date.

### Version-Specific Notes
- Laravel: `paginate()` and `cursorPaginate()` coexist naturally
- No framework-level migration tooling available
