# ECC Anti-Patterns — Scout Searchable Trait
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Scout Searchable Trait | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Base Model Searchable Trait
2. Searchable Trait Without Customization
3. Missing shouldBeSearchable Gate
4. Default Index Naming
5. No Type Casting on Indexed Fields
---
## Repository-Wide Anti-Patterns
- Adding Searchable to every model indiscriminately
- Not implementing toSearchableArray() alongside the trait
- Expecting the trait to handle soft deletes automatically
---
## Anti-Pattern 1: Base Model Searchable Trait
### Category
Architecture | Performance
### Description
Adding the `Searchable` trait to a base model class (e.g., `App\Models\Model`), causing every model in the application to be automatically indexed.
### Why It Happens
Developers put common traits on base models for convenience. They don't realize the Searchable trait triggers index operations on every model save across the entire application.
### Warning Signs
- Every model table has a corresponding search index
- Log/tracking models appear in search results
- Search engine bill includes charges for models that should never be searchable
### Why Harmful
Every model save in the application triggers a search engine API call. Models like logs, pivots, and settings waste index storage and API quota. Search results are polluted with non-content models.
### Consequences
- Unnecessary search engine costs for non-content models
- Slower saves across the entire application
- Cluttered search results with irrelevant model types
- API rate limit hits from excessive indexing
### Alternative
Add the `Searchable` trait only to individual models that need search functionality.
### Refactoring Strategy
1. Remove `Searchable` from base model class
2. Add `Searchable` trait only to content models (Post, Product, User, etc.)
3. Add `use Searchable;` and customize `toSearchableArray()` per model
4. Delete indexes for non-searchable models
5. Re-index remaining models
### Detection Checklist
- [ ] Searchable trait not on base model class
- [ ] Only content models have Searchable trait
- [ ] No indexes for log, pivot, or meta models
- [ ] Search engine cost correlates with content model count
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Searchable Trait Implementation Strategy
---
## Anti-Pattern 2: Searchable Trait Without Customization
### Category
Performance | Security
### Description
Adding the Searchable trait to a model without overriding `toSearchableArray()`, `shouldBeSearchable()`, or `searchableAs()`, relying entirely on default behavior.
### Why It Happens
The Searchable trait works immediately. Developers add it, confirm search returns results, and move on without tuning.
### Warning Signs
- No `toSearchableArray()` override in any Searchable model
- Default index names (model table names) in search engine
- All model attributes indexed including sensitive fields
### Why Harmful
Uncustomized Searchable trait sends all model data to the search engine, uses default naming that may conflict, and indexes all records regardless of status.
### Consequences
- Index bloat from unnecessary fields
- Potential data exposure of sensitive attributes
- Index name conflicts in multi-model searches
- Draft/unpublished records appearing in search
### Alternative
Always customize `toSearchableArray()` (field selection), `shouldBeSearchable()` (visibility gate), and `searchableAs()` (index naming) when adding the Searchable trait.
### Refactoring Strategy
1. Audit all Searchable models for customizations
2. Add `toSearchableArray()` to models using defaults
3. Add `shouldBeSearchable()` for visibility gating
4. Add `searchableAs()` for descriptive index names
5. Re-index after changes
### Detection Checklist
- [ ] toSearchableArray() customized on all Searchable models
- [ ] shouldBeSearchable() implemented for published/draft gating
- [ ] searchableAs() returns descriptive, unique index name
- [ ] Sensitive fields excluded from index
### Related Rules/Skills/Trees
- Rule: Only Index Fields Needed for Search and Display
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Missing shouldBeSearchable Gate
### Category
Security | Reliability
### Description
Not implementing `shouldBeSearchable()`, causing all records including drafts, archived items, and soft-deleted records to appear in search results.
### Why It Happens
The Searchable trait does not gate by default. Developers must explicitly implement the gate. Many teams are unaware this method exists.
### Warning Signs
- Draft posts appear in public search results
- Archived products are discoverable
- Soft-deleted records appear after trashing
- Unverified user profiles are searchable
### Why Harmful
Restricted content leaks through search. Draft content, unpublished items, and unverified users become publicly discoverable, creating security and compliance issues.
### Consequences
- Internal/unpublished content exposure
- SEO indexing of draft pages
- Compliance violations for unverified user data exposure
- Manual content unpublishing needed post-incident
### Alternative
Implement `shouldBeSearchable()` on every Searchable model to gate indexing based on publication status, verification state, and active status.
### Refactoring Strategy
1. Add `shouldBeSearchable(): bool` to each Searchable model
2. Define conditions: `return $this->status === 'published' && $this->trashed() === false;`
3. Run scout:import to re-index with new gating rules
4. Verify restricted records are removed from search
5. Add test coverage for visibility gating
### Detection Checklist
- [ ] shouldBeSearchable() on all Searchable models
- [ ] Draft records excluded from search index
- [ ] Archived records excluded from search index
- [ ] Soft-deleted records excluded
- [ ] Test coverage for gating logic
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Indexing Strategy Selection
---
## Anti-Pattern 4: Default Index Naming
### Category
Maintainability | Design
### Description
Using Scout's default index naming (model table name) without overriding `searchableAs()`, causing name collisions and confusing index identification in the search engine dashboard.
### Why It Happens
Default behavior (model table name) works for simple setups. Developers don't override it until naming collisions occur.
### Warning Signs
- Index names are generic (`posts`, `users`, `products`)
- Multiple environments (dev/staging/prod) write to same index
- Cannot distinguish which application or environment owns an index
### Why Harmful
Default index names collide in shared search engine accounts. Staging environment overwrites production data. Multi-tenant setups leak data between tenants via shared index names.
### Consequences
- Staging index overwrites production search data
- Confusion in search engine admin dashboard (which app owns this index?)
- Multi-tenant data leakage via shared index names
### Alternative
Override `searchableAs()` to return descriptive, environment-specific index names (e.g., `posts_production`, `posts_staging`).
### Refactoring Strategy
1. Override `searchableAs()` on each Searchable model
2. Return names with environment prefix: `config('app.env').'_'.$this->getTable()`
3. For multi-tenant: include tenant identifier in name
4. Update search queries to use the custom names
5. Re-index to populate new indices
6. Delete old default-named indices
### Detection Checklist
- [ ] searchableAs() returns environment-specific names
- [ ] No index name conflicts between environments
- [ ] Multi-tenant setups have isolated indices
- [ ] Old default indices deleted after migration
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Searchable Trait Implementation Strategy
---
## Anti-Pattern 5: No Type Casting on Indexed Fields
### Category
Reliability
### Description
Returning raw database values from `toSearchableArray()` without type casting, causing string-based sorting/filtering issues in the search engine.
### Why It Happens
Eloquent returns values as strings by default. Developers trust the database column types and assume the search engine will interpret types correctly from JSON payloads.
### Warning Signs
- Sort by price yields incorrect order (100 < 9 alphabetically)
- Date range filters return wrong results
- Boolean filters fail to match
### Why Harmful
Search engines index JSON payloads verbatim. String '100' sorts before string '9'. Boolean `true` becomes string `'1'`. Date objects become string timestamps. Range queries and sorting break silently.
### Consequences
- User-facing sort order is wrong
- Filter by numeric range broken
- Analytics aggregations produce nonsense
### Alternative
Explicitly cast all numeric, boolean, and date fields to their correct PHP types before returning from `toSearchableArray()`.
### Refactoring Strategy
1. Identify all numeric, boolean, date fields in toSearchableArray
2. Add explicit casts: (int), (float), (bool), Carbon::parse()->timestamp
3. Re-index to fix type representations
4. Add sort/filter integration tests
### Detection Checklist
- [ ] Price/count fields cast to (float)/(int)
- [ ] Boolean fields cast to (bool)
- [ ] Date fields cast to timestamp or ISO string
- [ ] Sort order verified with integration tests
### Related Rules/Skills/Trees
- Rule: Use Typed Casts for Numeric Fields in toSearchableArray
- Skill: Configure and Implement Index Schema Design
