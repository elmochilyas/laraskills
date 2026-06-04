# Infinite Scroll Pagination

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Infinite Scroll Pagination
- **Last Updated:** 2026-06-02

---

## Executive Summary

Infinite scroll pagination is a client-driven pattern where new content loads automatically as the user scrolls down a page. The API backend typically uses cursor pagination to support this pattern, providing a `next_cursor` that the client uses to fetch subsequent pages. Key considerations include scroll position preservation, duplicate prevention, pre-fetching thresholds, and graceful degradation to page-based navigation for SEO and accessibility.

---

## Core Concepts

### The Infinite Scroll Pattern
1. Initial page load: Fetch first N items via API
2. User scrolls near the bottom
3. Client fetches next page using `next_cursor`
4. Append new items to existing list
5. Repeat until `has_more = false`

### Scroll Threshold
The client triggers the next fetch when the user scrolls within a certain distance from the bottom:
```javascript
const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    // Fetch more when 200px from bottom
    if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMore();
    }
};
```

### Cursor Continuation
Infinite scroll requires cursor (or keyset) pagination — offset pagination causes duplicates:
```javascript
// Correct: cursor-based
async function loadMore() {
    const res = await fetch(`/api/posts?cursor=${nextCursor}`);
    const data = await res.json();
    posts.push(...data.data);
    nextCursor = data.meta.next_cursor;
    hasMore = data.meta.has_more;
}
```

---

## Mental Models

### The Escalator Model
Infinite scroll is like riding an escalator. New content continuously appears as you move forward. You cannot go back easily (previous pages are not easily accessible). Getting off the escalator (scrolling back up) means the content above stays.

### The Feed Model
Like a social media feed that keeps loading as you scroll. The content is time-ordered, and new posts appear at the top. The scroll position continuously moves forward, and the feed appends older content below.

### The Pageless Browsing Model
Infinite scroll removes the concept of "pages." There is no page 1, page 2 — just a continuous stream. The cursor is the position marker; the server provides the next segment on demand.

---

## Internal Mechanics

### Frontend Infinite Scroll Implementation
```javascript
class InfiniteScroller {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.items = [];
        this.cursor = null;
        this.hasMore = true;
        this.loading = false;

        this.setupObserver();
    }

    setupObserver() {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && this.hasMore && !this.loading) {
                    this.loadMore();
                }
            },
            { rootMargin: '200px' }
        );

        // Observe a sentinel element at the bottom
        observer.observe(document.getElementById('scroll-sentinel'));
    }

    async loadMore() {
        this.loading = true;
        try {
            const params = new URLSearchParams({ limit: 20 });
            if (this.cursor) params.append('cursor', this.cursor);

            const res = await fetch(`${this.apiUrl}?${params}`);
            const data = await res.json();

            this.items.push(...data.data);
            this.cursor = data.meta.next_cursor;
            this.hasMore = data.meta.has_more;
            this.render();
        } finally {
            this.loading = false;
        }
    }
}
```

### Backend Cursor Pagination for Infinite Scroll
```php
public function index(Request $request)
{
    $perPage = min((int) $request->input('limit', 20), 50);

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
```

### Pre-Fetch Threshold
Fetch the next page before the user reaches the bottom to eliminate loading delays:
```javascript
// Fetch next page when 2 pages worth of content remain
const PREFETCH_THRESHOLD = 2;

// When user is 3 screens from bottom, prefetch next page
// When user is 2 screens from bottom, prefetch the page after that
```

---

## Patterns

### Reverse-Chronological Feed
```php
// Most common infinite scroll pattern: newest first
$posts = Post::orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(20);
```

### Append-Only Pattern (Client)
```javascript
// Always append, never replace
function appendItems(newItems) {
    // Deduplicate by ID
    const existingIds = new Set(this.items.map(i => i.id));
    const unique = newItems.filter(i => !existingIds.has(i.id));
    this.items.push(...unique);
}
```

### Scroll Position Preservation
```javascript
// Save scroll position before new items push content down
function preserveScroll() {
    const scrollPos = window.scrollY;
    const height = document.body.scrollHeight;

    // After new items load, adjust scroll to maintain visual position
    requestAnimationFrame(() => {
        window.scrollTo(0, scrollPos + (document.body.scrollHeight - height));
    });
}
```

### Graceful Degradation to Pagination
```javascript
// Fall back to pagination when JavaScript is disabled
// Use <noscript> or server-side detection
function getPaginationUrl(page) {
    return `/posts?page=${page}`;
}
```

---

## Architectural Decisions

### Cursor vs Offset for Infinite Scroll
Always use cursor pagination for infinite scroll. Offset pagination causes:
- Duplicate items on insert-heavy feeds
- Skipped items if records are deleted
- Performance degradation on deep scroll

### Page Size for Infinite Scroll
Smaller page sizes (10–15) provide faster initial load but more requests. Larger page sizes (20–50) reduce requests but increase per-response latency and payload size. The sweet spot depends on record size and network conditions.

### Pre-Fetch Strategy
Pre-fetch the next page when the user is within 2–3 scroll heights of the bottom. This eliminates loading delays while avoiding excessive pre-fetching.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Seamless browsing experience | No footer/scroll-to-top navigation | Add "Back to top" button |
| Natural mobile interaction | SEO challenges (content not on separate URLs) | Implement server-side rendering or pagination fallback |
| Lower cognitive load | Scroll position loss on browser back | Implement scroll restoration |
| Cursor pagination prevents duplicates | No total count for UX | Show "Loading..." instead of "Page 5 of 27" |

---

## Performance Considerations

### Memory Growth
Infinite scroll accumulates DOM nodes. After 100+ pages, the browser may slow down. Implement virtualization (react-virtualized, vue-virtual-scroller) to render only visible items.

### Network Request Throttling
Debounce scroll events to avoid firing multiple simultaneous fetch requests:
```javascript
let isFetching = false;

async function handleScroll() {
    if (isFetching) return;
    if (!shouldLoadMore()) return;

    isFetching = true;
    await loadMore();
    isFetching = false;
}
```

### Image Loading
Lazy-load images below the fold to avoid loading all images for all pages at once. Use `loading="lazy"` attribute or IntersectionObserver.

---

## Production Considerations

### Rate Limiting for Infinite Scroll
Rapid scrolling can trigger many requests in quick succession. Ensure rate limiting accounts for burst behavior. Consider a short cooldown between pages.

### Skeleton Loading States
Show skeleton placeholders while the next page loads to indicate activity:
```html
<div class="skeleton" v-for="n in 5">Loading...</div>
```

### Empty State at End
When all content is loaded (`has_more = false`), show an "end of content" indicator to prevent confusion:
```html
<div v-if="!hasMore && items.length > 0" class="end-of-content">
    You've reached the end
</div>
```

---

## Common Mistakes

### Using Offset Pagination for Infinite Scroll
Why it happens: Offset is the default in Laravel. Why it's harmful: New records inserted at the top cause duplicates — the same record appears on two pages. Better approach: Always use cursor pagination for infinite scroll.

### Not Deduplicating Items on the Client
Why it happens: Developers assume every page has unique items. Why it's harmful: Scroll position or timing edge cases cause duplicate items to appear. Better approach: Deduplicate by ID on the client before appending to the list.

### No Back/Forward Button Support
Why it happens: Infinite scroll is treated as a single-page interaction. Why it's harmful: Users cannot bookmark or share a specific position in the feed. Better approach: Use URL hash or query parameters to encode scroll position/pagination state.

---

## Failure Modes

### Infinite Request Loop
If `has_more` is always `true` (server bug) or never checked, the client requests pages forever. Mitigate: Client-side maximum page limit (e.g., max 500 requests).

### Memory Exhaustion
After scrolling through 10000 items, the browser tab consumes gigabytes of memory. Mitigate: Virtual scrolling or periodic cleanup of off-screen DOM nodes.

### Stale Content on Resume
User scrolls down 50 pages, leaves the tab open for an hour, returns and scrolls. The old cursor points to records that may be deleted. The next page returns empty, ending the scroll prematurely. Mitigate: Refresh the initial data on tab focus.

---

## Ecosystem Usage

### Twitter/X
Twitter uses cursor-based pagination for timeline feeds. The `cursor` parameter is a large opaque string. New tweets appear at the top; scrolling loads older tweets below.

### Reddit
Reddit uses `after` (fullname ID) for cursor pagination. Infinite scroll loads more posts as the user scrolls down. Combined with `limit` parameter.

### Instagram
Instagram uses cursor pagination with `max_id` parameter. The response includes `more_available: boolean`. Posts are time-sorted; scrolling loads older posts.

### Laravel
`cursorPaginate()` is the recommended approach for infinite scroll backends. Frontend libraries (Alpine.js, Livewire, Vue, React) handle the scroll-to-fetch pattern.

---

## Related Knowledge Units

### Prerequisites
- Cursor Pagination Design — Backend mechanism for infinite scroll
- Zero-Result Pagination — Handling the end of content

### Related Topics
- Pagination Strategy Selection — Why cursor fits infinite scroll
- Frontend State Management — Client-side pagination state

### Advanced Follow-up Topics
- Virtual Scrolling — Rendering large lists efficiently
- Scroll Restoration — Maintaining position across navigation

---

## Research Notes

### Source Analysis
- Twitter API: Cursor-based timeline pagination
- Reddit API: `after`/`before` cursor pattern
- MDN: IntersectionObserver API for scroll detection

### Key Insight
Infinite scroll is a UX pattern, not a backend pattern. The backend simply provides cursor-based pagination. The infinite scroll logic is entirely client-side. The key backend requirement is cursor pagination — offset pagination breaks the user experience.

### Version-Specific Notes
- Laravel: `cursorPaginate()` available since 9.x
- IntersectionObserver: Available in all modern browsers
