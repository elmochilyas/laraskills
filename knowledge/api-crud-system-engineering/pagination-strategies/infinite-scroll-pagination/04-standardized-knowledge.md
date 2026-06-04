| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Infinite Scroll Pagination |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | Cursor Pagination Design, Zero-Result Pagination |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Infinite scroll pagination is a client-driven pattern where new content loads automatically as the user scrolls down a page. The API backend must use cursor pagination to support this pattern reliably, providing a `next_cursor` that the client uses to fetch subsequent pages. Key considerations include scroll position preservation, duplicate prevention, pre-fetching thresholds, and graceful degradation to page-based navigation for SEO and accessibility.

## Core Concepts

- **Scroll Threshold**: The client triggers the next fetch when the user scrolls within a certain distance from the bottom (typically 200-500px or 2-3 viewport heights).
- **Cursor Continuation**: Infinite scroll requires cursor pagination — offset pagination causes duplicates when new records are inserted.
- **Pre-Fetch Threshold**: Fetch the next page before the user reaches the bottom to eliminate loading delays.
- **Deduplication**: Client-side deduplication by record ID prevents duplicates from scroll position edge cases or timing issues.
- **Scroll Position Preservation**: When new items load above the current viewport, the scroll position must be adjusted to maintain visual context.
- **Graceful Degradation**: Fall back to traditional pagination when JavaScript is disabled or for SEO crawlers.

## When To Use

- Social media feeds, activity streams, and notification lists.
- Mobile-first applications where swipe/scroll is the primary interaction.
- Content browsing where sequential consumption is natural (e.g., image galleries, article lists).
- Any scenario where pagination controls (page numbers) would interrupt the user experience.

## When NOT To Use

- When users need to access specific pages directly (bookmarking, sharing, deep linking).
- For data-heavy interfaces where users need to find specific records across pages.
- When SEO is critical and server-side rendering is not feasible.
- For admin panels and dashboards where users need to scan, search, and jump between pages.
- When footer content (site navigation, legal information) must always be visible.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Always use cursor pagination on the backend | Offset pagination causes duplicate/skipped records with concurrent writes |
| Deduplicate items by ID on the client | Scroll position edge cases and race conditions can produce duplicates |
| Pre-fetch when within 2-3 viewport heights of bottom | Eliminates loading delay without excessive pre-fetching |
| Show skeleton loading states | Users understand content is loading; reduces perceived latency |
| Detect and terminate at `has_more: false` | Prevents infinite request loops and wasted server resources |
| Implement scroll position preservation | Prevents jarring jumps when new content loads above the viewport |
| Support back/forward button with URL state | Users expect browser navigation to work with infinite scroll pages |

## Architecture Guidelines

- The backend simply provides cursor pagination — infinite scroll logic is entirely client-side.
- Implement IntersectionObserver for scroll detection rather than scroll event listeners (better performance).
- Throttle/debounce scroll-triggered fetch requests to prevent multiple simultaneous requests.
- Virtual scrolling (react-virtualized, vue-virtual-scroller) is necessary for lists exceeding ~1000 items to prevent DOM bloat.
- Provide a "Back to top" button since infinite scroll lacks traditional navigation.
- Implement a maximum page cap on the client (e.g., 500 requests) to prevent infinite loops from bugs.

## Performance Considerations

- Memory growth is the primary risk — after 100+ pages, the DOM can slow the browser significantly.
- Use virtual scrolling to render only visible items, keeping DOM nodes to a manageable count.
- Lazy-load images below the fold to avoid loading all images for all pages at once.
- Pre-fetching puts additional load on the API; tune the pre-fetch threshold to balance UX and server load.
- Request throttling (locking mechanism) prevents flood of requests from rapid scrolling.

## Security Considerations

- Rapid scrolling can trigger many requests in quick succession; ensure rate limiting accounts for burst behavior.
- The cursor token should be opaque and untamperable to prevent cursor manipulation.
- Implement server-side validation that the cursor belongs to the authenticated user's scope.
- Monitor for infinite scroll loops that could be used as a denial-of-service vector.
- Validate that the pre-fetch mechanism cannot be abused to exceed rate limits.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using offset pagination for infinite scroll | Offset is the default in Laravel | New records cause duplicates — same record appears on two pages | Always use cursor pagination |
| Not deduplicating items on the client | Assuming every page has unique items | Scroll position edge cases cause duplicate items | Deduplicate by ID before appending |
| No back/forward button support | Infinite scroll treated as single-page interaction | Users cannot bookmark or share a specific position | Encode scroll position in URL hash/query |
| Not handling empty/cursor-depleted state | Not checking `has_more` | Client requests pages forever in infinite loop | Always check `has_more` or detect empty data |

## Anti-Patterns

- **Replacing all pagination with infinite scroll**: Not suitable for admin panels, search results, or data-heavy tools.
- **Using scroll event listeners instead of IntersectionObserver**: Scroll events fire hundreds of times per second, wasting CPU.
- **Removing footer/scroll-to-top**: Users need exits from infinite scroll.
- **Loading all pages on initial load**: Defeats the purpose of pagination.
- **Not handling browser back button**: Users expect to return to their previous scroll position.

## Examples

- **IntersectionObserver scroll detection**: Observe a sentinel element with `rootMargin: '200px'` to trigger next page fetch.
- **Cursor continuation fetch**: `fetch('/api/posts?cursor=' + nextCursor)` — append results, update cursor.
- **Deduplication**: `const newItems = items.filter(i => !existingIds.has(i.id)); posts.push(...newItems);`
- **Scroll position preservation**: After new items load, adjust `window.scrollY` to maintain visual position.
- **Graceful degradation**: Use `<noscript>` with traditional `?page=N` links for non-JS clients.

## Related Topics

- Cursor Pagination Design — Backend mechanism required for infinite scroll
- Zero-Result Pagination — Handling the end of content and depleted cursors
- Pagination Strategy Selection — Why cursor fits infinite scroll
- Frontend State Management — Client-side pagination state and scroll position

## AI Agent Notes

- When implementing infinite scroll, always pair it with cursor pagination on the backend — never offset pagination.
- Include client-side deduplication logic; it's a cheap safeguard against race conditions.
- For SEO, provide a paginated fallback accessible via query parameters or <noscript>.
- Implement a client-side maximum page/request cap to prevent infinite loops from bugs.
- Test with rapid scrolling to ensure request throttling works correctly.

## Verification

- [ ] Backend uses cursor pagination (not offset) for the infinite scroll endpoint
- [ ] Client deduplicates items by ID before appending to the list
- [ ] IntersectionObserver (not scroll event listener) is used for scroll detection
- [ ] Pre-fetch threshold is configured and working
- [ ] Loading/skeleton states display while next page is fetching
- [ ] Empty state and "end of content" indicator display when `has_more: false`
- [ ] Scroll position is preserved when new content loads above the viewport
- [ ] Back/forward button navigation restores scroll position
- [ ] Rate limiting accommodates burst requests from rapid scrolling
- [ ] Graceful degradation to offset pagination works for non-JS clients
