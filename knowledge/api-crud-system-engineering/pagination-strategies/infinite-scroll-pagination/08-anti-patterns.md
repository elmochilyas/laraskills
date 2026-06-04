# Anti-Patterns — Infinite Scroll Pagination

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Infinite Scroll Pagination |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Replacing All Pagination With Infinite Scroll | High | Medium | UI review: no alternative navigation for all pages |
| Using Scroll Event Listeners Instead of IntersectionObserver | High | High | Code review: `scroll` event listener attached to window |
| Removing Footer and Scroll-to-Top | Medium | High | UI review: no way to reach footer or return to top |
| Loading All Pages on Initial Load | Critical | Low | Code review: no pagination — loads entire dataset upfront |
| Not Handling Browser Back Button | High | Medium | UI review: browser back button loses scroll position |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Using Offset Pagination for Infinite Scroll | Duplicate records when new data inserted | Users see the same item multiple times |
| Not Deduplicating Items on Client | Scroll position edge cases cause duplicates | Occasional duplicate items in the feed |
| No Empty/Cursor-Depleted State Handling | Not checking `has_more` | Client requests pages forever in infinite loop |

---

## Anti-Pattern Details

### AP-ISP-01: Replacing All Pagination With Infinite Scroll

**Description**: Infinite scroll is applied to every list view in the application — admin panels, search results, data tables, and user management screens. Users who need to find a specific record from three weeks ago must scroll through hundreds of items. Users who need to reference the footer (site navigation, legal links) can never reach it. Infinite scroll is a UX pattern for content consumption, not data navigation.

**Root Cause**: Trend-chasing. The developer implements infinite scroll because it looks modern, without considering whether it fits the use case.

**Impact**:
- Admin users cannot directly access page 50 of user logs
- Footer content (navigation, legal, support) is never visible
- Memory bloat from thousands of DOM nodes
- Users cannot bookmark or share a specific page/position

**Detection**:
- UI review: infinite scroll used for admin panels, data tables, or search results
- Code review: no alternative pagination (page numbers, prev/next) for any list view
- User feedback: "I can't find the record I'm looking for"

**Solution**:
- Use infinite scroll only for content consumption (feeds, streams, galleries)
- Use traditional pagination for admin panels, data tables, and search results
- Provide a fallback "load more" button or page-number navigation for non-feed lists

**Example**:
```php
// Decision matrix for pagination type:
public function paginate(Request $request, Builder $query): LengthAwarePaginator|CursorPaginator
{
    return match ($this->uiPattern) {
        'infinite_scroll' => $query->cursorPaginate(15),
        'load_more' => $query->simplePaginate(15),
        'page_numbers' => $query->paginate(15),
    };
}

// Usage:
// PostsController (feed) → infinite_scroll
// AdminUsersController (admin) → page_numbers
// SearchController (results) → load_more
```

---

### AP-ISP-02: Using Scroll Event Listeners Instead of IntersectionObserver

**Description**: The frontend attaches a `scroll` event listener to the window and calculates whether the user has scrolled near the bottom by comparing `scrollTop`, `clientHeight`, and `scrollHeight`. Scroll events fire dozens to hundreds of times per second, causing continuous JavaScript execution, triggering React/Vue re-renders, and wasting CPU. The scroll handler also fights with smooth scrolling behavior.

**Root Cause**: Legacy approach. The developer learned scroll-based infinite scroll before IntersectionObserver was widely supported.

**Impact**:
- CPU usage spikes during scrolling, causing jank on mobile devices
- Multiple concurrent fetch requests when scroll handler fires rapidly
- Battery drain on mobile devices
- Complicated scroll position math that breaks across browsers

**Detection**:
- Code review: `window.addEventListener('scroll', ...)` in the infinite scroll implementation
- Code review: manual `scrollTop + clientHeight >= scrollHeight - threshold` calculations
- Performance profiling: scroll event handler consuming >10ms per frame

**Solution**:
- Use `IntersectionObserver` with a sentinel element at the bottom of the list
- Configure `rootMargin` to trigger pre-fetch before the user reaches the bottom
- Throttle/debounce as a second line of defense, not the primary mechanism

**Example**:
```javascript
// BEFORE: Scroll event listener
window.addEventListener('scroll', () => {
    const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 200) { // ❌ fires hundreds of times/sec
        fetchNextPage();
    }
});

// AFTER: IntersectionObserver
const sentinel = document.getElementById('scroll-sentinel');
const observer = new IntersectionObserver(
    (entries) => {
        if (entries[0].isIntersecting) {
            fetchNextPage();
        }
    },
    { rootMargin: '200px' } // ✅ pre-fetch when within 200px
);
observer.observe(sentinel);
```

---

### AP-ISP-03: Removing Footer and Scroll-to-Top

**Description**: Infinite scroll pages remove the footer (because users can never scroll past the content to reach it) and provide no "scroll to top" button. Users who scroll through 50 pages of content have no way to quickly return to the top. Footer navigation (About, Contact, Privacy Policy, Terms of Service) is inaccessible, often violating legal requirements for link visibility.

**Root Cause**: Poor UX design. The developer focuses on the infinite scroll experience and forgets about navigation exits.

**Impact**:
- Legal links (privacy policy, terms of service) are inaccessible without manual scrolling
- Users must scroll back through hundreds of items to reach the top
- No quick navigation: users cannot jump to a specific section
- Accessibility violation: keyboard users cannot navigate past endless content

**Detection**:
- UI review: no "back to top" button after scrolling several pages
- UI review: footer elements are never visible or not rendered
- User feedback: "how do I get back to the top?"

**Solution**:
- Add a floating "scroll to top" button that appears after scrolling past one viewport height
- Duplicate critical footer links in a fixed or sticky header
- Use a fetch limit (e.g., 50 pages max) after which infinite scroll stops and a "load earlier" button appears

**Example**:
```javascript
// Show scroll-to-top button after 1 viewport
window.addEventListener('scroll', () => {
    const btn = document.getElementById('scroll-to-top');
    btn.style.display = window.scrollY > window.innerHeight ? 'block' : 'none';
});

// Duplicate footer links in header
// <header><a href="/privacy">Privacy</a><a href="/terms">Terms</a></header>
```

---

### AP-ISP-04: Loading All Pages on Initial Load

**Description**: The API endpoint returns all records at once with no pagination, and the frontend implements a fake infinite scroll by progressively revealing DOM elements as the user scrolls. This defeats the purpose of pagination — the API still loads, serializes, and transfers the entire dataset on the first request. The "infinite scroll" is a visual illusion that doesn't reduce server load or bandwidth.

**Root Cause**: Misunderstanding infinite scroll. The developer implements the client-side infinite scroll UI without server-side pagination.

**Impact**:
- Initial API response includes 10,000 records — slow download and parsing
- Memory bloat: all records loaded into JS memory even if only 15 are visible
- No server-side benefits: same database load as returning all records
- Bandwidth waste: mobile users download the entire dataset

**Detection**:
- Code review: API endpoint returns all records without `paginate()`, `cursorPaginate()`, or `limit`
- Code review: frontend receives an array of 1000+ items and renders them progressively
- Network tab: single API response of 5MB+ for an "infinite scroll" feed

**Solution**:
- Always paginate on the server: `cursorPaginate(15)` for real infinite scroll
- Frontend fetches one page at a time via the `next_cursor`
- Initial load fetches only the first page (15 items)

**Example**:
```javascript
// BEFORE: Fake infinite scroll with all data
const response = await fetch('/api/posts'); // ❌ returns ALL posts
const allPosts = await response.json();
// Frontend reveals items progressively — but all data was transferred

// AFTER: True infinite scroll with pagination
const [posts, setPosts] = useState([]);
const [cursor, setCursor] = useState(null);
const [hasMore, setHasMore] = useState(true);

const fetchNextPage = async () => {
    if (!hasMore) return;
    const url = cursor ? `/api/posts?cursor=${cursor}` : '/api/posts';
    const response = await fetch(url);
    const data = await response.json();
    setPosts(prev => [...prev, ...data.data]);
    setCursor(data.meta.next_cursor);
    setHasMore(data.meta.has_more);
};
```

---

### AP-ISP-05: Not Handling Browser Back Button

**Description**: As the user scrolls through infinite content, new pages are appended to the DOM and the URL doesn't update. When the user navigates to a different page and presses the browser's back button, they return to the initial state (page 1, no content loaded), losing all scrolled-through content. The user must scroll through hundreds of items again to return to their previous position.

**Root Cause**: URL state management oversight. The developer treats infinite scroll as a single-page interaction.

**Impact**:
- Users lose scroll position when navigating away and back
- Cannot bookmark a specific position in the feed
- Frequent navigation users must re-scroll through all content
- Poor experience for users who switch between tabs

**Detection**:
- UI review: URL doesn't update as user scrolls through infinite content
- UX testing: pressing back button resets to initial state
- Code review: no URL hash or query parameter updates during scroll

**Solution**:
- Update the URL hash or query parameter with the current page count or last cursor
- Use the History API to push/update state as new pages load
- Restore scroll position and loaded pages from URL state on back navigation

**Example**:
```javascript
// Update URL state as new pages load
const fetchNextPage = async () => {
    const data = await fetchPage(cursor);
    const pageCount = Math.floor(loadedItems / perPage);

    // Update URL without triggering navigation
    window.history.replaceState(
        { page: pageCount, cursor: data.meta.next_cursor },
        '',
        `?page=${pageCount}`
    );

    setPosts(prev => [...prev, ...data.data]);
};

// Restore on back/forward navigation
window.addEventListener('popstate', (event) => {
    if (event.state?.page) {
        restoreScrollPosition(event.state.page);
    }
});
```
