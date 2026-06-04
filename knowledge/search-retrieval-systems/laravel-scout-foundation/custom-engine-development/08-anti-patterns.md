# ECC Anti-Patterns — Custom Engine Development
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Custom Engine Development | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Building from Scratch When Community Package Exists
2. Incorrect map() Implementation
3. Missing Graceful Degradation
4. Ignoring Scout Conventions and Return Types
5. Not Testing the Full 8-Method Contract
---
## Repository-Wide Anti-Patterns
- Reimplementing existing community packages
- Not leveraging Scout's built-in pagination, queue, and event infrastructure
- Tight coupling custom engine to a specific backend version
---
## Anti-Pattern 1: Building from Scratch When Community Package Exists
### Category
Maintainability | Productivity
### Description
Writing a full custom Scout engine instead of using an existing community package, wasting development time on reinventing well-tested integrations.
### Why It Happens
Not-invented-here syndrome. Developers assume their requirements are unique. They don't search Packagist before building.
### Warning Signs
- Hours or days spent implementing a custom engine
- Custom engine code in the application repo
- No composer.json dependency for the search backend integration
- README doesn't reference an existing package
### Why Harmful
Community packages are battle-tested across many applications and server configurations. Custom engines have unknown bugs, missing edge-case handling, and ongoing maintenance burden.
### Consequences
- Development time wasted on infrastructure instead of features
- Bugs that the community package already solved
- Ongoing maintenance burden for engine compatibility updates
### Alternative
Always check Packagist for existing Scout engine packages before building custom.
### Refactoring Strategy
1. Search Packagist for `scout` + your backend name
2. Install and configure the community package
3. Migrate custom engine functionality to leverage the package
4. Remove custom engine code
5. Contribute improvements back to the package if needed
### Detection Checklist
- [ ] No community package exists for the backend before building
- [ ] Search performed on Packagist first
- [ ] Custom engine only for truly unsupported backends
- [ ] Maintenance plan documented for custom engine
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Incorrect map() Implementation
### Category
Reliability
### Description
Implementing the `map()` method incorrectly by returning unsorted results, incomplete model collections, or wrong key-value mappings, causing search results to display wrong data.
### Why It Happens
The `map()` method must return an Eloquent collection in the same order as the search results, with Scout's `searchable` key for highlighting. This contract is easy to get wrong.
### Warning Signs
- Search results show wrong attribute values
- Results order differs between search pages
- Highlighting/matching information missing from results
- Model hydration fails with "key not found" errors
### Why Harmful
Incorrect map() breaks the entire search experience. Users see wrong data in wrong order. Search result highlighting doesn't work. The most basic search functionality fails.
### Consequences
- Users see incorrect search results
- Debugging map() logic is time-consuming
- Search feature is effectively broken despite correct indexing
### Alternative
Follow Scout's map() contract exactly: return models in search result order, include `searchable` key, use `$model->newCollection()`.
### Refactoring Strategy
1. Study Scout's built-in engine map() implementations as reference
2. Ensure results maintain search engine order
3. Include `$result['searchable']` or equivalent for highlighting
4. Use `$models = $model->newCollection()` for collection creation
5. Test map() with known dataset and verify correct ordering
### Detection Checklist
- [ ] map() returns models in search engine order
- [ ] Highlighting data preserved in results
- [ ] No "key not found" model hydration errors
- [ ] map() tested with known search results
### Related Rules/Skills/Trees
- Skill: Custom Engine Development
---
## Anti-Pattern 3: Missing Graceful Degradation
### Category
Reliability | Operations
### Description
Not implementing error handling in the custom engine for backend failures, causing 500 errors for all users when the search backend is unavailable.
### Why It Happens
Custom engines focus on happy-path implementation. Developers assume the backend is always available.
### Warning Signs
- Custom engine throws exceptions on connection failures
- No fallback to database engine or empty results on backend failure
- 500 errors for all search when backend is down
- No monitoring for backend health
### Why Harmful
A search backend outage becomes an application outage. Users cannot use any feature that depends on search. No graceful degradation: they get error pages instead of empty results.
### Consequences
- Full application downtime during search backend outage
- User-facing error pages for search-dependent features
- Operations team can't gracefully disable search
### Alternative
Implement try-catch in search methods, returning empty results on backend failure. Consider fallback to database engine.
### Refactoring Strategy
1. Wrap all engine backend calls in try-catch blocks
2. Return empty search results on failure
3. Log backend errors for operations monitoring
4. Optionally implement fallback to database engine
5. Add health check endpoint for backend status
### Detection Checklist
- [ ] Graceful degradation on backend failure
- [ ] Empty results returned instead of 500 errors
- [ ] Backend errors logged and monitored
- [ ] Health check monitors backend connectivity
### Related Rules/Skills/Trees
- Skill: Custom Engine Development
---
## Anti-Pattern 4: Ignoring Scout Conventions and Return Types
### Category
Maintainability | Reliability
### Description
Implementing custom engine methods that return non-standard types or ignore Scout's expected data structures, causing compatibility issues with Scout's paginator, map, and queue features.
### Why It Happens
Developers implement methods based on their backend's response format rather than Scout's expected return types. They adapt the response to fit the engine's native format instead of Scout's contract.
### Warning Signs
- `search()` returns a different structure than expected by `map()`
- `paginate()` doesn't support Scout's paginator
- `getTotalCount()` returns wrong type or format
- Scout's queue integration doesn't work with the custom engine
### Why Harmful
Scout's downstream features (pagination, queue, model mapping) depend on specific return types from engine methods. Wrong return types break all of these features silently.
### Consequences
- Pagination broken for custom engine searches
- Queue index updates don't work
- Model hydration failures in map()
### Alternative
Strictly follow Scout's contract for return types. Study existing engine implementations as reference.
### Refactoring Strategy
1. Review Laravel\Scout\Engines\Engine contract for exact return types
2. Study MeilisearchEngine or DatabaseEngine as reference implementations
3. Ensure `search()` returns raw results, `map()` returns Eloquent collection
4. Ensure `getTotalCount()` returns int, `paginate()` supports Scout paginator
5. Test all Scout features (queue, paginate, map) with the custom engine
### Detection Checklist
- [ ] Return types match Scout Engine contract exactly
- [ ] Scout paginator works with custom engine
- [ ] Queue integration functional
- [ ] map() returns correct Eloquent collection type
### Related Rules/Skills/Trees
- Skill: Custom Engine Development
---
## Anti-Pattern 5: Not Testing the Full 8-Method Contract
### Category
Testing | Reliability
### Description
Only testing the `search()` and `update()` methods of a custom engine while leaving `map()`, `mapIds()`, `paginate()`, `getTotalCount()`, `flush()`, and `delete()` untested.
### Why It Happens
Developers focus on the primary search flow. The other methods seem "obvious" or are assumed to work based on implementation.
### Warning Signs
- Tests cover only the search() method
- No test for flush() (delete all records)
- No test for pagination with custom engine
- map() tested implicitly only, not explicitly
### Why Harmful
Untested methods fail in production during specific operations. Flush accidentally deletes all data. Pagination returns wrong page counts. Map works for one dataset but fails for another.
### Consequences
- Production incidents from untested engine methods
- Data loss from incorrectly implemented flush()
- Pagination broken for large result sets
### Alternative
Write integration tests for all 8 Engine methods with known data sets.
### Refactoring Strategy
1. Create test fixtures with known records
2. Write unit/integration tests for each method: update, delete, search, paginate, map, mapIds, getTotalCount, flush
3. Test edge cases: empty results, large result sets, backend timeout
4. Test pagination with various page sizes
5. Test flush then verify index is empty
### Detection Checklist
- [ ] All 8 Engine methods have dedicated tests
- [ ] Pagination tested with various perPage values
- [ ] Flush tested with verification
- [ ] map() tested with known result order
- [ ] Backend failure scenarios covered
### Related Rules/Skills/Trees
- Skill: Custom Engine Development
