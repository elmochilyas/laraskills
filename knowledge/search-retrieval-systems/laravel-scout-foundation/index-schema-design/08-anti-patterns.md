# ECC Anti-Patterns — Index Schema Design
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Index Schema Design | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Dump-Everything Index Schema
2. Silent Filter/Sort Failure Schema
3. Untyped Numeric Field Schema
4. Orphaned Relation Schema
5. Multi-Tenant Blind Schema
---
## Repository-Wide Anti-Patterns
- Over-indexing: sending all model attributes to the search engine
- Ignoring engine-specific schema requirements (schema-free vs schema-enforced)
- Missing filterable/sortable attribute declarations
- Inconsistent type casting across indexed fields
---
## Anti-Pattern 1: Dump-Everything Index Schema
### Category
Performance | Security
### Description
Returning `$this->toArray()` from `toSearchableArray()` without filtering fields sends the entire model (including internal IDs, timestamps, and sensitive data) to the search index.
### Why It Happens
Developers take the default Scout behavior or assume more data is better for search. Adding Searchable trait without customization is the fastest path to working search.
### Warning Signs
- Index size grows linearly with every column added to the model
- Sensitive fields (password hashes, tokens) appear in search engine dashboards
- Scout import commands take progressively longer as schema evolves
### Why Harmful
Every unnecessary field increases index storage costs, slows indexing operations, and widens the attack surface. SaaS engines charge by index size and number of records.
### Consequences
- Higher monthly bills on Meilisearch Cloud, Algolia, or Typesense
- Slower search response times due to larger document payloads
- Accidental PII or credential exposure in search results API
- Index rebuilds take hours instead of minutes
### Alternative
Implement explicit field selection in `toSearchableArray()`, returning only fields required for search matching, filtering, and result display.
### Refactoring Strategy
1. Audit current `toSearchableArray()` output by logging `$this->toArray()` keys
2. Identify fields used in search results display and `where()` clauses
3. Remove internal IDs, timestamps, sensitive columns from the return array
4. Add type casts for numeric fields
5. Run `php artisan scout:flush` and `scout:import` to rebuild index with slim schema
### Detection Checklist
- [ ] `toSearchableArray()` overridden in every Searchable model
- [ ] No `$this->toArray()` calls in toSearchableArray
- [ ] Index size monitored and trend is stable
- [ ] Sensitive data scan performed on indexed documents
### Related Rules/Skills/Trees
- Rule: Only Index Fields Needed for Search and Display
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Searchable Trait Implementation Strategy
---
## Anti-Pattern 2: Silent Filter/Sort Failure Schema
### Category
Reliability | Maintainability
### Description
Adding fields to `toSearchableArray()` but failing to declare them as filterable or sortable in the engine's settings, causing `where()` and `orderBy()` calls to fail silently or return errors.
### Why It Happens
Search engines have separate schema declaration APIs beyond the indexed document. Developers assume that if a field exists in the document, it's automatically filterable or sortable. Meilisearch requires `filterableAttributes` configuration, Typesense requires explicit schema with `index:true`, Algolia has `attributesForFaceting`.
### Warning Signs
- `Model::search('...')->where('field', 'value')->get()` returns zero results without error
- Laravel logs contain search engine 4xx errors about unknown filter attributes
- Frontend filter controls produce empty results for valid data
### Why Harmful
Silent failures erode user trust. Developers waste hours debugging seemingly correct queries. Production incidents where search filters stop working after re-index.
### Consequences
- Users cannot filter search results, leading to poor UX
- Debugging sessions that end with "it was never configured" realization
- Emergency index setting changes during production incidents
### Alternative
Always declare filterable and sortable attributes in the search engine's index settings as part of the deployment process. Use `scout:sync-index-settings` to apply settings programmatically.
### Refactoring Strategy
1. List all fields used in `where()` and `orderBy()` calls across the codebase
2. For Meilisearch: add fields to `filterableAttributes` and `sortableAttributes` in index settings
3. For Typesense: ensure fields have `index: true` and correct `type` in collection schema
4. For Algolia: configure `attributesForFaceting` in index settings
5. Run `scout:sync-index-settings` to apply changes
6. Add integration test that verifies `where()` clauses return correct results
### Detection Checklist
- [ ] All `where()` fields declared as filterable in engine config
- [ ] All `orderBy()` fields declared as sortable
- [ ] `scout:sync-index-settings` part of deployment pipeline
- [ ] Test coverage for filtered search queries
### Related Rules/Skills/Trees
- Rule: Declare Filterable and Sortable Attributes Explicitly
- Skill: Optimize and Monitor Index Schema Design Production Search
- Decision Tree: Indexing Strategy Selection
---
## Anti-Pattern 3: Untyped Numeric Field Schema
### Category
Reliability | Performance
### Description
Sending numeric fields (prices, counts, ratings) to the search index as strings because PHP passes them as-is from the database without explicit type casting.
### Why It Happens
Eloquent attributes are often strings when read from the database. Developers trust the database type system. Most search engines index JSON payloads where uncast PHP values become strings.
### Warning Signs
- Sorting by price yields: 1, 100, 2, 200, 3 (lexicographic order)
- Range filters (`price > 50`) exclude items with price > 100
- Analytics dashboards show wrong aggregation on numeric fields
### Why Harmful
String-based numeric sorting produces incorrect ordering. Range filters behave unpredictably. Users see nonsensical sort orders and lose confidence in search.
### Consequences
- E-commerce search with price sorting shows cheapest items last
- Filtering by rating range returns wrong subset of results
- Analytics aggregations (avg, sum) produce garbage values
### Alternative
Explicitly cast numeric fields to `(int)` or `(float)` in `toSearchableArray()` before returning them.
### Refactoring Strategy
1. Identify all numeric fields in current `toSearchableArray()` implementations
2. Add explicit casts: `(int)` for whole numbers, `(float)` for decimals
3. For Meilisearch/Typesense, verify field types in schema match the cast type
4. Add sort and filter tests that verify numeric ordering is correct
5. Re-index after changes
### Detection Checklist
- [ ] All price/count/ID fields cast to (float)/(int)
- [ ] Sort order verified with integration tests
- [ ] Range filter tests pass for boundary values
- [ ] Engine schema shows correct field types (float, int32)
### Related Rules/Skills/Trees
- Rule: Use Typed Casts for Numeric Fields in toSearchableArray
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Orphaned Relation Schema
### Category
Design | Performance
### Description
Indexing a model without including its related data in `toSearchableArray()`, making it impossible to search or filter by related entity attributes.
### Why It Happens
Developers index the model in isolation, forgetting that users search by author name, category, or tags. The `Searchable` trait only syncs the model's own attributes by default.
### Warning Signs
- Users cannot search for "posts by John" when author name is a relation
- Filtering by category returns no results despite valid category data
- Developers write post-query collection filters to work around missing index fields
### Why Harmful
Search indexes are denormalized by design. Omitting relation data forces expensive post-query filtering, breaks search relevance, and requires complex workarounds.
### Consequences
- Poor search quality: users can't find content by related entities
- Application-layer filtering on large result sets causes timeouts
- Manual joins and collection manipulation in controllers
### Alternative
Denormalize related data directly into `toSearchableArray()` by accessing relationships within the method. Use `makeAllSearchableUsing()` to eager-load relations during batch import.
### Refactoring Strategy
1. Identify which related entity attributes users search/filter by
2. Add eager loading in `makeAllSearchableUsing()`
3. Include relation fields in `toSearchableArray()` return: `$this->author->name`
4. Add type casts for relation fields
5. Declare relation fields as filterable/sortable if needed
6. Re-index and verify relation data appears in search results
### Detection Checklist
- [ ] All searchable relation data included in toSearchableArray
- [ ] `makeAllSearchableUsing()` configured for batch import eager loading
- [ ] No post-query filtering on relation fields in controllers
- [ ] Relation field types cast correctly
### Related Rules/Skills/Trees
- Rule: Normalize Related Data in toSearchableArray
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Searchable Trait Implementation Strategy
---
## Anti-Pattern 5: Multi-Tenant Blind Schema
### Category
Security | Architecture
### Description
Designing an index schema without tenant or access-control fields, causing cross-tenant data leakage in multi-tenant search implementations.
### Why It Happens
Multi-tenancy is often added after initial search implementation. The schema was designed for single-tenant use. Developers forget that search results cross tenant boundaries without explicit filtering fields.
### Warning Signs
- Search results from other tenants appear in user queries
- No `tenant_id` or equivalent field in `toSearchableArray()`
- `where()` clauses in search queries don't include tenant filtering
### Why Harmful
Search becomes a data leakage vector. Users see other organizations' data. Compliance violations (GDPR, SOC 2) occur when tenant isolation is broken.
### Consequences
- Security incident from cross-tenant data exposure
- Compliance audit failures
- Emergency hotfix to add tenant filtering retroactively
### Alternative
Always include tenant identifier fields (tenant_id, organization_id, team_id) in `toSearchableArray()` and enforce tenant-scoped `where()` clauses on every search query.
### Refactoring Strategy
1. Add `tenant_id` (or equivalent) to `toSearchableArray()` return
2. Declare it as a filterable attribute in engine settings
3. Create a query scope or global scope that adds `->where('tenant_id', auth()->user()->tenant_id)` to every search
4. Add integration tests that verify tenant isolation
5. Re-index to populate tenant_id on existing documents
6. Audit all search endpoints for tenant-scoped filtering
### Detection Checklist
- [ ] Tenant identifier field in all Searchable model schemas
- [ ] Tenant filter applied to all search queries
- [ ] Integration test verifies tenant data isolation
- [ ] No search endpoint returns cross-tenant data
### Related Rules/Skills/Trees
- Rule: Include tenant/policy fields in index schema
- Skill: Optimize and Monitor Index Schema Design Production Search
- Decision Tree: Searchable Trait Implementation Strategy
