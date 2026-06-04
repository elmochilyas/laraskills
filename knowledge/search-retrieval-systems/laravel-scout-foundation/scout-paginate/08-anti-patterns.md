# ECC Anti-Patterns — Scout Paginate
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Scout Paginate | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Deep Pagination Performance Trap
2. Using paginate() When simplePaginate() Suffices
3. Mixing Search and Collection Pagination
4. Unbounded Pagination Parameters
5. Caching Only the First Page
---
## Repository-Wide Anti-Patterns
- Not understanding that each page triggers a new search engine API call
- Using paginate on every search without considering total count cost
- Not limiting maximum pagination depth
---
## Anti-Pattern 1: Deep Pagination Performance Trap
### Category
Performance
### Description
Allowing users to navigate deep into search results (page 500+) where the search engine must skip thousands of results, causing slow queries and potential engine errors.
### Why It Happens
Standard pagination UI shows page numbers 1,2,3...N. Users can click page 1000. Developers don't implement depth limits because they work on small test datasets.
### Warning Signs
- Search queries slow down dramatically after page 10
- Engine returns errors for page > 1000
- Pagination UI shows thousands of page links
- User reports timeout errors on deep search pages
### Why Harmful
Search engines compute and skip results for each page. Algolia caps at 1000 results. Meilisearch performance degrades with high offsets. Deep pagination wastes engine resources on results users will never view.
### Consequences
- Timeout errors for deep page requests
- Inconsistent results: engine may skip records at high offsets
- Poor user experience on paginated search
- High engine compute costs per query
### Alternative
Limit pagination depth to 100 pages or use cursor-based pagination (`simplePaginate()`) for infinite scroll patterns.
### Refactoring Strategy
1. Add maximum page limit validation in search requests
2. Use `simplePaginate()` for infinite scroll (no total count, no page jumping)
3. For traditional pagination: limit to 100 pages max
4. Remove page number from URL after max depth
5. Consider "Load more" pattern instead of deep page links
### Detection Checklist
- [ ] Pagination depth limited to 100 pages max
- [ ] Cursor-based pagination for large result sets
- [ ] No timeout errors on deep search pages
- [ ] UI prevents navigation beyond max pages
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
---
## Anti-Pattern 2: Using paginate() When simplePaginate() Suffices
### Category
Performance
### Description
Always using `paginate()` (which computes total count) instead of `simplePaginate()` (which doesn't) for search results where total count isn't needed.
### Why It Happens
`paginate()` is the default recommendation and works everywhere. Developers use it uniformly without evaluating whether the total count is necessary.
### Warning Signs
- Every search endpoint uses `paginate()` instead of `simplePaginate()`
- Search responses include `total` and `last_page` but frontend doesn't use them
- Infinite scroll UI uses `paginate()` unnecessarily
- API responses include pagination metadata that the client ignores
### Why Harmful
`paginate()` calls `getTotalCount()` on the search engine, which may require a separate counting query. On large indexes, this doubles the search time. On some engines, total count is expensive to compute.
### Consequences
- Search response times 2x slower than necessary
- Higher search engine query costs per request
- Unnecessary load on the search engine
### Alternative
Use `simplePaginate()` for any search UI that doesn't display total result count or page number links (infinite scroll, load more, search-as-you-type).
### Refactoring Strategy
1. Audit all search endpoints for pagination usage
2. Replace `paginate()` with `simplePaginate()` for:
   - Infinite scroll UIs
   - API endpoints where client doesn't need total count
   - Search-as-you-type suggestions
3. Keep `paginate()` only for traditional page-number navigation UIs
4. Compare response times before and after
### Detection Checklist
- [ ] simplePaginate() used where total count not needed
- [ ] API responses sized correctly for their use case
- [ ] Response time improved after switching to simplePaginate()
- [ ] Frontend receives appropriate pagination metadata
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
---
## Anti-Pattern 3: Mixing Search and Collection Pagination
### Category
Reliability
### Description
Applying Laravel's collection `->paginate()` on search results fetched with `->get()`, instead of using Scout's built-in `paginate()`, causing all results to be loaded into memory.
### Why It Happens
Developers treat Scout results like Eloquent collections. They call `->get()` then chain `->paginate()` from the collection macro, not realizing the difference.
### Warning Signs
- Code does `Model::search($q)->get()->paginate(15)`
- Memory usage spikes on search result pages
- Scout's `paginate()` is never used
- Search response includes all results in the network payload
### Why Harmful
`->get()` fetches ALL matching documents from the search engine. `->paginate()` on the collection then slices them in PHP. For large result sets (10K+), this wastes memory, bandwidth, and compute.
### Consequences
- High memory usage from loading all documents
- Slow responses due to large network transfers
- PHP memory limit exhaustion on large result sets
- Inefficient use of search engine
### Alternative
Use Scout's `Model::search($q)->paginate(15)` directly, which pushes pagination to the search engine level.
### Refactoring Strategy
1. Replace `Model::search($q)->get()->paginate(15)` with `Model::search($q)->paginate(15)`
2. Remove any collection pagination macros from search queries
3. Adjust frontend to handle Scout paginator format (same as Laravel LengthAwarePaginator)
4. Test pagination behavior across all pages
5. Monitor memory usage improvement
### Detection Checklist
- [ ] All search endpoints use Scout's paginate() method
- [ ] No collection pagination on search results
- [ ] Memory usage reduced on search result pages
- [ ] Pagination works correctly across all result pages
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Unbounded Pagination Parameters
### Category
Security | Performance
### Description
Accepting user-supplied `perPage` and `page` parameters without validation, allowing values that cause excessive engine load or application errors.
### Why It Happens
Laravel's paginator accepts arbitrary perPage values. Developers pass request parameters directly to `paginate()` without sanitization.
### Warning Signs
- `perPage` parameter accepts any value including 0, -1, or 100000
- No validation on search pagination request inputs
- Users can request 10,000 results per page
- Negative perPage values cause errors
### Why Harmful
Unvalidated perPage values can cause denial-of-service (requesting 100K results per page), memory exhaustion, or application errors from invalid values. Search engines may reject or bill extra for extremely large page sizes.
### Consequences
- Memory exhaustion from oversized page requests
- High search engine costs from large result sets
- Application errors from invalid pagination parameters
- Potential DoS vector through search endpoints
### Alternative
Validate and clamp pagination parameters: enforce minimum, maximum, and default perPage values.
### Refactoring Strategy
1. Add form request validation for search endpoints
2. Clamp perPage: `min(1)`, `max(100)`, `default(15)`
3. Clamp page: `min(1)`, `max(100)`
4. Add request validation rule: `'perPage' => 'integer|min:1|max:100'`
5. Use validated values in `paginate()` calls
### Detection Checklist
- [ ] perPage parameter validated and clamped
- [ ] page parameter validated and limited
- [ ] No negative or zero pagination values accepted
- [ ] Maximum perPage enforced at 100 or less
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Caching Only the First Page
### Category
Performance
### Description
Caching only the first page of search results while every deep page request triggers a new search engine query without caching.
### Why It Happens
Page 1 gets the most traffic and is the obvious caching target. Developers don't implement multi-page caching because they assume deep pages are rarely accessed.
### Warning Signs
- Page 1 search results are fast (cached); page 2+ are slow
- Identical queries to different pages hit the engine separately
- Cache hit ratio is high for page 1, zero for others
- No multi-page cache invalidation strategy
### Why Harmful
Many users navigate to page 2, 3, 4+ of popular search queries. Each of these uncached pages adds unnecessary load to the search engine. Users on deep pages experience much slower responses than page 1.
### Consequences
- Inconsistent user experience: page 1 fast, page 5 slow
- Higher search engine costs from unnecessary query volume
- More engine load than necessary for popular queries
### Alternative
Cache paginated search results using the query + page combination as the cache key, with appropriate TTL.
### Refactoring Strategy
1. Implement search result caching with cache key = `search:{query}:page:{n}:perPage:{m}`
2. Use Laravel's cache facade or dedicated search caching middleware
3. Set TTL based on data freshness requirements (5-60 minutes)
4. Implement cache invalidation on data changes (model saved event clears affected query caches)
5. Monitor cache hit ratio across all pages
### Detection Checklist
- [ ] Multi-page search caching implemented
- [ ] Cache key includes query, page, and filters
- [ ] Cache invalidation on data changes
- [ ] Cache hit ratio >50% for deep pages
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
