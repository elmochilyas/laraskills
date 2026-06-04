# Pagination Strategy Selection

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Pagination Strategy Selection
- **Last Updated:** 2026-06-02

---

## Executive Summary

Choosing the right pagination strategy — offset, cursor, or keyset — depends on dataset characteristics, access patterns, consistency requirements, and client capabilities. No single strategy is optimal for all scenarios. A decision matrix considering write concurrency, total dataset size, random access requirements, and performance budgets guides the selection. Many production APIs use a hybrid approach: offset pagination for shallow pages with total count, cursor pagination for deep pages and real-time feeds.

---

## Core Concepts

### Strategy Overview

| Strategy | Random Access | Consistency | Deep Performance | Implementation Complexity |
|---|---|---|---|---|
| Offset | Yes | No (phantom reads) | Poor (O(N)) | Low |
| Cursor | No | Yes (consistent) | Excellent (O(1)) | Medium |
| Keyset | No | Yes (consistent) | Excellent (O(1)) | Medium-High |

### Decision Factors
1. **Dataset size** — Is it bounded or unbounded?
2. **Write concurrency** — Are records inserted/deleted frequently?
3. **Random page access** — Do users need to jump to page 42?
4. **Total count requirement** — Does the UI need a total count or page selector?
5. **Real-time consistency** — Must pagination be immune to phantom reads?
6. **Client capability** — Can clients handle opaque tokens or multi-parameter keysets?
7. **Security requirements** — Must sort column values be hidden from clients?

---

## Mental Models

### The Toolbox Model
Offset pagination is a hammer — simple, familiar, works for most small jobs. Cursor pagination is a screwdriver — more precise, better for specific jobs. Keyset pagination is a wrench — specialized but excellent when it fits. Choosing the right tool depends on the job, not personal preference.

### The Traffic Pattern Model
Offset pagination works for low-traffic intersections with stable traffic. Cursor pagination works for highways with merging traffic (new records joining). Keyset pagination works for express lanes where you just need to get from A to B efficiently.

### The Scaling Spectrum
As a dataset grows from 100 to 100M rows, the optimal strategy shifts:
- 100–1K: Offset (simple, fast enough)
- 1K–100K: Either offset or cursor depending on consistency needs
- 100K+: Cursor or keyset (offset becomes too slow)

---

## Internal Mechanics

### Decision Flowchart
```
Is the total dataset always small (< 5000)?
  ├── Yes → Offset pagination (simple, random access)
  └── No →
       Is random page access required?
        ├── Yes → Offset pagination with maximum page limit
        └── No →
             Is write concurrency high (real-time data)?
              ├── Yes → Cursor pagination (phantom-read immunity)
              └── No →
                   Are sort column values safe to expose?
                    ├── Yes → Keyset pagination (transparent, performant)
                    └── No → Cursor pagination (opaque token)
```

### Hybrid Strategy Pattern
```php
public function paginate(Request $request)
{
    $useCursor = $request->has('cursor');
    $useOffset = !$useCursor && $request->has('page');

    if ($useCursor) {
        return Post::cursorPaginate($request->per_page);
    }

    $page = (int) $request->page;
    if ($page > 100) {
        // Auto-switch to cursor pagination for deep pages
        return Post::cursorPaginate($request->per_page);
    }

    return Post::paginate($request->per_page);
}
```

### Per-Endpoint Strategy Configuration
```php
class PostController extends Controller
{
    public function index(Request $request)
    {
        return match(config('pagination.posts.strategy')) {
            'cursor' => PostResource::collection(
                Post::cursorPaginate()
            ),
            'keyset' => $this->keysetPaginate($request),
            default => PostResource::collection(
                Post::paginate()
            ),
        };
    }
}
```

---

## Patterns

### Resource-Based Strategy Selection
Define pagination strategy per resource based on its characteristics:
- Posts feed → Cursor (real-time, insert-heavy)
- Users list → Offset (admin, small, needs total)
- Audit logs → Cursor (append-only, large, no random access)
- Products catalog → Offset with total (pagination UI, moderate size)

### Graceful Degradation Pattern
```php
// Start with offset, degrade to cursor when deep
$perPage = $request->input('per_page', 15);
$page = $request->input('page', 1);

if ($page * $perPage > config('pagination.max_offset_total', 5000)) {
    return $this->cursorFallback($request);
}
return $this->offsetResponse($request);
```

### API Version Strategy
- v1: Offset pagination (default, simple)
- v2: Cursor pagination (default), offset as opt-in
- Transition: Both strategies available, clients choose via parameter

---

## Architectural Decisions

### When to Choose Offset
- Total dataset is small (< 5000 records)
- UI requires page-number navigation (page 1, 2, 3...)
- Writing concurrency is low or non-existent
- Simple implementation is valued over peak performance
- The dataset is append-only (inserts at end)

### When to Choose Cursor
- Dataset is large and grows unbounded
- Real-time consistency is required (feeds, activity streams)
- Opaque tokens are desired for security
- Random page access is not needed
- Clients are modern and can handle cursor tokens

### When to Choose Keyset
- Same conditions as cursor, plus:
- Sort column values are already exposed in responses
- Maximum transparency needed (debugging, logging)
- Clients need to bookmark and resume from specific positions

### When to Use Hybrid
- Different resources have different characteristics
- Migration in progress from offset to cursor
- Clients include both mobile apps (cursor-friendly) and web (offset-friendly)

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Offset: simple, random access | Deep page performance degrades | Limit page depth or switch strategies |
| Cursor: consistent, fast at any depth | No random page access | Clients cannot skip pages |
| Keyset: fast, transparent, debuggable | Exposes sort column values | May reveal internal ordering |
| Hybrid: best of all strategies | Multiple implementations to maintain | Increased code complexity and testing burden |

---

## Performance Considerations

### Strategy Performance by Dataset Size

| Dataset Size | Offset | Cursor | Keyset |
|---|---|---|---|
| 1K rows | 2–5ms | 2–5ms | 2–5ms |
| 100K rows | 5–200ms (page dependent) | 2–5ms | 2–5ms |
| 10M rows | 5ms–30s (page dependent) | 2–10ms | 2–10ms |
| 1B rows | Often times out | 5–20ms | 5–20ms |

### Maintenance Overhead
- Offset: Lowest (Laravel built-in, no extra indexes typically needed)
- Cursor: Low (one-time index creation, auto-encoding)
- Keyset: Medium (manual WHERE clause, multiple parameters)

---

## Production Considerations

### Strategy Documentation
Document the pagination strategy for each endpoint in your API reference. Clients need to know which parameters to send and what response format to expect.

### Monitoring Per-Endpoint
Track pagination strategy usage per endpoint. If offset-paginated endpoints show high average page numbers, consider migrating them to cursor pagination.

### Client Communication
When changing pagination strategy, communicate clearly:
- Deprecate old parameters with sunset headers
- Support both strategies during migration
- Announce the change in changelog

### Fallback Strategy
Always have a fallback. If cursor pagination fails (e.g., missing index), fall back to offset with a warning log.

---

## Common Mistakes

### Using Offset Pagination for Infinite Scroll
Why it happens: Offset is the easiest to implement in Laravel. Why it's harmful: Users scrolling deep (page 500+) cause DB stress. Phantom reads cause duplicate/skipped items in the feed. Better approach: Use cursor pagination for infinite scroll.

### Assuming Offset Works for All Sizes
Why it happens: Offset works fine during development with 100 records. Why it's harmful: In production with 10M records, deep pages cause timeouts. Better approach: Stress-test with realistic data volumes before deciding.

### Implementing Multiple Strategies Inconsistently
Why it happens: Different developers implement different strategies on different endpoints. Why it's harmful: Clients must learn different pagination patterns for different resources. Better approach: Standardize on one primary strategy and document exceptions.

---

## Failure Modes

### Strategy Mismatch
The chosen strategy doesn't fit the data pattern. Example: Offset pagination on a rapidly growing table with deep page access. Records are duplicated across pages, and page 1000 times out.

### Migration Failures
Switching from offset to cursor breaks clients that relied on `total` count or `last_page`. Mitigate by supporting both strategies during a transition period.

### Over-Engineering
Using cursor pagination for a 200-row admin panel adds unnecessary complexity. The O(1) performance benefit is irrelevant at that scale.

---

## Ecosystem Usage

### Laravel
Laravel supports all three strategies: `paginate()` (offset), `simplePaginate()` (offset without count), and `cursorPaginate()`. `forPageAfterId()` provides keyset-like behavior for primary key pagination.

### Stripe
Stripe uses cursor pagination (`starting_after`/`ending_before`) as its primary strategy. No `total` count is provided. Stripe also allows `limit` parameter.

### GitHub
GitHub uses offset pagination (`page`/`per_page`) with Link headers for most endpoints. Uses `since` parameter (keyset/cursor) for event streams.

---

## Related Knowledge Units

### Prerequisites
- Offset Pagination Design — Baseline understanding
- Cursor Pagination Design — Alternative strategy
- Keyset Pagination Design — Alternative strategy

### Related Topics
- Total Count Performance — When to include total metadata
- Pagination Link Headers — Standardized navigation links
- Per-Page Parameter Design — Limit/per_page defaults and maximums

### Advanced Follow-up Topics
- Offset-to-Cursor Migration — Practical migration guide
- Multi-Column Cursor Pagination — Advanced cursor design

---

## Research Notes

### Source Analysis
- GitHub API documentation: Lists pagination strategies per endpoint
- Stripe API reference: Cursor-based pagination design
- Laravel documentation: Comparison of paginator types
- JSON:API specification: Pagination extension options

### Key Insight
The most common pagination mistake is using offset pagination by default without considering the dataset's growth trajectory. Start with cursor pagination for any endpoint where the dataset is unbounded (feeds, logs, events). Reserve offset for bounded datasets where random page access is a real UX requirement.

### Version-Specific Notes
- Laravel 9+: All three paginators available natively
- Laravel 11: No changes to pagination strategy support
- `cursorPaginate()` is the recommended default for new Laravel applications
