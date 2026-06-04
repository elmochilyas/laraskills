# ECC Anti-Patterns — Instant Search with Livewire
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Instant Search with Livewire | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. No Debounce on wire:model
2. Missing Loading State
3. Not Using withQueryString for Pagination
4. No Caching for Frequent Queries
5. Ignoring No-Results State
---
## Repository-Wide Anti-Patterns
- Using Livewire for high-traffic search without caching
- Complex search logic inside Livewire components instead of dedicated services
- Race conditions from multiple rapid search requests
---
## Anti-Pattern 1: No Debounce on wire:model
### Category
Performance | User Experience
### Description
Binding search input with `wire:model.live` without debounce, causing a server request on every keystroke.
### Why It Happens
Default `wire:model.live` fires on every input change. Developers must explicitly add debounce.
### Warning Signs
- Server requests on every keystroke visible in browser tools
- High network activity during typing
- Livewire component updates multiple times per second
- Slow typing produces visible lag and flickering results
### Why Harmful
Each keystroke triggers a full Livewire component lifecycle (hydration, server execution, re-rendering). This creates excessive server load and poor UX.
### Consequences
- 10x server load from rapid typing
- Poor mobile experience (battery, data)
- UI stutters from constant re-renders
- Server costs increase unnecessarily
### Alternative
Add `.debounce.300ms` to `wire:model.live` for search inputs.
### Refactoring Strategy
1. Change `wire:model.live` to `wire:model.live.debounce.300ms`
2. Test rapid typing produces single request after pause
3. Monitor server request volume reduction
4. Verify UX is smooth without flickering
### Detection Checklist
- [ ] wire:model has .debounce.300ms for search
- [ ] Rapid typing produces one server request
- [ ] Request volume reduced vs pre-debounce
- [ ] UX smooth without visible stutter
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Missing Loading State
### Category
User Experience | Accessibility
### Description
Not showing a loading indicator during Livewire search component updates, leaving users uncertain about search progress.
### Why It Happens
Livewire's seamless updates make loading states seem unnecessary for fast queries.
### Warning Signs
- Stale results shown while new search loads
- No spinner or skeleton during search updates
- Users confused about whether search is working
- Accessibility: no loading announcement for screen readers
### Why Harmful
Users see old results while new results load. They don't know if the search is processing or finished. This creates uncertainty and perceived slowness.
### Consequences
- Users retype queries thinking nothing happened
- Stale results confuse users
- Poor accessibility for screen reader users
- Perceived performance worse than actual
### Alternative
Use `wire:loading` to show a loading indicator during search component updates.
### Refactoring Strategy
1. Add `wire:loading` directive to show spinner during updates
2. Add `wire:target` to scope loading to the search input
3. Dim or hide stale results during loading
4. Add `wire:loading.class` for CSS transitions
5. Verify accessibility with screen reader
### Detection Checklist
- [ ] Loading state shown during search
- [ ] wire:loading directive used
- [ ] Stale results handled during loading
- [ ] Accessible loading announcement
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Not Using withQueryString for Pagination
### Category
User Experience | Maintainability
### Description
Not using Livewire's `WithQueryString` trait for search pagination, making search result pages not bookmarkable or shareable.
### Why It Happens
Developers implement simple page-based navigation without URL synchronization.
### Warning Signs
- Search page URL doesn't update on pagination
- Page 2 of search results not shareable via URL
- Browser back/forward doesn't navigate search history
- Search state lost on page refresh
### Why Harmful
Users cannot bookmark or share specific search result pages. The back button doesn't work intuitively. Search state resets on refresh, frustrating users who found interesting results.
### Consequences
- SEO impact: search result pages not indexable
- Users cannot share or save search results
- Poor navigation experience with broken back button
- Increased bounce rate from lost search state
### Alternative
Use Livewire's `WithQueryString` trait to sync search state with URL query parameters.
### Refactoring Strategy
1. Add `WithQueryString` trait to Livewire search component
2. Define search query and page as query string parameters
3. Update search to read initial state from query string
4. Test: paginate and verify URL updates
5. Test: share URL and verify search results match
### Detection Checklist
- [ ] WithQueryString trait used for search
- [ ] Search query in URL
- [ ] Page number in URL
- [ ] Bookmarkable search URLs work
- [ ] Back/forward navigates search history
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: No Caching for Frequent Queries
### Category
Performance | Cost
### Description
Not caching search results in Livewire, causing identical queries to re-execute on every page load or component mount.
### Why It Happens
Livewire encourages reactive thinking. Caching feels like premature optimization.
### Warning Signs
- Same search term triggers server query on every visit
- Popular search terms executed thousands of times identically
- Search engine load correlates with traffic, not unique queries
- Cache store empty for search results
### Why Harmful
Popular search queries are executed identically hundreds of times per day. Each execution consumes search engine quota, server CPU, and database resources for identical results.
### Consequences
- Higher search engine costs (Algolia/Meilisearch per-query pricing)
- Unnecessary server load from repeated queries
- Slower response for unique queries due to shared resource contention
- Cache miss penalties add up
### Alternative
Cache search results with short TTL (60-300 seconds) for common queries.
### Refactoring Strategy
1. Identify most frequent search queries from logs
2. Implement result caching in the search service (Redis or Cache facade)
3. Set TTL of 60s for active queries, 300s for stable results
4. Invalidate cache when indexed data changes
5. Monitor cache hit rate and adjust TTL
### Detection Checklist
- [ ] Search result caching implemented
- [ ] Cache hit rate monitored
- [ ] TTL configured appropriately
- [ ] Cache invalidated on data changes
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Ignoring No-Results State
### Category
User Experience | Data Quality
### Description
Not handling zero-result searches in the Livewire component, showing blank results section with no feedback.
### Why It Happens
Developers iterate over search results in Blade and don't add an empty-state branch.
### Warning Signs
- Search results section empty but component re-rendered
- No "no results found" message
- Blank area where search results should appear
- Users confused whether search was performed
### Why Harmful
Zero results with no feedback creates uncertainty. Users don't know if the search failed, returned nothing, or is still loading.
### Consequences
- Users assume search is broken
- Abandonment on zero-result searches
- No guidance for finding alternatives
- Negative search perception
### Alternative
Show a "no results" message with suggestions in the Livewire component when results are empty.
### Refactoring Strategy
1. Add empty results check in the Blade template
2. Show "No results found for [query]" message
3. Provide alternatives: popular searches, broader terms suggestion
4. Show contact/support option for reporting missing content
5. Style empty state consistent with rest of the design
### Detection Checklist
- [ ] Empty results handled in Blade template
- [ ] Clear no-results message shown
- [ ] Alternatives or suggestions provided
- [ ] Empty state designed consistently
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
