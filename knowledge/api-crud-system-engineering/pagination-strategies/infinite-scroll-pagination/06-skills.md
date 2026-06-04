# Skill: Implement Infinite Scroll Pagination with Cursor-Based API
## Purpose
Build an infinite scroll UX that loads more content as the user scrolls, using cursor-based API pagination for stable insertion order and seamless background loading.
## When To Use
Social feeds (posts, comments); activity streams; notification lists; any UI that loads content progressively as the user scrolls.
## When NOT To Use
Pagination with page numbers (use offset pagination); search results where users need "jump to page 5"; small lists loaded client-side in full.
## Prerequisites
Cursor Pagination Design; API endpoint for paginated list; frontend scroll detection (Intersection Observer).
## Inputs
Scrollable container element; API base URL with pagination parameters; loading indicator component.
## Workflow
1. On initial load, fetch first page without cursor parameter
2. Store `next_cursor` from the API response
3. Set up Intersection Observer on a sentinel element at the list bottom
4. When sentinel enters viewport and `next_cursor` is not null, trigger next fetch
5. Append new items to the existing list (not replace)
6. Show loading indicator while fetching
7. Handle errors gracefully — show retry option, don't lose existing items
8. When `next_cursor` is null, stop observing (end of list)
9. Implement scroll-position restoration for browser back navigation
## Validation Checklist
- [ ] First page loads without cursor
- [ ] Subsequent pages pass `cursor` parameter from previous response
- [ ] Intersection Observer triggers fetch — not scroll event (debounced)
- [ ] New items are appended, not replacing the list
- [ ] Loading indicator is shown per-page (not full-screen)
- [ ] Error state preserves existing items and shows retry
- [ ] Sentinel element is removed when `next_cursor` is null
- [ ] Scroll position is restored correctly on browser back
- [ ] Rapid scrolling does not trigger duplicate fetches (loading lock)
## Common Failures
- Using scroll event listener (fires too often) instead of Intersection Observer
- No loading-lock — duplicate requests pile up during slow connections
- Replacing items instead of appending — previous content disappears
- Not handling the `null` cursor — infinite requests to empty endpoint
- Losing scroll position on browser back navigation
## Decision Points
- Single fetch per sentinel trigger vs prefetch buffer (fetch before sentinel is visible)
- Replace vs append strategy for pull-to-refresh + infinite scroll combination
- Client-side cursor storage (memory) vs URL query parameter (shareable URL)
## Performance/Security Considerations
Infinite scroll can load excessive DOM nodes — virtualize long lists or set a max fetch limit. Security: validate cursor server-side; rate-limit paginated endpoints to prevent scraping.
## Related Rules/Skills
Cursor Pagination Design; Cursor Encoding Strategies; Pagination Parameter Validation; SPA State Management.
## Success Criteria
Content loads progressively on scroll; duplicate fetches are prevented; end-of-list is detected and stops fetching; errors don't destroy loaded content.
