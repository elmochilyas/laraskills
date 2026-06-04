# ECC Anti-Patterns — Search Result Pagination
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Search Result Pagination | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Manual Offset Calculation Instead of paginate()
2. No Caching for Popular Pages
3. Not Handling Page Depth Limits
4. Omitting Result Count Display
5. Using Pagination for Small Result Sets
---
## Repository-Wide Anti-Patterns
- Not distinguishing between engine pagination and database pagination
- Deep pagination without considering cursor-based alternatives
- Page parameter not included in search query cache key
---
## Anti-Pattern 1: Manual Offset Calculation Instead of paginate()
### Category
Maintainability | Reliability
### Description
Manually calculating `offset` and `limit` parameters instead of using Scout's built-in `paginate()` method, duplicating engine-specific pagination logic.
### Why It Happens
Developers are familiar with database offset pagination and apply the same pattern to search engines.
### Warning Signs
- Manual `offset` parameter calculated from page number
- Custom pagination logic handling engine-specific limits
- `take()` and `skip()` used instead of `paginate()`
- Pagination code differs between search engines
### Why Harmful
Manual pagination duplicates what Scout's `paginate()` handles automatically, including engine-specific pagination differences. It's more code to maintain and bug-prone.
### Consequences
- More code to maintain and debug
- Engine-specific pagination bugs
- Inconsistent pagination behavior across engines
- Time wasted reinventing Scout's built-in functionality
### Alternative
Use Scout's `paginate()` method which returns a standard `LengthAwarePaginator`.
### Refactoring Strategy
1. Replace manual offset/limit with `Model::search($query)->paginate($perPage)`
2. Remove custom pagination logic
3. Configure per-page count as parameter
4. Test pagination across pages
5. Verify total count matches engine results
### Detection Checklist
- [ ] paginate() used instead of manual offset
- [ ] Custom pagination logic removed
- [ ] Per-page configuration parameterized
- [ ] Pagination works across all search engines
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Skill: Scout Paginate
---
## Anti-Pattern 2: No Caching for Popular Pages
### Category
Performance | Cost
### Description
Not caching paginated search result pages, causing repeated identical queries to the search engine for the same page.
### Why It Happens
Developers don't include the page number in the search cache key or assume pagination queries are unique.
### Warning Signs
- Page 1 of popular searches executed thousands of times
- High search engine costs from page navigation
- No page parameter in search cache key
- Cache hit ratio low due to uncached pagination
### Why Harmful
Page 1 of popular searches is the most commonly viewed result. Without caching, every page view triggers a new search engine query. This multiplies search costs unnecessarily.
### Consequences
- Higher search engine query volume
- Increased latency for paginated results
- Wasted infrastructure capacity
- Search engine costs driven by page navigation, not search variety
### Alternative
Cache paginated results with page number in the cache key.
### Refactoring Strategy
1. Include page number in search cache key
2. Cache popular first pages with longer TTL
3. Invalidate cache when data changes (tag-based)
4. Monitor cache hit ratio for paginated results
5. Consider pre-warming cache for top search pages
### Detection Checklist
- [ ] Page number included in cache key
- [ ] Popular pages cached
- [ ] Cache invalidation triggers on data change
- [ ] Cache hit ratio monitored for paginated results
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Not Handling Page Depth Limits
### Category
Reliability | User Experience
### Description
Allowing users to navigate to page numbers beyond the search engine's maximum page limit (e.g., Algolia max 1000), showing empty or error results.
### Why It Happens
Developers don't check search engine limitations on maximum page depth and allow unrestricted page navigation.
### Warning Signs
- Pagination UI shows page numbers beyond engine limit
- Users get empty results when navigating past max page
- "An error occurred" on deep page navigation
- No indication of why results are empty on deep pages
### Why Harmful
Users who navigate past the engine's maximum page depth see empty results or errors with no explanation. They don't know why results stopped appearing.
### Consequences
- Frustrated users who can't browse deep results
- Error pages for valid-looking URLs
- SEO issues with out-of-range pagination URLs
- Support tickets about "missing" search results
### Alternative
Limit pagination UI to the engine's maximum page depth. Show a message when results exceed the max.
### Refactoring Strategy
1. Check search engine maximum page depth (Algolia: 1000, others vary)
2. Cap pagination navigation at engine limit
3. Show message: "Showing first 1000 of N results"
4. Suggest refining search for more specific results
5. Consider cursor-based pagination for deep browsing
### Detection Checklist
- [ ] Page depth limits known and configured
- [ ] Pagination UI capped at engine limit
- [ ] Message shown when results exceed max depth
- [ ] Refinement suggestion offered for deep pagination
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Omitting Result Count Display
### Category
User Experience | Information Design
### Description
Not showing the total number of search results or current page position, leaving users without context about result set size.
### Why It Happens
Developers focus on result display and don't include count metadata.
### Warning Signs
- No "X of Y results" displayed
- Users cannot tell if there are more pages
- No "Page X of Y" indicator
- Pagination controls without context
### Why Harmful
Without result counts, users don't know the scope of available results. They can't gauge whether refinement is needed or if they've seen everything relevant.
### Consequences
- Users uncertain about result set size
- No awareness of total available results
- Reduced trust in search completeness
- Poor information scent for browsing
### Alternative
Always display total result count and current page position.
### Refactoring Strategy
1. Access `$results->total()` from LengthAwarePaginator
2. Display "Showing X-Y of Z results" above results
3. Display "Page X of Y" in pagination area
4. Format numbers for readability (1,234)
5. Update display dynamically for AJAX pagination
### Detection Checklist
- [ ] Total result count displayed
- [ ] Current page position shown
- [ ] "Page X of Y" indicator visible
- [ ] Count formatted for readability
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Using Pagination for Small Result Sets
### Category
User Experience | Performance
### Description
Showing pagination controls when search returns fewer results than a single page, cluttering the UI unnecessarily.
### Why It Happens
Pagination is always shown regardless of result count. Developers use the same template for all result sets.
### Warning Signs
- Pagination shown for 3 results
- Single-page results show "Page 1 of 1"
- Users see pagination UI but cannot use it
- Extra UI elements for no benefit
### Why Harmful
Pagination UI for single-page results wastes screen space and creates visual noise. It adds no value and may confuse users who try to click non-functional controls.
### Consequences
- Cluttered search results UI
- Confusing single-page pagination controls
- Wasted vertical space on mobile screens
- Reduced content-to-chrome ratio
### Alternative
Hide pagination when results fit in a single page. Only show pagination when total results exceed the page size.
### Refactoring Strategy
1. Check `$results->hasMorePages()` or `$results->lastPage() > 1`
2. Conditionally render pagination only when needed
3. Show "X results" count without pagination for small sets
4. Test: 5 results shown, no pagination
5. Test: 25 results shown, pagination visible
### Detection Checklist
- [ ] Pagination hidden when results fit one page
- [ ] Single-page results show count only
- [ ] Multi-page results show pagination controls
- [ ] Mobile pagination optimized for small result sets
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
