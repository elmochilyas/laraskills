# ECC Anti-Patterns — Meilisearch Search-as-You-Type
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Meilisearch Search-as-You-Type | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Missing Input Debouncing
2. Returning Full Page Results Instead of Limited Suggestions
3. No Minimum Character Threshold
4. Missing Request Deduplication
5. Not Using Prefix Search Optimization
---
## Repository-Wide Anti-Patterns
- Using full search endpoint for instant search instead of dedicated lightweight endpoint
- Not separating instant search concerns from full search concerns
- Ignoring cache for common prefix queries
---
## Anti-Pattern 1: Missing Input Debouncing
### Category
Performance | Cost
### Description
Sending search requests to Meilisearch on every keystroke without debouncing, overwhelming the engine with redundant queries.
### Why It Happens
Direct binding of input to search API call without delay logic.
### Warning Signs
- Network tab shows per-keystroke API calls
- Meilisearch query volume spikes during typing
- High Meilisearch costs from excessive queries
- UI stutters from constant result updates
### Why Harmful
Each keystroke is a full Meilisearch query. For a 10-character query, that's 10 queries instead of 1. Meilisearch pricing is per-query, and server resources are consumed unnecessarily.
### Consequences
- 10x cost increase for search engine
- Unnecessary server load on Meilisearch
- Poor UX from flickering results
- Rate limiting or throttling triggered
### Alternative
Debounce input at 200-300ms to fire search only after the user pauses typing.
### Refactoring Strategy
1. Add `.debounce.300ms` to input binding
2. Test rapid typing produces one API call after pause
3. Monitor query volume reduction
4. Target <100ms search response time for instant UX
### Detection Checklist
- [ ] Debounce implemented at 200-300ms
- [ ] Rapid typing produces limited API calls
- [ ] Query volume reduction benchmarked
- [ ] UX smooth without flickering
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Returning Full Page Results Instead of Limited Suggestions
### Category
Performance | User Experience
### Description
Returning full search results (10-50 items) for instant search instead of limited suggestions (5-10 items), causing slow response times and overloading the UI.
### Why It Happens
Developers reuse the same search controller and limit for both instant search and full search pages.
### Warning Signs
- Instant search returns 50 items in dropdown
- Slow response time for instant search queries
- Full product cards render in autocomplete dropdown
- Mobile: dropdown covers the entire screen
### Why Harmful
Returning full results slows down the response and overwhelms the UI. The instant search dropdown becomes cluttered and hard to navigate.
### Consequences
- Slower instant search responses
- Overwhelming dropdown with too many items
- Mobile UX disaster with full-width dropdown
- Users cannot quickly scan suggestions
### Alternative
Limit instant search to 5-10 lightweight suggestions (ID, title, thumbnail only).
### Refactoring Strategy
1. Create dedicated endpoint or parameter for instant search (e.g., `/search/instant`)
2. Use Scout's `take(5)` or `take(10)` to limit results
3. Return minimal fields: ID, title, URL, thumbnail
4. Keep response payload small for fast rendering
5. Test response time <100ms for instant endpoint
### Detection Checklist
- [ ] Instant search returns 5-10 results
- [ ] Dedicated endpoint for instant search
- [ ] Minimal fields returned
- [ ] Response time under 100ms
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: No Minimum Character Threshold
### Category
Performance | User Experience
### Description
Triggering Meilisearch queries before the user has typed enough characters, returning overly broad results and wasting queries.
### Why It Happens
No guard condition in the search function. The binding fires on any input change.
### Warning Signs
- Search fires on 1-2 character inputs
- Single character returns thousands of results
- Most queries under 3 characters are useless
- High query count from partial inputs
### Why Harmful
1-2 character queries are almost never useful. They waste Meilisearch queries and return results too broad to be actionable.
### Consequences
- Wasted Meilisearch query quota
- Users see useless broad results
- Slower perceived responsiveness
- Higher operational costs
### Alternative
Check for minimum 2-3 characters before executing the search query.
### Refactoring Strategy
1. Add character count check: `if (strlen($query) < 2) return []`
2. Show placeholder hint: "Type at least 2 characters"
3. Clear results when input drops below minimum
4. Adjust threshold based on content type (2 for products, 3 for SKUs)
### Detection Checklist
- [ ] Minimum 2-3 characters enforced
- [ ] Short inputs do not trigger search
- [ ] Results cleared below minimum
- [ ] Hint shown for minimum requirement
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Missing Request Deduplication
### Category
Reliability | User Experience
### Description
Not deduplicating concurrent search requests, causing race conditions where older responses overwrite newer ones or display incorrect results.
### Why It Happens
Debounce reduces but doesn't eliminate race conditions. Slow network or server can cause out-of-order responses.
### Warning Signs
- Search results occasionally show wrong results for current query
- Results flicker between old and new values
- Fast typists see results from previous query
- Race condition bugs in search observed intermittently
### Why Harmful
Out-of-order responses show users results for a query they typed 500ms ago. This creates confusion and undermines trust in the search feature.
### Consequences
- Users see irrelevant results for the current input
- Erratic search behavior hard to reproduce and debug
- Poor UX that degrades search perception
- Intermittent bugs that QA may miss
### Alternative
Implement request deduplication with an incrementing request ID or abort previous requests.
### Refactoring Strategy
1. Add request counter in component: increment on each search
2. Check counter in response handler: discard if counter changed
3. Or use Axios CancelToken to abort previous request
4. Test: type quickly, verify only latest response displays
5. Test: slow network, verify no stale results
### Detection Checklist
- [ ] Request deduplication implemented
- [ ] Out-of-order responses rejected
- [ ] Fast typing produces correct final results
- [ ] Slow network doesn't cause stale results
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Not Using Prefix Search Optimization
### Category
Performance | User Experience
### Description
Not leveraging Meilisearch's optimized prefix search for instant search, using full-text search instead which is slower for autocomplete patterns.
### Why It Happens
Developers use the same search method for instant search and full search, missing Meilisearch's prefix search optimization.
### Warning Signs
- Instant search slower than expected
- Full-text relevance applied when prefix would suffice
- No prefix-specific configuration in search parameters
- Autocomplete feels laggy despite Fast Meilisearch
### Why Harmful
Meilisearch's prefix search is significantly faster than full-text for progressive input. Using full-text for instant search wastes the engine's optimization for incremental queries.
### Consequences
- Slower autocomplete than Meilisearch is capable of
- Higher CPU usage on Meilisearch server
- Missing speed optimization for the most latency-sensitive search feature
- Users experience lag during typing
### Alternative
Configure Meilisearch instant search query with prefix matching enabled.
### Refactoring Strategy
1. Enable prefix matching in Meilisearch query parameters
2. Use Scout callback to pass prefix-specific parameters
3. Test instant search response time vs full-text
4. Verify prefix results are relevant for autocomplete
5. Benchmark response time improvement
### Detection Checklist
- [ ] Prefix matching configured for instant search
- [ ] Instant search response time benchmarked
- [ ] Prefix vs full-text performance compared
- [ ] Results relevant for autocomplete use case
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
