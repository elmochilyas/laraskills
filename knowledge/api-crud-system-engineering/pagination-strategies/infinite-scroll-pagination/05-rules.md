# Infinite Scroll Pagination — Phase 5 Rules

## Always Use Cursor Pagination on the Backend
---
## Category
Reliability | Performance
---
## Rule
Always implement infinite scroll endpoints with cursor pagination; never use offset pagination.
---
## Reason
Offset pagination with concurrent writes causes phantom reads — new records shift page boundaries, producing duplicates (same record on two pages) or skipped records. Cursor pagination uses position-based WHERE clauses immune to this.
---
## Bad Example
```php
// Offset pagination — duplicates when new records are inserted
$posts = Post::paginate(15);
```
---
## Good Example
```php
// Cursor pagination — immune to phantom reads from concurrent inserts
$posts = Post::orderBy('created_at', 'desc')->orderBy('id', 'desc')->cursorPaginate(15);
```
---
## Exceptions
Append-only datasets with no concurrent writes (e.g., archived logs).
---
## Consequences Of Violation
Duplicate records in infinite scroll feeds; skipped records; confusing user experience.
---

## Deduplicate Items by ID on the Client
---
## Category
Reliability
---
## Rule
Implement client-side deduplication by record ID before appending new results to the existing list.
---
## Reason
Scroll position edge cases, race conditions, and cursor boundary timing can produce duplicate records even with cursor pagination. Deduplication is a cheap, effective safeguard.
---
## Bad Example
```javascript
// Appending directly — vulnerable to duplicate records
fetch(`/api/posts?cursor=${nextCursor}`)
    .then(res => res.json())
    .then(data => {
        posts.push(...data.data); // Duplicates possible
        renderPosts(posts);
    });
```
---
## Good Example
```javascript
// Deduplicate by ID before appending
fetch(`/api/posts?cursor=${nextCursor}`)
    .then(res => res.json())
    .then(data => {
        const existingIds = new Set(posts.map(p => p.id));
        const newItems = data.data.filter(p => !existingIds.has(p.id));
        posts.push(...newItems);
        renderPosts(posts);
    });
```
---
## Exceptions
When records are guaranteed unique by the application (e.g., append-only immutable event logs).
---
## Consequences Of Violation
Duplicate records visible to users; confusing UX; difficulty identifying actual vs duplicated content.
---

## Use IntersectionObserver Over Scroll Event Listeners
---
## Category
Performance
---
## Rule
Use `IntersectionObserver` for scroll detection, not scroll event listeners.
---
## Reason
Scroll events fire hundreds of times per second on scroll, wasting CPU cycles on the main thread. IntersectionObserver fires only when the observed element crosses the viewport boundary, using a fraction of the CPU.
---
## Bad Example
```javascript
// Scroll event listener — fires hundreds of times per scroll
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        fetchNextPage();
    }
});
```
---
## Good Example
```javascript
// IntersectionObserver — fires only at threshold boundary
const sentinel = document.getElementById('scroll-sentinel');
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore) {
        fetchNextPage();
    }
}, { rootMargin: '200px' });
observer.observe(sentinel);
```
---
## Exceptions
Legacy browser support requirements (IE11) where IntersectionObserver polyfill is unacceptable.
---
## Consequences Of Violation
CPU waste on scroll; janky scrolling; increased battery drain on mobile devices.
---

## Implement Pre-Fetch Thresholds
---
## Category
Performance | UX
---
## Rule
Pre-fetch the next page when the user scrolls within 2-3 viewport heights of the content bottom.
---
## Reason
Pre-fetching eliminates the loading delay when the user reaches the bottom of the content. Fetching when the user is already at the bottom introduces visible loading states and perceived latency.
---
## Bad Example
```javascript
// Loading at the very bottom — visible loading delay
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { // User already at bottom
        fetchNextPage(); // Loading state is now visible
    }
}, { rootMargin: '0px' });
```
---
## Good Example
```javascript
// Pre-fetch 600px before bottom — eliminates visible loading
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        fetchNextPage();
    }
}, { rootMargin: '600px' }); // ~2 viewport heights
```
---
## Exceptions
Bandwidth-constrained environments where pre-fetching wastes data on pages users may never see.
---
## Consequences Of Violation
Visible loading delays; increased perceived latency; user frustration.
---

## Detect and Terminate at has_more: false
---
## Category
Reliability
---
## Rule
Always check `has_more` or empty `data` array to terminate infinite scroll requests; set a client-side maximum page cap as a safety net.
---
## Reason
Without a termination check, a bug or edge case can cause infinite request loops, wasting server resources, client bandwidth, and degrading UX. A maximum cap (e.g., 500 requests) prevents runaway loops.
---
## Bad Example
```javascript
// No termination check — requests continue indefinitely
async function loadMore() {
    const data = await fetchPosts(cursor);
    posts.push(...data.data);
    cursor = data.meta.next_cursor;
    loadMore(); // Infinite loop if has_more is stuck true
}
```
---
## Good Example
```javascript
let pageCount = 0;
const MAX_PAGES = 500;

async function loadMore() {
    if (!hasMore || pageCount >= MAX_PAGES) return;
    const data = await fetchPosts(cursor);
    const newItems = data.data.filter(p => !existingIds.has(p.id));
    posts.push(...newItems);
    hasMore = data.meta.has_more;
    cursor = data.meta.next_cursor;
    pageCount++;
    if (hasMore) loadMore();
}
```
---
## Exceptions
No common exceptions — always implement termination logic.
---
## Consequences Of Violation
Infinite request loops; server DoS; client memory exhaustion; excessive API billing.
---

## Implement Scroll Position Preservation
---
## Category
UX | Reliability
---
## Rule
Adjust `window.scrollY` after new content loads above the current viewport to maintain the user's visual position.
---
## Reason
When new items are prepended or appended above the viewport, the existing content shifts downward, causing a jarring jump. Position preservation compensates for this offset.
---
## Bad Example
```javascript
// New content shifts viewport — user loses visual position
async function loadMore() {
    const prevHeight = document.body.scrollHeight;
    const data = await fetchPosts(cursor);
    prependPosts(data.data); // Content shifts downward
    // User's scroll position is now off by the new content height
}
```
---
## Good Example
```javascript
async function loadMore() {
    const prevHeight = document.body.scrollHeight;
    const data = await fetchPosts(cursor);
    prependPosts(data.data);
    const newHeight = document.body.scrollHeight;
    window.scrollBy(0, newHeight - prevHeight); // Compensate for shift
}
```
---
## Exceptions
When new content is only appended at the bottom (standard forward scroll) — no preservation needed.
---
## Consequences Of Violation
Jarring scroll jumps; user confusion; poor UX; users may abandon the page.
---

## Support Back/Forward Button Navigation
---
## Category
UX | Design
---
## Rule
Encode scroll position or cursor state in the URL hash or query string to support browser back/forward navigation.
---
## Reason
Users expect browser navigation to work with infinite scroll pages. Without URL state, pressing back returns to the previous page completely, losing all scroll position and loaded content.
---
## Bad Example
```javascript
// No URL state — back button loses all loaded content
async function loadMore() {
    const data = await fetchPosts(cursor);
    appendPosts(data.data);
    // URL never updates — history is lost
}
```
---
## Good Example
```javascript
async function loadMore() {
    const data = await fetchPosts(cursor);
    appendPosts(data.data);
    history.replaceState(null, '', `?cursor=${data.meta.next_cursor}`);
    // Back/forward restores cursor position
}

window.addEventListener('popstate', () => {
    const cursor = new URLSearchParams(location.search).get('cursor');
    if (cursor) restorePosition(cursor);
});
```
---
## Exceptions
Internal tools where browser navigation is not expected.
---
## Consequences Of Violation
Poor UX; user frustration; inability to bookmark or share positions within an infinite scroll feed.
---

## Show Skeleton Loading States During Fetches
---
## Category
UX
---
## Rule
Display skeleton or placeholder UI while the next page is being fetched, never a blank space or spinner-only.
---
## Reason
Skeleton states communicate that content is loading and reduce perceived latency by giving users a visual framework. Blank spaces or spinners make the interface feel unresponsive.
---
## Bad Example
```jsx
{loading && <Spinner />} // Non-informative — no content structure
```
---
## Good Example
```jsx
{loading && <PostSkeleton count={3} />}
// Shows placeholder cards matching actual post layout
```
---
## Exceptions
Very small page sizes (1-2 items) where the skeleton adds visual noise.
---
## Consequences Of Violation
Increased perceived latency; higher bounce rates; poor mobile experience.
---

## Provide Graceful Degradation for Non-JS Clients
---
## Category
Accessibility | Reliability
---
## Rule
Provide a `<noscript>` fallback with traditional page-based pagination links for clients without JavaScript.
---
## Reason
Infinite scroll depends on JavaScript for IntersectionObserver and fetch. SEO crawlers, accessibility tools, and users with JS disabled cannot navigate infinite scroll content without a fallback.
---
## Bad Example
```html
<!-- No fallback — non-JS users see only the first page -->
<div id="infinite-scroll-container"></div>
<script src="infinite-scroll.js"></script>
```
---
## Good Example
```html
<div id="infinite-scroll-container">
    <!-- Default page-based pagination for non-JS -->
    @foreach ($posts as $post)
        <div class="post">{{ $post->title }}</div>
    @endforeach
    {{ $posts->links() }}
</div>
<noscript>
    <div>Enable JavaScript for infinite scroll.</div>
    <div>{{ $paginatedPosts->links() }}</div>
</noscript>
```
---
## Exceptions
Internal tools where all users have JavaScript enabled.
---
## Consequences Of Violation
SEO crawlers cannot index paginated content; non-JS users cannot navigate beyond page 1; accessibility violations.
---

## Implement Request Throttling for Rapid Scrolling
---
## Category
Performance | Reliability
---
## Rule
Lock fetch requests to prevent multiple simultaneous requests from rapid scrolling, debouncing or ignoring subsequent triggers until the current fetch completes.
---
## Reason
Rapid scrolling past the pre-fetch threshold can trigger multiple simultaneous requests, causing duplicate pages, race conditions, and unnecessary server load.
---
## Bad Example
```javascript
// Multiple triggers from rapid scrolling — parallel requests
async function loadMore() {
    const data = await fetchPosts(cursor); // Multiple parallel calls
    appendPosts(data.data); // Duplicate or out-of-order results
}
```
---
## Good Example
```javascript
let isFetching = false;

async function loadMore() {
    if (isFetching || !hasMore) return;
    isFetching = true;
    try {
        const data = await fetchPosts(cursor);
        appendPosts(data.data);
        cursor = data.meta.next_cursor;
        hasMore = data.meta.has_more;
    } finally {
        isFetching = false;
    }
}
```
---
## Exceptions
No common exceptions — always implement request locking.
---
## Consequences Of Violation
Duplicate pages; race conditions; excessive server load; rate limit violations.
