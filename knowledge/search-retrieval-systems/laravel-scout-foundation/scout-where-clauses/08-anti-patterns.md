# ECC Anti-Patterns — Scout where / whereIn / whereNotIn
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Scout where / whereIn / whereNotIn | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Filtering on Non-Indexed Attributes
2. Post-Query Collection Filtering Instead of Engine Filters
3. Complex Boolean Logic in Where Clauses
4. Deep WhereIn with Thousands of Values
5. Missing Tenant Isolation in Search Filters
---
## Repository-Wide Anti-Patterns
- Assuming all model attributes are automatically filterable
- Using post-query ->filter() on large search result sets
- Not synchronizing filterable attributes declaration with engine config
---
## Anti-Pattern 1: Filtering on Non-Indexed Attributes
### Category
Reliability
### Description
Using `where('field', 'value')` on a field that isn't included in `toSearchableArray()` and isn't declared as filterable in the search engine's index settings.
### Why It Happens
Developers assume Scout's `where()` works like Eloquent's `where()` — any database column should work. They don't realize Scout filters operate on the search index, not the database.
### Warning Signs
- `Model::search('...')->where('some_field', 'x')` returns 0 results with valid data
- No error or warning — filters silently return empty
- Adding a filter breaks search results that worked without it
- Developer adding new filterable attribute forgets to update index settings
### Why Harmful
Silent failures are the most dangerous type. Developers waste hours debugging "correct" code. Production incidents where users can't filter results despite valid data. The filter returns empty, not an error.
### Consequences
- Users see "no results" when filters are applied
- Debugging sessions spanning hours across Scout config and model code
- Emergency config changes to add missing filterable attributes
### Alternative
Only filter on fields explicitly included in `toSearchableArray()` and declared as filterable in the search engine's index settings.
### Refactoring Strategy
1. Identify all `where()` fields used across search queries
2. Ensure each field is in `toSearchableArray()`
3. Declare each field as filterable in engine index settings
4. For Meilisearch: add to `filterableAttributes`
5. For Typesense: set `index: true` on the field in collection schema
6. Test filtered queries return expected results
7. Add CI check that validates filter fields exist in schema
### Detection Checklist
- [ ] All where() fields in toSearchableArray()
- [ ] All filterable fields declared in engine settings
- [ ] Integration test verifies filtered search returns correct results
- [ ] CI validates filter fields match index schema
### Related Rules/Skills/Trees
- Rule: Declare Filterable and Sortable Attributes Explicitly
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Post-Query Collection Filtering Instead of Engine Filters
### Category
Performance | Scalability
### Description
Fetching all search results and then filtering them in PHP using collection methods (`->filter()`, `->reject()`, `->where()`) instead of using Scout's engine-level `where()`.
### Why It Happens
Developers are more familiar with Laravel collections than Scout's filter API. They fetch results, then apply collection operations, not realizing the performance cost.
### Warning Signs
- Search queries return thousands of results then filter to a few
- High memory usage on search result pages
- Slow response times despite fast search engine queries
- Collection methods like ->filter() or ->reject() chained after ->get()
### Why Harmful
Search engines are optimized for filtering — they can filter at the index level before returning results. Post-query filtering means the application downloads all matching documents and discards most of them, wasting bandwidth, memory, and time.
### Consequences
- High memory usage from large result sets
- Slow page loads as PHP filters thousands of records
- Increased network transfer from search engine to app
- Inefficient use of search engine capabilities
### Alternative
Use Scout's `where()` clause for all filtering that can be expressed at the engine level. Reserve post-query filtering for logic that can't be expressed in the engine (e.g., complex business rules).
### Refactoring Strategy
1. Identify all post-query collection filters on search results
2. Move filter logic to Scout `where()` clauses where possible
3. For complex filters: combine engine-level approximate filter + post-query refinement
4. For unsupported filters: document and isolate in dedicated methods
5. Test performance improvement after refactoring
### Detection Checklist
- [ ] All simple filters moved to Scout where() clauses
- [ ] No collection->filter() on search results for engine-filterable fields
- [ ] Post-query filtering only for business logic not expressible in engine
- [ ] Response times improved after refactoring
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Complex Boolean Logic in Where Clauses
### Category
Reliability | Maintainability
### Description
Using complex AND/OR nesting in Scout `where()` clauses that exceed the search engine's boolean logic capabilities, causing broken queries or incomplete results.
### Why It Happens
Developers construct complex conditional filters combining multiple AND/OR conditions, assuming Scout will translate them correctly. Each engine has different limitations for boolean query structure.
### Warning Signs
- Search queries with `->where('a', 1)->orWhere('b', 2)->where('c', 3)` produce wrong results
- Complex filter UI in the frontend produces unexpected search results
- Integration tests fail with specific filter combinations
- Algolia or Meilisearch error logs show boolean query parsing errors
### Why Harmful
Boolean query semantics vary across engines. Algolia applies AND between top-level conditions. Meilisearch uses filter expressions with limited nesting. Queries that work in development may produce wrong results in production with different engine configurations.
### Consequences
- Wrong search results from misunderstood boolean logic
- Hard-to-debug filter combinations
- Different behavior across environments (dev sync vs prod queue)
### Alternative
Simplify boolean conditions to flat AND clauses where possible. Use engine-specific callback API for complex boolean logic.
### Refactoring Strategy
1. Review complex boolean logic search queries
2. Decompose into simpler sequential filters if possible
3. For Algolia: use numeric filters with AND/OR syntax in callback
4. For Meilisearch: use filter expressions with parentheses
5. Test all filter combinations with integration tests
6. Document boolean logic behavior per engine
### Detection Checklist
- [ ] Boolean query semantics understood per engine
- [ ] Complex filters tested with integration tests
- [ ] Flat AND clauses preferred over nested OR conditions
- [ ] Engine-specific callback used for complex logic
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Deep WhereIn with Thousands of Values
### Category
Performance
### Description
Passing thousands of values to `whereIn()` (e.g., `whereIn('id', [1,2,3,...10000])`), exceeding the search engine's filter value limits or causing extremely slow queries.
### Why It Happens
Applications that filter by IDs from previous queries or user permissions generate large ID lists. Developers assume whereIn handles any array size.
### Warning Signs
- Search queries with whereIn containing 1000+ IDs
- Engine returns timeout or payload too large errors
- Search page takes >5 seconds to load
- Filter array is assembled dynamically from another query result
### Why Harmful
Search engines have limits on filter value counts (Algolia: 10K values per filter, Meilisearch: varies). Large whereIn arrays increase query processing time exponentially on some engines.
### Consequences
- Timeout errors on search queries
- Truncated results: engine silently ignores values beyond its limit
- Very slow query response times
### Alternative
Use index-level tagging or faceted values instead of ID lists. Pre-calculate allowed IDs in the application and pass them as a concise filter.
### Refactoring Strategy
1. Replace whereIn with faceted filters or tags in the index schema
2. For access control: add a permission/tag field to toSearchableArray()
3. Use `->where('access_level', 'public')` instead of `->whereIn('id', $allowedIds)`
4. If whereIn is unavoidable: chunk into batches of 500 and merge results
5. Monitor filter value counts in production
### Detection Checklist
- [ ] No whereIn() with 1000+ values
- [ ] Index-level tags/facets used for large set filtering
- [ ] Filter value count within engine limits
- [ ] Query response time acceptable for filter complexity
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
---
## Anti-Pattern 5: Missing Tenant Isolation in Search Filters
### Category
Security
### Description
Search queries that don't include tenant-ID filters, causing cross-tenant data leakage in multi-tenant applications where all tenants share a search index.
### Why It Happens
Multi-tenancy is added after search implementation. The original search queries don't include tenant filtering. Teams forget to add the filter when migrating to shared index.
### Warning Signs
- Tenant A users can search for Tenant B's data
- No `tenant_id` filter in search query builder chains
- Search results include records from all tenants
- `->where('tenant_id', ...)` never appears in search controller code
### Why Harmful
This is a direct data leakage vulnerability. Every search endpoint becomes a cross-tenant data breach vector. Compliance violations (GDPR, SOC 2, HIPAA) occur when tenant isolation is broken.
### Consequences
- Security incident: cross-tenant data exposure
- Compliance audit failure
- Legal liability from tenant data breach
- Emergency hotfix to add tenant filtering
### Alternative
Always include tenant-ID filtering in every search query, either globally (via global scope) or explicitly in each search controller.
### Refactoring Strategy
1. Add tenant_id field to toSearchableArray() on multi-tenant models
2. Declare tenant_id as filterable in engine settings
3. Create a global search scope that appends `->where('tenant_id', tenant()->id)`
4. Or add a search macro that includes tenant filtering
5. Update all search endpoints to use the tenant-scoped search
6. Add integration tests that verify tenant isolation in search
### Detection Checklist
- [ ] tenant_id filter in all search queries
- [ ] Global scope or search macro enforces tenant isolation
- [ ] Integration test verifies cross-tenant data is invisible
- [ ] No search endpoint returns data from other tenants
### Related Rules/Skills/Trees
- Rule: Include tenant/policy fields for multi-tenant filtering
- Skill: Configure and Implement Index Schema Design
